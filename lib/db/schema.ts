import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Database schema — v2.9.0 Phase 1.
 *
 * Two groups of tables live here:
 *
 *   1. **Better Auth core** (`user`, `session`, `account`, `verification`).
 *      These are *not* free-form: Better Auth addresses them by column name, so
 *      the physical names below (`user_id`, `email_verified`, …) are part of its
 *      contract. They were checked field-by-field against `getAuthTables()` in
 *      `better-auth@1.7.7` — see docs/database-setup.md § "Schema contract".
 *      Field name is `camelCase` in JS, physical column is `snake_case`.
 *
 *   2. **Product configuration** (`site_settings`) — the singleton row behind
 *      the registration seat gate (roadmap item 6). Not a Better Auth table.
 *
 * Timestamps are `timestamptz` (timezone-aware) so that anything displayed to a
 * reader in Asia/Colombo renders correctly without app-side timezone maths.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth core
// ─────────────────────────────────────────────────────────────────────────────

export const user = pgTable(
  "user",
  {
    // Text, not uuid: Better Auth generates the identifier itself.
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),

    /**
     * Roadmap item 6 — `UPDATE "user" SET role = 'admin'` in the Supabase SQL
     * editor is what unlocks `/admin`. Declared to Better Auth in Phase 2 via
     * `user.additionalFields`, which is also what makes `session.user.role`
     * visible to the app.
     *
     * `user` is a reserved word in Postgres, so queries against it always need
     * quoting (`SELECT … FROM "user"`). Drizzle does this automatically.
     */
    role: text("role").notNull().default("user"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // `user.email` already carries a unique index from `.unique()` above.
    index("user_role_idx").on(table.role),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    // The Phase 4 admin user list joins on this, and sign-out deletes by it.
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),

    /**
     * Unused while the site is OAuth-only — and it stays `NULL` forever, because
     * e-mail sign-in is deliberately not offered. The column exists so that
     * adding a password provider later is a config change rather than a
     * migration. Better Auth expects the column to be present.
     */
    password: text("password"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Product configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Singleton configuration row (`id = 'primary'`) behind the seat gate.
 *
 * | Column           | Meaning                                                        |
 * | ---------------- | -------------------------------------------------------------- |
 * | `maxUsers`       | Total accounts ever allowed. `1` = exactly one owner.          |
 * | `signupEnabled`  | Hard stop regardless of remaining seats.                       |
 * | `updatedBy`      | Audit trail when changed from `/admin` in Phase 4.             |
 *
 * Enforcement lives in Phase 2 (`lib/auth/registration.ts`), inside the
 * user-creation path only: an existing user signing in again is never gated, so
 * raising/lowering `maxUsers` can never lock the owner out.
 *
 * There is deliberately **no seeding step**. Phase 2's `assertRegistrationOpen`
 * upserts the row with `INSERT … ON CONFLICT DO NOTHING` before reading it, so a
 * freshly migrated database heals itself on the first sign-up attempt.
 */
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("primary"),
  maxUsers: integer("max_users").notNull().default(1),
  signupEnabled: boolean("signup_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedBy: text("updated_by"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
