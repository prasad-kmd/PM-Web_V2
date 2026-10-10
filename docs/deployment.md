# Deployment checklist

This guide covers a production Next.js deployment. The host must support the Node.js runtime used by the auth, database, Notion, Turnstile, and contact routes. Vercel is referenced by existing feature guides, but the environment requirements apply to any compatible host.

## 1. Prepare production services

- Create/configure the Notion integration and share the published content collections. If guest comments are enabled, grant the comment capabilities described in [Comments system](comments-system.md).
- Configure Supabase/Postgres and keep a recoverable export before migrations. Use the server-side transaction pooler connection where appropriate.
- Create a GitHub OAuth App for the production canonical hostname.
- Configure Cloudflare Turnstile if enabling guest comments or the contact form. Configure the Telegram bot/chat only if contact-form delivery is required.

## 2. Add environment variables

Use the host's encrypted server environment store, not committed files. Set production values for the features you enable.

| Purpose                         | Variables                                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notion CMS                      | `NOTION_API_KEY` (or `NOTION_AUTH_TOKEN`), `NOTION_PROJECTS_ID`, `NOTION_BLOG_ID`, `NOTION_ARTICLES_ID`, `NOTION_TUTORIALS_ID`, `NOTION_GLOSSARY_ID`, `NOTION_PUBLISHED_STATUS`; optionally `NOTION_AUTHORS_ID`, `NOTION_API_VERSION`. |
| Authentication and app database | `DATABASE_URL`, `BETTER_AUTH_SECRET` (random, at least 32 characters), `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.                                                                          |
| Database migrations             | `DATABASE_URL_MIGRATIONS` — direct or Supabase session-pooler URI, port `5432`. `drizzle.config.ts` falls back to `DIRECT_URL`, then `DATABASE_URL` if unset.                                                                          |
| Guest comments/contact          | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`; `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` if the contact form should deliver messages.                                                                                         |

`NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` should identify the canonical public origin. Public-prefixed values are embedded in the client build; changing them generally requires a rebuild. Never expose database, OAuth, Notion, Turnstile-secret, or Telegram credentials through a public-prefixed variable.

For a complete Notion content schema, see [Notion CMS setup](notion-cms-setup.md). For auth secrets and OAuth behavior, see [Authentication setup](authentication-setup.md).

## 3. Apply database migrations

Review the SQL in `drizzle/` and apply it to the intended production database with the project's migration command. Set `DATABASE_URL_MIGRATIONS` to a direct or Supabase session-pooler connection (port `5432`) for this step; Drizzle Kit's Postgres migrator uses prepared statements and Supabase transaction-pooler mode on port `6543` does not support them. The deployed application can continue using `DATABASE_URL` on port `6543` because its runtime client disables prepared statements.

```bash
pnpm db:migrate
```

Run migrations once from a trusted release process, not concurrently from multiple app instances. Apply pending migrations before serving code that requires the new schema. The migration set includes custom account-capacity triggers and row-level security, so do not use `drizzle-kit push` in production.

## 4. Configure GitHub OAuth callback

For the production OAuth App, set the authorization callback URL to:

```text
https://YOUR_CANONICAL_HOST/api/auth/callback/github
```

Use the exact same origin in the OAuth app, `BETTER_AUTH_URL`, and the deployed site configuration. GitHub OAuth Apps have a single callback URL; use separate OAuth Apps for local and production. See [GitHub OAuth setup](github-oauth-setup.md).

## 5. Deploy and verify

After setting environment values and migrations, build and deploy the application. Verify with a test account and test content:

- A public collection and detail page load published Notion content.
- GitHub sign-in returns to its local initiating path; a first account can register if the 50-account cap has not been reached.
- The dashboard is private, and `/admin` rejects non-admin users. Promote an admin manually using the SQL in [Admin dashboard](admin-dashboard.md).
- Guest comments still use the Notion feed; member comments appear only in their separate Postgres feed, and a user can delete only their own member comments.
- The accessibility reading controls, contact page, and any enabled form integrations behave as expected.

Do not use production users' accounts or personal information as test fixtures. Keep a rollback plan for application and database changes.

## Operational notes

- `COMMENTS_ENABLED=false` disables **guest-comment posting only**; it does not disable member comments or the contact form.
- The 50-account limit includes administrators. Existing users can sign in when registration is full.
- The in-memory guest/member comment and contact rate limiters are per instance and reset on cold start; do not treat them as globally coordinated quotas.
- A Supabase free project may pause after inactivity and has limited backup/recovery guarantees. Plan for temporary auth/database unavailability and keep safe backups before schema work.
