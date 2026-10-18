# Database setup

**Who this is for:** anyone standing up this project from a fresh clone, or
bringing up a second environment (a laptop, a preview branch, a rebuild after
deleting a project).
**What you need:** a GitHub account (for the Supabase login), about 10 minutes,
and a terminal.

The stack is **Supabase (Postgres) + Drizzle ORM**. Nothing here costs money —
the free tier is sufficient and the instructions below stay inside it.

> Phase 1 of the v2.9.0 roadmap. Auth is Phase 2; this document stops at "the
> five tables exist". For the auth side see [`auth-setup.md`](./auth-setup.md).

---

## 1. Create the Supabase project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and
   **New project**.
2. Pick the region closest to you (for Sri Lanka, `ap-southeast-1` /
   Singapore is usually the lowest-latency option in the free tier list).
3. Generate a database password and **save it now** — Supabase will not show it
   again. It goes into the connection string below.
4. Wait for provisioning to finish (a couple of minutes).

One project is enough. This site is a single-user archive; there is no
staging/production split, and no data that needs a second environment.

---

## 2. Get the connection string

In the Supabase dashboard: **Connect** → **Connection pooling** → **Transaction**
mode. The URI looks like this:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Note the details:

|      |                                                                                   |
| ---- | --------------------------------------------------------------------------------- |
| Host | `aws-0-<region>.pooler.supabase.com` — the **pooler**, not `db.<ref>.supabase.co` |
| Port | **`6543`**                                                                        |
| User | `postgres.<project-ref>` — note the dot, not the `postgres` superuser             |

Then:

```bash
cp .env.local.example .env.local
```

…and paste the URI into `DATABASE_URL`.

> ### Use the transaction pooler, not the direct connection
>
> Supabase also offers a **direct** connection on port `5432`, and a **session**
> pooler — also on `5432`, on the same pooler host. It is tempting to grab the
> direct one. Don't:
>
> - The direct connection has a **small connection limit** and does not survive
>   serverless traffic patterns. Against the direct URI, a deployed site
>   exhausts connections the first time two requests overlap.
> - `lib/db/index.ts` sets `prepare: false`, which the **transaction pooler
>   requires** — transaction-mode pooling cannot safely reuse a named prepared
>   statement across transactions. With `prepare: true` against port 6543 you get
>   intermittent `prepared statement "s1" already exists` errors.
>
> If you paste a `supabase.co:5432` URI by mistake, `pnpm db:generate` prints a
> warning rather than silently accepting it.

If you paste the wrong URI, `drizzle.config.ts` and `lib/db/index.ts` both stop
with the same message pointing back here.

---

## 3. Generate the auth secret

Phase 2 needs this; generating it now means one less step later.

```bash
openssl rand -base64 32
```

Put the output in `BETTER_AUTH_SECRET` in `.env.local`. It must be **at least 32
characters** and **must not be reused** from another project — it signs session
tokens, so anyone who knows it can mint a session for any account.

