import { and, count, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteSettings, user } from "@/lib/db/schema";

/**
 * Role changes and account removal — the two operations `/admin/users` performs.
 *
 * ## Why this is hand-written rather than better-auth's `admin()` plugin
 *
 * The plugin was the roadmap's first suggestion. It was not taken, and the
 * reasoning belongs in the code because it is the kind of decision that gets
 * re-litigated:
 *
 * 1. **It needs a migration.** The plugin adds `user.banned`, `user.ban_reason`,
 *    `user.ban_expires` and `session.impersonated_by`. This approach adds no
 *    columns at all — `site_settings.updated_by` already existed for exactly this
 *    purpose.
 * 2. **Banning is meaningless here.** Accounts are not self-service; every one of
 *    them was invited. When a relationship ends you remove the account, and
 *    removal is already here.
 * 3. **It ships impersonation.** An endpoint that lets one account act as another
 *    is a capability nobody asked for on a single-owner site, and one that would
 *    have to be reasoned about in every future security review. Not shipping it is
 *    cheaper than shipping it carefully.
 * 4. **The seat gate already talks to the database directly.** Two mechanisms for
 *    one table would be worse than one.
 *
 * The plugin becomes the right answer the day this needs banning, impersonation,
 * or a user base large enough that hand-written queries stop being obviously
 * correct. `docs/admin-guide.md` records that.
 *
 * ## The invariants
 *
 * - **An account is never left without an administrator.** Demoting or deleting
 *   the last admin is refused — that is an unrecoverable lockout, and the only
 *   way back in would be SQL against a database you can no longer reach through
 *   the app.
 * - **The check is serialised.** "Count the admins, then act" is a race if two
 *   requests run at once; both could read "2" and both could proceed. The count
 *   happens inside a transaction that first takes `SELECT … FOR UPDATE` on the
 *   `site_settings` row — the same lock the seat gate uses, for the same reason.
 */

const SETTINGS_ID = "primary";

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Narrows an untrusted value — a form field can be any string at all. */
export function parseRole(raw: unknown): Role | null {
  return typeof raw === "string" && (ROLES as readonly string[]).includes(raw)
    ? (raw as Role)
    : null;
}

/**
 * A closed vocabulary of outcomes.
 *
 * The result of a row action travels back to the page in the query string, and
 * **a query string is attacker-supplied**. Redirecting with a finished sentence
 * would mean a crafted link to
 * `/admin/users?error=<text of the attacker's choosing>` rendering that text on
 * the admin page in this site's own styling — a phishing surface aimed at the one
 * account that matters. So actions return a code, and the copy lives in
 * `lib/admin/messages.ts` where nothing from the request can reach it.
 *
 * (`updateSettings` is exempt because it returns its message to
 * `useActionState` directly, and never through a URL.)
 */
export type UserActionCode =
  | "role_changed"
  | "role_changed_self"
  | "role_unchanged"
  | "account_removed"
  | "account_removed_self"
  | "account_missing"
  | "last_admin_demote"
  | "last_admin_delete"
  | "bad_request";

export type UserActionResult = {
  ok: boolean;
  code: UserActionCode;
};

/** The drizzle transaction handle, named once. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Takes the seat-gate lock, creating the row first if this database is fresh.
 *
 * Everything that reads a count and then writes based on it goes through here.
 * Locking a row that is guaranteed to exist is simpler than locking a table, and
 * it serialises exactly the operations that need it.
 */
async function lockSettings(tx: Tx): Promise<void> {
  await tx
    .insert(siteSettings)
    .values({ id: SETTINGS_ID })
    .onConflictDoNothing();

  await tx
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .for("update");
}

/**
 * Promotes or demotes an account.
 *
 * @param actorId the administrator performing the change. Used to make the
 *   "you just demoted yourself" and "you just demoted the last admin" messages
 *   say which one happened.
 */
export async function changeUserRole(input: {
  actorId: string;
  targetId: string;
  role: Role;
}): Promise<UserActionResult> {
  const { actorId, targetId, role } = input;

  return db.transaction(async (tx) => {
    await lockSettings(tx);

    const [target] = await tx
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, targetId))
      .limit(1);

    if (!target) {
      return { ok: false, code: "account_missing" };
    }

    if (target.role === role) {
      return { ok: false, code: "role_unchanged" };
    }

    const isSelf = target.id === actorId;

    // Only demotion can empty the role, so only demotion needs the check.
    if (target.role === "admin" && role === "user") {
      const [row] = await tx
        .select({ total: count() })
        .from(user)
        .where(eq(user.role, "admin"));

      if ((row?.total ?? 0) <= 1) {
        return { ok: false, code: "last_admin_demote" };
      }
    }

    await tx.update(user).set({ role }).where(eq(user.id, targetId));

    // Demoting yourself is allowed — there is another admin, or the guard above
    // would have refused — but it is the one role change with a consequence the
    // operator will not see until they next click something.
    return {
      ok: true,
      code: isSelf && role === "user" ? "role_changed_self" : "role_changed",
    };
  });
}

/**
 * Removes an account.
 *
 * Sessions and linked OAuth accounts cascade from the foreign keys, so the seat
 * is freed and the person cannot sign back in. **What that does not do
 * immediately:** a signed-in reader holds a 5-minute signed cookie cache, so
 * their *existing* session can still satisfy a page that honours the cache for up
 * to five minutes. `/admin*` bypasses the cache, so their administrative access
 * ends at once. Stated here because it is the kind of detail that is surprising
 * exactly once, at the worst moment.
 */
export async function removeUser(input: {
  actorId: string;
  targetId: string;
}): Promise<UserActionResult> {
  const { actorId, targetId } = input;

  return db.transaction(async (tx) => {
    await lockSettings(tx);

    const [target] = await tx
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, targetId))
      .limit(1);

    if (!target) {
      return { ok: false, code: "account_missing" };
    }

    const isSelf = target.id === actorId;

    if (target.role === "admin") {
      const [row] = await tx
        .select({ total: count() })
        .from(user)
        .where(and(eq(user.role, "admin"), ne(user.id, targetId)));

      if ((row?.total ?? 0) === 0) {
        return { ok: false, code: "last_admin_delete" };
      }
    }

    await tx.delete(user).where(eq(user.id, targetId));

    return {
      ok: true,
      code: isSelf ? "account_removed_self" : "account_removed",
    };
  });
}
