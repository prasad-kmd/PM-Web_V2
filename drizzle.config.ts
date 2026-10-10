import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Keep app traffic on its runtime connection (often Supabase transaction mode,
// port 6543), but give Drizzle Kit a direct/session connection for migrations.
// Supabase transaction mode does not support prepared statements; Drizzle Kit's
// postgres-js migration client uses its default prepared-statement behavior.
const migrationUrl =
  process.env.DATABASE_URL_MIGRATIONS?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_MIGRATIONS (or DIRECT_URL / DATABASE_URL) is required for Drizzle migrations and Studio. Copy .env.example to .env.local first.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
