import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Database client.
 *
 * **Server-only.** `DATABASE_URL` has no `NEXT_PUBLIC_` prefix, so it is never
 * inlined into a client bundle; this module must not be imported from a
 * `"use client"` component.
 *
 * Connection options are tuned for the Supabase **transaction pooler** (port
 * 6543) on the free tier:
 *
 * | Option            | Why                                                      |
 * | ----------------- | -------------------------------------------------------- |
 * | `prepare: false`  | Required. Named prepared statements are incompatible with  |
 * |                   | transaction-mode pooling — reusing one across transactions |
 * |                   | raises `prepared statement "s1" already exists`.           |
 * | `max: 1`          | One connection per serverless instance. The pooler does the |
 * |                   | multiplexing; opening more only burns the connection limit. |
 * | `idle_timeout: 20`| Releases the slot quickly and lets dev-server module reloads |
 * |                   | clean up after themselves instead of piling up pools.       |
 * | `connect_timeout` | Fails fast instead of hanging a request when the free-tier  |
 * |                   | project is paused for inactivity.                           |
 *
 * These values also work unchanged against a local Postgres, so nothing needs
 * editing to switch between the two.
 */

const connectionString = process.env.DATABASE_URL;

// Checked explicitly rather than asserted with `!` (RULES.md §3.1): a missing
// variable should fail with instructions, not with a driver-level error.
if (!connectionString) {
  throw new Error(
    [
      "DATABASE_URL is not set.",
      "",
      "  1. cp .env.local.example .env.local",
      "  2. Supabase → your project → Connect → Transaction pooler (port 6543)",
      "  3. Paste the URI into DATABASE_URL",
      "",
      "Full walkthrough: docs/database-setup.md",
    ].join("\n"),
  );
}

export const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
