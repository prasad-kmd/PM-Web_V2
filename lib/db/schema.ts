import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type UserRole = "user" | "admin";

/**
 * Better Auth user records. Roles are deliberately constrained to a small,
 * server-enforced set; account creation always receives the default `user`.
 */
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    displayName: text("display_name"),
    bio: text("bio"),
    role: text("role").$type<UserRole>().notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    check("user_role_check", sql`${table.role} in ('user', 'admin')`),
  ],
);

export const memberComment = pgTable(
  "member_comment",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("member_comment_page_created_idx").on(
      table.pageId,
      table.createdAt,
      table.id,
    ),
    index("member_comment_user_idx").on(table.userId),
    check(
      "member_comment_page_id_check",
      sql`${table.pageId} ~ '^[0-9a-fA-F-]{32,36}$'`,
    ),
    check(
      "member_comment_content_length_check",
      sql`char_length(btrim(${table.content})) between 3 and 1000`,
    ),
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
      .$onUpdateFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
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
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const rateLimit = pgTable(
  "rate_limit",
  {
    // Better Auth generates this ID when inserting new records. The existing
    // key remains the primary key because it is the rate-limit upsert identity.
    id: text("id").notNull().unique(),
    key: text("key").primaryKey().notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
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
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * A single-row counter makes the 50-account ceiling race-safe: the database
 * trigger updates this row atomically for every successful user insert. It is not
 * an authentication/session table and is never exposed to browser code.
 */
export const authUserCapacity = pgTable(
  "auth_user_capacity",
  {
    singleton: boolean("singleton").primaryKey().notNull().default(true),
    registeredUsers: integer("registered_users").notNull().default(0),
    maxUsers: integer("max_users").notNull().default(50),
  },
  (table) => [
    check("auth_user_capacity_singleton_check", sql`${table.singleton} = true`),
    check("auth_user_capacity_limit_check", sql`${table.maxUsers} = 50`),
    check(
      "auth_user_capacity_count_check",
      sql`${table.registeredUsers} >= 0 and ${table.registeredUsers} <= ${table.maxUsers}`,
    ),
  ],
);
