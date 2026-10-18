import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

/**
 * Reading and writing `site_settings` — the seat gate's configuration.
 *
 * This is the "change the allowable user count in the DB" control from item 6,
 * given a form. The SQL equivalent stays documented in `docs/admin-guide.md` for
 * emergencies, because the tool you reach for when the database is already open
 * should not be a web form.
 *
 * **Split out of `app/admin/actions.ts` on purpose.** A `"use server"` file's
 * exports must all be async server actions and can only run inside a request
 * context — `requireAdmin()` reads `next/headers`. Keeping the validation and the
 * write here, with no request context, means the harness can call them directly
 * and assert the behaviour instead of asserting that the source contains the
 * right strings.
 */

/** The singleton row's primary key. */
const SETTINGS_ID = "primary";

/**
 * A ceiling, so a slipped keystroke cannot turn `1` into `1000000`.
 *
 * Not a security boundary — nothing breaks at a large number. It is there
 * because `max_users` is the one field on this form that is easy to fat-finger
 * and hard to notice afterwards.
 */
export const MIN_MAX_USERS = 1;
export const MAX_MAX_USERS = 1000;

export type SaveSettingsResult =
  | {
      ok: true;
      maxUsers: number;
      signupEnabled: boolean;
      /** One line describing what is now true, shown to the operator. */
      summary: string;
    }
  | { ok: false; message: string };

/**
 * Turns a form value into a seat count.
 *
 * @returns the number, or `null` when the value is not a whole number. An empty
 *   field is rejected rather than coerced to zero: "no accounts allowed" is a
 *   configuration nobody wants and nobody means to type.
 */
export function parseMaxUsers(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // `Number("")` is 0 and `Number("1e3")` is 1000; both would sneak past a
  // `Number.isInteger` check on the wrong value, so the shape is checked first.
  if (!/^\d+$/.test(trimmed)) return null;

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

/**
 * Writes the seat configuration.
 *
 * **Upsert, not update.** A freshly migrated database has no `site_settings` row
 * — the seat gate creates it lazily on the first sign-up attempt. An `UPDATE`
 * would silently affect zero rows and the form would appear to do nothing, so the
 * row is created here if it does not exist. (`onConflictDoNothing` in the gate
 * and `onConflictDoUpdate` here are the same decision from two directions.)
 *
 * **Lowering `max_users` below the current account count is allowed, and is the
 * point.** Only *creation* is gated; an existing account always signs in again.
 * So setting the limit to 1 on a site with 2 accounts closes registration without
 * locking either person out — which is exactly the behaviour the roadmap asks for
 * and the acceptance test checks.
 *
 * @param updatedBy e-mail of the operator, for `site_settings.updated_by`.
 */
export async function saveSiteSettings(
  input: { maxUsers: unknown; signupEnabled: boolean },
  updatedBy: string | null,
): Promise<SaveSettingsResult> {
  const maxUsers = parseMaxUsers(input.maxUsers);

  if (maxUsers === null) {
    return {
      ok: false,
      message: "Enter a whole number of accounts — digits only, no spaces or signs.",
    };
  }

  if (maxUsers < MIN_MAX_USERS) {
    return {
      ok: false,
      message: `The limit must be at least ${MIN_MAX_USERS}. A site with no accounts has no owner.`,
    };
  }

  if (maxUsers > MAX_MAX_USERS) {
    return {
      ok: false,
      message: `That is larger than this form allows (max ${MAX_MAX_USERS}).`,
    };
  }

  await db
    .insert(siteSettings)
    .values({
      id: SETTINGS_ID,
      maxUsers,
      signupEnabled: input.signupEnabled,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        maxUsers,
        signupEnabled: input.signupEnabled,
        updatedBy,
        // Set explicitly: `$onUpdate` fires for `.update()` calls, not for the
        // update arm of an upsert.
        updatedAt: new Date(),
      },
    });

  const summary = input.signupEnabled
    ? `Registration is open, with a limit of ${maxUsers}.`
    : "Registration is closed, regardless of the limit.";

  return { ok: true, maxUsers, signupEnabled: input.signupEnabled, summary };
}
