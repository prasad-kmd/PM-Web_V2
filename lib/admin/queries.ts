import { asc, count, desc, eq, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { session, siteSettings, user } from "@/lib/db/schema";

/**
 * Read-only queries behind `/admin`.
 *
 * Every one of these is called from a page that has already passed
 * `requireAdmin()` in its layout, so there is no guard here — a `requireAdmin()`
 * call inside a query function would be invisible at the call site, and the
 * question "is this page protected?" should be answerable by reading the page.
 */

const SETTINGS_ID = "primary";

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  /** `null` for an account that has never signed in — possible after a manual insert. */
  lastSessionAt: Date | null;
  sessionCount: number;
};

/**
 * Every account, with its session history summarised.
 *
 * `GROUP BY user.id` is legal in Postgres because `id` is the primary key and the
 * other selected columns are functionally dependent on it, so no wider grouping
 * is needed. The join is a `LEFT JOIN` so an account with no sessions still
 * appears — it is exactly the account an operator is most likely to be looking
 * for.
 */
export async function listAccounts(): Promise<AccountRow[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastSessionAt: max(session.createdAt),
      sessionCount: count(session.id),
    })
    .from(user)
    .leftJoin(session, eq(session.userId, user.id))
    .groupBy(user.id)
    .orderBy(asc(user.createdAt));

  return rows.map((row) => ({
    ...row,
    // `count()` comes back as a number through postgres.js, but a driver change
    // would make it a string and `=== 0` comparisons would quietly fail.
    sessionCount: Number(row.sessionCount),
    lastSessionAt: row.lastSessionAt ? new Date(row.lastSessionAt) : null,
  }));
}

export type SeatConfig = {
  maxUsers: number;
  signupEnabled: boolean;
  used: number;
  updatedAt: Date | null;
  updatedBy: string | null;
};

/**
 * The values the settings form is edited from.
 *
 * Reads the row directly rather than going through `readSeatState()` in
 * `lib/auth/registration.ts`: that helper exists to serve the *gate* and returns
 * a verdict (`open`), while a form needs the stored values plus what they mean
 * today. Same row, different question — and one source of truth is still the
 * table, not either helper.
 *
 * A missing row is not an error. A freshly migrated database has none, and the
 * documented defaults are what the form should show.
 */
export async function getSeatConfig(): Promise<SeatConfig> {
  const [settings] = await db
    .select({
      maxUsers: siteSettings.maxUsers,
      signupEnabled: siteSettings.signupEnabled,
      updatedAt: siteSettings.updatedAt,
      updatedBy: siteSettings.updatedBy,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1);

  const [userRow] = await db.select({ total: count() }).from(user);

  return {
    maxUsers: settings?.maxUsers ?? 1,
    signupEnabled: settings?.signupEnabled ?? true,
    used: Number(userRow?.total ?? 0),
    updatedAt: settings?.updatedAt ?? null,
    updatedBy: settings?.updatedBy ?? null,
  };
}

export type AdminOverview = {
  totalUsers: number;
  totalAdmins: number;
  seats: {
    used: number;
    maxUsers: number;
    signupEnabled: boolean;
    /** The gate's own verdict: `signupEnabled && used < maxUsers`. */
    open: boolean;
  };
  /** The most recent session start, or `null` on a site nobody has signed in to. */
  lastSignIn: { name: string; email: string; at: Date } | null;
  /** When the seat configuration last changed, and by whom. */
  settingsUpdated: { at: Date; by: string | null } | null;
};

/**
 * The numbers `/admin` shows.
 *
 * Seat state is recomputed here rather than read through `readSeatState()` from
 * `lib/auth/registration.ts`, because that helper exists to serve the *gate* and
 * a settings page silently inheriting its defaults would be a second source of
 * truth. This is a plain read of the same row the gate reads.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const [userRow] = await db.select({ total: count() }).from(user);
  const [adminRow] = await db
    .select({ total: count() })
    .from(user)
    .where(eq(user.role, "admin"));

  const [settings] = await db
    .select({
      maxUsers: siteSettings.maxUsers,
      signupEnabled: siteSettings.signupEnabled,
      updatedAt: siteSettings.updatedAt,
      updatedBy: siteSettings.updatedBy,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1);

  // "Last sign-in" is the most recent session row, read from the database rather
  // than from the cookie cache: an operator asking this question wants the truth,
  // not a five-minute-old answer.
  const [lastSession] = await db
    .select({
      createdAt: session.createdAt,
      name: user.name,
      email: user.email,
    })
    .from(session)
    .innerJoin(user, eq(user.id, session.userId))
    .orderBy(desc(session.createdAt))
    .limit(1);

  const totalUsers = Number(userRow?.total ?? 0);
  const maxUsers = settings?.maxUsers ?? 1;
  const signupEnabled = settings?.signupEnabled ?? true;

  return {
    totalUsers,
    totalAdmins: Number(adminRow?.total ?? 0),
    seats: {
      used: totalUsers,
      maxUsers,
      signupEnabled,
      open: signupEnabled && totalUsers < maxUsers,
    },
    lastSignIn: lastSession
      ? {
          name: lastSession.name,
          email: lastSession.email,
          at: lastSession.createdAt,
        }
      : null,
    settingsUpdated: settings
      ? { at: settings.updatedAt, by: settings.updatedBy }
      : null,
  };
}
