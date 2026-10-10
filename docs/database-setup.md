# Database setup

PM-Web uses Supabase-hosted PostgreSQL as its primary auth database. Drizzle ORM handles the Better Auth tables and migrations; Better Auth—not Supabase Auth—owns the sign-in flow. Notion remains the content source and guest-comment store; signed-in member comments use a separate Postgres table.

## Required credentials

The repository is pinned to `pnpm@11.9.0`, which needs Node.js 22.13 or newer. If your machine has Node 20, upgrade Node or use a compatible pnpm 10 release explicitly (for example, `corepack pnpm@10.34.5 <command>`); the checked-in lockfile uses a format supported by pnpm 10.

Copy `.env.example` to `.env.local` and set `DATABASE_URL` to a PostgreSQL URI from Supabase. For hosted/serverless app traffic, the transaction pooler URI (port `6543`) is suitable because the runtime client sets `prepare: false`. For Drizzle Kit commands, set `DATABASE_URL_MIGRATIONS` to a direct or **session-pooler** URI (port `5432`); Drizzle Kit's migration client uses prepared statements, which Supabase transaction mode does not support. The config falls back to `DIRECT_URL`, then `DATABASE_URL`, if `DATABASE_URL_MIGRATIONS` is empty. The app itself continues to use `DATABASE_URL`.

`DATABASE_URL` must remain server-side. Do not expose it through `NEXT_PUBLIC_*`, client components, browser requests, or committed config. The app does not need a Supabase anon key for this server-only data path.

## Schema and migrations

The initial Drizzle schema is in `lib/db/schema.ts`. The SQL migration is in `drizzle/`; it includes custom PostgreSQL capacity triggers and row-level security that are not reproduced by a schema push.

```bash
pnpm install
pnpm db:migrate
```

For later schema changes:

```bash
pnpm db:generate
# Review SQL in drizzle/ before applying it
pnpm db:migrate
```

Do not use `drizzle-kit push` for deployment because it does not provide the reviewed, versioned migration workflow required for the account-cap triggers.

## Auth tables and access

- `user`, `session`, `account`, and `verification` are Better Auth's persistence tables. The user record also contains a server-managed role and the optional `display_name` and `bio` profile fields.
- `rate_limit` stores Better Auth rate-limit state across serverless instances.
- `auth_user_capacity` stores the site-wide registration counter and fixed limit of 50.
- `member_comment` stores public, content-page-scoped signed-in comments, with an owner foreign key and cascade deletion.
- The application connects from the server with a privileged PostgreSQL connection. Browser access to auth tables is denied by enabling RLS without adding public policies.
- Do not connect a browser SDK directly to these tables. If a later feature uses Supabase's browser APIs, design and test its RLS policies independently.

The current account cap includes the admin account. Database insert/delete triggers keep the counter in step with account rows, and the insert trigger serializes concurrent signup attempts. `auth_user_capacity` should normally contain one row; do not reset or update the counter manually while the site is live.

## Free-tier considerations

The authentication tables are small, and the registration ceiling is 50 users. Supabase free projects may pause after inactivity and have limited backup/recovery guarantees, so retain a safe database export before important migrations. A paused free project can make sign-in temporarily unavailable without affecting static/public content pages.
