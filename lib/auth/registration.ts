import { APIError } from "better-auth/api";
import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteSettings, user } from "@/lib/db/schema";

/**
 * The seat gate — roadmap item 6.
 *
 * "Once one person registers, the registration portal must close; the allowable
 * user count should be changeable in the DB."
 *
 * Two rules make that safe:
 *
 * 1. **Only creation is gated, never access.** `maxUsers` is compared against
 *    the number of existing rows in `user`, and only when a *new* row is about
 *    to be created. An account that already exists always signs in again — so a
 *    mis-typed `max_users` can never lock the owner out of their own site.
 * 2. **The count is read under a row lock, in the same transaction.** Two
 *    simultaneous first-sign-ins (two tabs, two devices, or one person impatient
 *    on a slow connection) would both read "0 users exist" and both be admitted
 *    by a plain `SELECT count(*)`. Taking `SELECT … FOR UPDATE` on the settings
 *    row first forces the second transaction to wait, re-count, and be refused.
 *
 * The lock target is the `site_settings` singleton rather than the `user` table:
 * locking a row that is guaranteed to exist is simpler than locking a table, and
 * it serialises exactly the operation that needs serialising.
 */

/** The singleton row's primary key. */
const SETTINGS_ID = "primary";

export type SeatState = {
  /** Whether a new account may be created right now. */
  open: boolean;
  /** Accounts that currently exist. */
  used: number;
  /** Configured ceiling. */
  maxUsers: number;
  /** Hard stop, independent of `used` vs `maxUsers`. */
  signupEnabled: boolean;
};

/**
 * Read-only view of the gate, for rendering (e.g. the closed state on
 * `/sign-in`). Tolerates a missing settings row: a freshly migrated database has
 * none, and the documented defaults (`maxUsers = 1`, `signupEnabled = true`) are
 * what a reader should see until the first sign-in writes the row.
 *
 * Does **not** write. `assertRegistrationOpen()` is what heals the row.
 */
export async function readSeatState(): Promise<SeatState> {
  const [settings] = await db
    .select({
      maxUsers: siteSettings.maxUsers,
      signupEnabled: siteSettings.signupEnabled,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1);

  const [row] = await db.select({ total: count() }).from(user);

  const maxUsers = settings?.maxUsers ?? 1;
  const signupEnabled = settings?.signupEnabled ?? true;
  const used = row?.total ?? 0;

  return { open: signupEnabled && used < maxUsers, used, maxUsers, signupEnabled };
}

/**
 * The gate, evaluated atomically.
 *
 * Runs as a transaction because all three steps have to see the same snapshot:
 * ensure the row, lock it, then count.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  return db.transaction(async (tx) => {
    // 1. Self-heal. A freshly migrated database has no settings row and there is
    //    deliberately no seeding step, so the first sign-up creates it.
    await tx.insert(siteSettings).values({ id: SETTINGS_ID }).onConflictDoNothing();

    // 2. Serialise. Concurrent callers queue here, so the count in step 3 cannot
    //    be read by two transactions at once.
    const [settings] = await tx
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, SETTINGS_ID))
      .for("update");

    // 3. Count inside the same transaction, after the lock.
    const [row] = await tx.select({ total: count() }).from(user);

    const maxUsers = settings?.maxUsers ?? 1;
    const signupEnabled = settings?.signupEnabled ?? true;
    const used = row?.total ?? 0;

    return signupEnabled && used < maxUsers;
  });
}

/**
 * better-auth `databaseHooks.user.create.before` handler.
 *
 * Throwing an `APIError` here is what produces the friendly refusal: the OAuth
 * callback catches it and redirects to the client's `errorCallbackURL` with
 * `?error=REGISTRATION_CLOSED&error_description=…`, so the reader lands back on
 * the sign-in card with the form still usable — not on a 500 page.
 *
 * (Returning `false` also aborts the create, but better-auth's callback reads
 * `result.error` on a null user and reports a generic failure, so the reason
 * would be lost. Verified against `better-auth@1.7.7`:
 * `internalAdapter.createUser` → `createWithHooks` → this hook, and
 * `api/routes/callback.mjs` maps an `APIError` carrying `body.code` to a
 * redirect.)
 *
 * This runs on creation only. Sign-in for an existing account never reaches it.
 */
export async function assertRegistrationOpen<T extends Record<string, unknown>>(
  incoming: T,
): Promise<{ data: T }> {
  const open = await isRegistrationOpen();

  if (!open) {
    throw new APIError("FORBIDDEN", {
      code: "REGISTRATION_CLOSED",
      message:
        "Registration is closed — this site allows a limited number of accounts, and they are all taken.",
    });
  }

  return { data: incoming };
}
