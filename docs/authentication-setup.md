# Authentication setup

This phase provides Better Auth with GitHub OAuth, the Drizzle/Postgres adapter, a race-safe cap of **50 total registered accounts**, a member dashboard, and profile customization. Public pages and the existing guest-comment flow remain available without an account.

The sign-in page is `/sign-in`; the account dashboard is `/dashboard`. A successful OAuth flow returns to its validated local `returnTo` path; if none is supplied, it returns to `/`. See [GitHub OAuth setup](./github-oauth-setup.md), [Database setup](./database-setup.md), and [User dashboard](./user-dashboard.md) for the focused guides.

## What is and is not enabled

- GitHub OAuth is the only sign-in provider. GitHub creates an account on a user's first successful sign-in.
- Email/password and email-based sign-in are disabled. Better Auth still stores the email GitHub reports because its user schema requires one; this is profile metadata, not an email login or verification mail flow.
- GitHub's standard Better Auth provider requests `read:user` and `user:email`; a GitHub user's verified primary email is used when their public profile does not expose one.
- The limit counts **all user rows, including the site admin**. Existing users may sign in after the limit is reached; new account creation is blocked. Deleting a user frees one slot.
- The database trigger is the authoritative, concurrency-safe limit. The Better Auth hook provides an earlier, user-friendly rejection.
- Better Auth rate-limit state is stored in PostgreSQL so limits do not reset on each serverless instance.
- Members can customize an optional display name and a 160-character bio. The profile image remains the GitHub OAuth avatar; uploads and arbitrary image URLs are not accepted.
- Sessions use a seven-day lifetime and a short five-minute signed JWT cookie cache. User/account/role records remain in Postgres; this is not a database-free identity store.
- Guest comments continue using Notion and do not require or create an auth account. Signed-in member comments are stored separately in Postgres and never share the guest feed; see [Member comments](./member-comments.md).

## 1. Install and configure Supabase Postgres

1. Create a Supabase project.
2. In **Project Settings → Database**, copy a PostgreSQL connection string for app runtime. For serverless app traffic, the Supabase transaction pooler URI (port `6543`) is appropriate when the runtime client disables prepared statements. Also copy a direct or **session-pooler** URI (port `5432`) for Drizzle migrations.
3. Copy `.env.example` to `.env.local`. Set `DATABASE_URL` to the app runtime URI and `DATABASE_URL_MIGRATIONS` to the direct/session-pooler URI. These are server secrets—do not prefix them with `NEXT_PUBLIC_` or send them to the browser.
4. Apply the versioned migrations:

   ```bash
   pnpm install
   pnpm db:migrate
   ```

   `drizzle.config.ts` uses `DATABASE_URL_MIGRATIONS` first, then `DIRECT_URL`, then `DATABASE_URL`. Use port `5432` direct/session mode for this CLI; Supabase transaction mode on port `6543` does not support the prepared statements used by Drizzle Kit's Postgres migrator. Migrations create the Better Auth tables, enable row-level security on auth data, initialize the 50-user counter, add the database triggers, and create the profile/member-comment tables. The custom triggers and RLS are why production setup uses reviewed migrations rather than `drizzle-kit push`.

5. In Supabase **SQL Editor**, verify the counter after migration:

   ```sql
   select singleton, registered_users, max_users
   from public.auth_user_capacity;
   ```

   Expected initial values are `true`, `0`, and `50`.

The application connects through a server-only PostgreSQL connection. No Supabase browser key or Firebase credential is needed for this auth foundation.

## 2. Set the Better Auth secret and base URL

Generate a long, random secret:

```bash
openssl rand -base64 32
```

Set the result as `BETTER_AUTH_SECRET`. Set `BETTER_AUTH_URL` to the site's origin, for example `http://localhost:3000` locally and `https://your-domain.example` in production. Set `NEXT_PUBLIC_SITE_URL` to the same canonical public origin used by the rest of the site.

Do not commit `.env.local`, OAuth secrets, or a production Better Auth secret. The checked-in `.env.example` contains placeholders only.

## 3. Create GitHub OAuth Apps

Use a separate GitHub OAuth App for local development and production, so each app has the correct callback URL.

For each app, open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**:

- **Application name:** a recognizable app/environment name
- **Homepage URL:** the matching site origin
- **Authorization callback URL:**
  - Local: `http://localhost:3000/api/auth/callback/github`
  - Production: `https://your-domain.example/api/auth/callback/github`

Copy the app's client ID and client secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in the matching environment. Keep the secret server-side. Better Auth requests the GitHub `read:user` and `user:email` scopes. Do not add email/password auth or email delivery as part of this flow.

For local development, open `/sign-in`. When the OAuth flow is initiated with a `returnTo` query, the app only accepts a same-site path and sends the user back to that path after GitHub completes sign-in. Absolute and protocol-relative return URLs are rejected.

## 4. Promote the first admin

After the first GitHub account has been created, use Supabase SQL Editor to inspect the user row and promote the intended account:

```sql
select id, name, email, role, created_at
from public."user"
order by created_at;

update public."user"
set role = 'admin', updated_at = now()
where id = 'PASTE_THE_VERIFIED_USER_ID_HERE';
```

Only `user` and `admin` are accepted role values. The member dashboard reads the role from Postgres, and `/admin` is protected server-side by `requireAdmin()`, which checks the canonical Postgres role on each request. A non-admin is redirected to `/access-denied`. See [Admin dashboard](./admin-dashboard.md) for the authorization behavior and safety notes. Never promote an account based on client-provided data, and do not expose a public role-editing endpoint.

## 5. Account cap and migrations

The application enforces a hard ceiling of 50 user rows using both a Better Auth database hook and a Postgres trigger backed by a single-row counter. The trigger serializes concurrent account inserts, so simultaneous OAuth sign-ups cannot overrun the limit. The counter is decremented when a user row is deleted.

If you need to deliberately change the limit later, update the application constant, schema check, migration/trigger, and docs together, after reviewing the relevant provider plan. Do not change only the displayed number or the client UI.

Use this workflow for future schema changes:

```bash
pnpm db:generate
# Review the generated SQL and any custom trigger/RLS changes.
pnpm db:migrate
```

Never apply migration SQL from an unreviewed branch to production. Keep a database backup/export before schema changes; free-tier backup guarantees are limited.

## Troubleshooting

- **`DATABASE_URL is missing`:** make sure the server environment is configured and restart the dev server.
- **Migrations fail due to connection settings:** verify the host/port and password; use the Supabase transaction-pooler URI for hosted/serverless connections.
- **GitHub sign-in is shown as unconfigured:** check that both GitHub variables are present in the environment used by the running build/server.
- **GitHub reports a callback mismatch:** compare the OAuth App callback URL exactly, including scheme, hostname, and path. Use the matching local or production OAuth App.
- **New sign-up is refused:** if 50 accounts already exist, existing accounts can still sign in but new accounts cannot be created. Review `auth_user_capacity` and the `user` table before making any limit change.
- **Build-time config errors:** do not place real secrets in the repo. The database and auth server are initialized lazily; public pages should not need auth credentials.
