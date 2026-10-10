# Development setup

This guide prepares a local PM-Web environment. For the architecture and feature overview, start with the [root README](../README.md).

## Prerequisites

- Node.js 22.13 or newer. The project pins `pnpm@11.9.0`, which requires this Node version.
- Corepack, Git, and network access to install dependencies.
- A Notion integration and collection IDs to load real content.
- A separate/test Postgres database and GitHub OAuth App if you plan to test sign-in, profiles, admin access, or member comments.

## Install dependencies

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

Keep `.env.local` private; it is ignored by Git. The checked-in `.env.example` covers the authentication/database foundation, not every feature. Add the values you need from the feature guides rather than replacing your existing environment file.

### Environment groups

- **Notion CMS:** `NOTION_API_KEY` (or the documented alias), the five collection IDs, and optionally `NOTION_AUTHORS_ID`. See [Notion CMS setup](notion-cms-setup.md).
- **Authentication and app database:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Set `DATABASE_URL_MIGRATIONS` to a direct or Supabase session-pooler URI (port `5432`) for Drizzle Kit commands. See [Database setup](database-setup.md) and [GitHub OAuth setup](github-oauth-setup.md).
- **Guest comments and contact form:** Turnstile site/secret keys. The contact form also needs `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` to deliver submissions. See [Comments system](comments-system.md) and [Contact form setup](contact-form-setup.md).
- **Guest comments only:** `COMMENTS_ENABLED=false` stops new guest comments while leaving their reads available. It does not disable the separate member-comment API or the contact form.

Do not put any secret in a `NEXT_PUBLIC_*` variable. The Turnstile site key and canonical site URL are public configuration; their paired server secrets are not.

## Prepare the database

Set `DATABASE_URL` to a development/test PostgreSQL database, then apply all committed migrations:

```bash
pnpm db:migrate
```

This creates the Better Auth tables, account-capacity counter/triggers, profile fields, and member-comment table/RLS. Use `pnpm db:generate` to create a migration after changing the Drizzle schema, inspect the SQL, and keep custom trigger/RLS logic intact. Do not use `drizzle-kit push` as a substitute.

For local OAuth, create a GitHub OAuth App with callback `http://localhost:3000/api/auth/callback/github`. Never point local code at the production database or production OAuth credentials unless you have explicit permission and a safe test plan.

## Run the app

```bash
pnpm dev
```

Open `http://localhost:3000`. Public pages, dashboard, auth, CMS, comments, and contact delivery depend on different subsets of environment values; an unconfigured feature may report that it is unavailable without preventing unrelated public routes from rendering.

## Common checks

```bash
pnpm format:check
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

For migrations:

```bash
pnpm exec drizzle-kit check
```

Full-project lint and type checks currently report known baseline issues in unrelated animation/highlight and controlled-state components. See [Contributing](../CONTRIBUTING.md) for the exact paths and how to distinguish those from regressions.

## Feature-specific setup

- [Notion CMS](notion-cms-setup.md)
- [Authentication](authentication-setup.md)
- [Guest comments](comments-system.md)
- [Signed-in member comments](member-comments.md)
- [All guides](README.md)