No OpenSSL? Any local secret generator works
(`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).

---

## 4. Apply the schema

`drizzle/` is committed, so a fresh clone already contains the migration — you do
not need to generate anything to get started.

```bash
pnpm install
pnpm db:migrate
```

That applies `drizzle/0000_init.sql`, which creates the five tables in §5.

### The `db:*` scripts

| Command            | What it does                                                                                               | Needs `DATABASE_URL`?                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm db:generate` | Diffs `lib/db/schema.ts` against `drizzle/` and writes a new numbered `.sql` migration. Reads no database. | Yes — the config refuses to load without it, so a typo surfaces immediately rather than at migrate time. |
| `pnpm db:migrate`  | Applies any unapplied migrations, in order.                                                                | Yes                                                                                                      |
| `pnpm db:studio`   | Opens Drizzle Studio at `https://local.drizzle.studio` to browse and edit rows.                            | Yes                                                                                                      |

Do **not** run `drizzle-kit push` against this project. It mutates the database
to match the schema without writing a migration file, so the schema you have in
Git and the schema in the database drift apart with no record of how. Generate →
migrate keeps the history.

### Verifying it worked

```bash
pnpm db:studio
```

You should see five tables — `user`, `session`, `account`, `verification`,
`site_settings`. All five start empty; that is correct. There is **no seeding
step** (see §5).

---

## 5. What the schema contains

### Better Auth core — `user`, `session`, `account`, `verification`

Better Auth addresses these tables **by column name**, so their physical names
are part of the library's contract and are not free to rename. `lib/db/schema.ts`
was checked field-by-field against `getAuthTables()` in `better-auth@1.7.7`:

| Table          | Fields                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`         | `id`, `name`, `email` (unique), `email_verified`, `image`, `role`, `created_at`, `updated_at`                                                                                                                 |
| `session`      | `id`, `expires_at`, `token` (unique), `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id` → `user.id`                                                                                           |
| `account`      | `id`, `account_id`, `provider_id`, `user_id` → `user.id`, `access_token`, `refresh_token`, `id_token`, `access_token_expires_at`, `refresh_token_expires_at`, `scope`, `password`, `created_at`, `updated_at` |
| `verification` | `id`, `identifier`, `value`, `expires_at`, `created_at`, `updated_at`                                                                                                                                         |

Three notes that will save you a debugging session later:

- **`user.id` is `text`, not `uuid`.** Better Auth generates the identifier. Do
  not "improve" this to `uuid` — it breaks the adapter.
- **`account.password` exists and stays `NULL` forever.** The site is OAuth-only
  by design (no e-mail sign-in). The column is present so that adding a password
  provider later is a config change rather than a migration.
- **`user` is a reserved word in Postgres.** Every query against it needs
  quoting — `SELECT … FROM "user"`. Drizzle does this for you; raw SQL must not
  forget.

Timestamps are `timestamp with time zone` (`timestamptz`), so a timestamp written
in one timezone reads back correctly in another — which matters because this
archive displays dates in Asia/Colombo.

### `site_settings` — the registration seat gate

A **single row** (`id = 'primary'`) that controls how many accounts may exist.
This is roadmap item 6: the first person to register takes the only seat, and
registration then closes.

| Column           | Meaning                                               |
| ---------------- | ----------------------------------------------------- |
| `max_users`      | Total accounts ever allowed. Default `1`.             |
| `signup_enabled` | A hard stop regardless of remaining seats.            |
| `updated_by`     | Audit trail for changes made from `/admin` (Phase 4). |

There is **no seed step and no insert you need to run.** Phase 2's
`assertRegistrationOpen()` upserts this row with
`INSERT … ON CONFLICT DO NOTHING` before reading it, so a freshly migrated —
even empty — database heals itself on the first sign-up attempt.

Changing the limits:

```sql
-- how many seats are used, and what the limits are
SELECT (SELECT count(*) FROM "user") AS used, max_users, signup_enabled
FROM site_settings;

-- allow three accounts instead of one
UPDATE site_settings SET max_users = 3, updated_at = now() WHERE id = 'primary';

-- pause new registrations without removing anyone
UPDATE site_settings SET signup_enabled = false, updated_at = now() WHERE id = 'primary';
```

Existing accounts are never affected by these values: only the _creation_ of a
new `user` row is gated, so lowering `max_users` can never lock you out.

The full operator playbook — becoming admin, emergency account deletion, recovery
— is in [`admin-guide.md`](./admin-guide.md).

---

## 6. Free-tier keep-alive

Supabase pauses free-tier projects after a stretch of inactivity (currently about
a week — check the dashboard, as the policy changes). A paused project does not
error loudly: the first query simply fails to connect.

Because every connection sets `connect_timeout: 10`, a request against a paused
project **fails in ten seconds instead of hanging**, and the fix is to open the
dashboard and press **Restore**. There is nothing to repair afterwards.

For a site with no scheduled traffic, the cheapest option is a manual visit
before you sit down to work — this project does not ship a cron to keep the
database awake, because a free-tier scheduler that pings every few days costs
more setup than it saves for a single-user archive. If you later deploy and want
automation, `docs/deployment.md` covers the options.

---

## 7. Reset and recovery

### Wipe all auth data

Everything cascades from `user`, so this is the only statement you need:

```sql
TRUNCATE "user", session, account, verification CASCADE;
```

`site_settings` is deliberately **not** in that list — the seat configuration is
not auth data and survives a wipe.

Afterwards: `site_settings` is unchanged, `count(*) FROM "user"` is `0`, and
because the gate compares the count against `max_users`, **registration re-opens
automatically**. The next person to sign in becomes the owner again.

### Wipe everything, including settings

```sql
TRUNCATE "user", session, account, verification, site_settings CASCADE;
```

The row is recreated on the next sign-up attempt.

### Remove one account only

```sql
DELETE FROM session WHERE user_id = '<id>';   -- optional; CASCADE already covers it
DELETE FROM "user"  WHERE id = '<id>';
```

### Start over completely

Delete the migration journal and re-apply:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

then `pnpm db:migrate`. This drops every table in `public`, not just ours — make
sure nothing else lives in this project.

---

## 8. Troubleshooting

| Symptom                                              | Cause and fix                                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL is not set.`                           | No `.env.local`, or the variable is empty. `cp .env.local.example .env.local`.                                       |
| `getaddrinfo ENOTFOUND` / `ETIMEDOUT`                | Wrong host, or the project is paused (§6). Open the dashboard and check.                                             |
| `password authentication failed for user "postgres"` | You dropped the `postgres.<project-ref>` part of the user name, or the password is wrong. Re-copy the pooler URI.    |
| `prepared statement "s1" already exists`             | `prepare: true` against port 6543. `lib/db/index.ts` sets `false`; if you changed it, put it back.                   |
| `remaining connection slots are reserved`            | You are pointing at the direct connection or the session pooler instead of the transaction pooler. Use port 6543.    |
| `relation "user" does not exist`                     | `pnpm db:migrate` has not been run against _this_ database.                                                          |
| `drizzle-kit` hangs on `db:migrate`                  | `DATABASE_URL` points at an unreachable host. The connection times out after 10s, then errors.                       |
| Migration ran, but `pnpm db:studio` shows nothing    | Drizzle Studio shows the schema of the connection in `DATABASE_URL`. Make sure it is the same database you migrated. |

---

## 9. Working without Supabase (local Postgres)

Nothing about the schema or the client is Supabase-specific, so a local Postgres
works unchanged — useful for offline work, or for testing a destructive migration
before running it against real data. The pooler-safe options in
`lib/db/index.ts` (`prepare: false`, `max: 1`) are harmless against a local
server.

```bash
# any local Postgres will do; Docker is the least invasive
docker run --name pmweb-db -e POSTGRES_PASSWORD=pmweb -p 5432:5432 -d postgres:17

# then in .env.local
DATABASE_URL=postgresql://postgres:pmweb@127.0.0.1:5432/postgres
```

`pnpm db:migrate` and `pnpm db:studio` behave identically. Switching back is a
matter of restoring the Supabase URI — the two databases are independent, so
point `DATABASE_URL` at whichever one you want to affect.
