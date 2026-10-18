import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Loads .env.local the same way `next dev` does. Next.js does not expose
// environment variables to standalone tooling, so drizzle-kit has to read the
// file itself.
// `quiet` suppresses dotenv's promotional banner, which would otherwise appear
// in the output of every `db:*` command.
config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;

/**
 * Guard against two easy mistakes:
 *   1. running a migration before creating `.env.local`;
 *   2. pasting the **direct** (port 5432) Supabase URI instead of the
 *      **transaction pooler** (port 6543) one, which exhausts connections
 *      as soon as the site is deployed.
 *
 * `messages` is intentionally actionable — `db:migrate` is the first command a
 * new clone runs, so this error is the most likely one to be seen.
 */
function resolveDatabaseUrl(): string {
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

  // A warning rather than an error: port 5432 is legitimate for a local
  // Postgres, so this only points out the likely Supabase misstep.
  if (
    connectionString.includes("supabase.co") &&
    connectionString.includes(":5432")
  ) {
    console.warn(
      "\n⚠  DATABASE_URL points at Supabase's direct port 5432.\n" +
        "   Use the Transaction pooler URI (port 6543) instead — see docs/database-setup.md.\n",
    );
  }

  return connectionString;
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: resolveDatabaseUrl() },
  strict: true,
  verbose: true,
});
