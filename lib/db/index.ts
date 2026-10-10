import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const createDatabase = (client: ReturnType<typeof postgres>) =>
  drizzle(client, { schema });

type Database = ReturnType<typeof createDatabase>;
type PostgresClient = ReturnType<typeof postgres>;

type DatabaseGlobals = typeof globalThis & {
  __pmWebPostgresClient?: PostgresClient;
  __pmWebDatabase?: Database;
};

const databaseGlobals = globalThis as DatabaseGlobals;

/**
 * Lazily create the pool so builds and public pages do not require database
 * credentials. The Supabase transaction-pooler URI should be used in hosted
 * deployments; prepared statements are disabled for pooler compatibility.
 */
export function getDb(): Database {
  if (databaseGlobals.__pmWebDatabase) return databaseGlobals.__pmWebDatabase;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Configure the server-only Supabase PostgreSQL connection string.",
    );
  }

  const client =
    databaseGlobals.__pmWebPostgresClient ??
    postgres(connectionString, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  databaseGlobals.__pmWebPostgresClient = client;
  databaseGlobals.__pmWebDatabase = createDatabase(client);
  return databaseGlobals.__pmWebDatabase;
}
