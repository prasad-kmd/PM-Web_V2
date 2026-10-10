# PM-Web V2

A Next.js engineering portfolio and technical-notes archive for mechanical and mechatronics projects. Public content is authored in Notion and rendered through a purpose-built site with long-form reading controls, project pages, and two separate comment channels.

Repository: [github.com/prasad-kmd/pm-web_v2](https://github.com/prasad-kmd/pm-web_v2)

## What the site includes

- Public collections for projects, blog posts, articles, tutorials, and a glossary, backed by a read-only Notion CMS integration.
- Content detail pages with a Notion block renderer, table of contents, saved items, quizzes, diagrams, and reader controls.
- Guest comments stored as Notion comments, with identity and spam checks.
- A separate public-read, GitHub-member comment feed stored in Postgres. Posting requires sign-in; a member can delete only their own comments.
- GitHub OAuth accounts, a member profile/dashboard, and a private read-only admin dashboard. New registrations are capped at 50 total accounts, including admins.
- Browser-local saved items and reading preferences; these are not synced to an account.

Guest and member comments are intentionally kept in separate feeds and storage systems. Public pages and guest comments do not require an account.

## Technology

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Notion API for published content and guest comments
- Supabase-hosted PostgreSQL, Drizzle ORM, and Better Auth for member accounts and member comments
- GitHub OAuth; Cloudflare Turnstile for guest-comment and contact-form submissions

## Local development

### Requirements

- Node.js 22.13 or newer for the repository's pinned `pnpm@11.9.0` package manager.
- Corepack and pnpm.
- A Notion integration and the relevant collection IDs for CMS content.
- Supabase/PostgreSQL and a GitHub OAuth App if you need to exercise account or member-comment features.

### Install and configure

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

Fill the server-side environment values in `.env.local`. The checked-in `.env.example` covers the authentication/database foundation; the CMS, guest comments, and contact form have additional settings. If app traffic uses Supabase's transaction pooler on port `6543`, set `DATABASE_URL_MIGRATIONS` to a direct or session-pooler URI on port `5432` for Drizzle CLI commands. Use the focused guides rather than replacing the file with a second example:

1. [Notion CMS setup](docs/notion-cms-setup.md) — content integration and collection IDs.
2. [Database setup](docs/database-setup.md) — Supabase/Postgres and migrations.
3. [Authentication setup](docs/authentication-setup.md) and [GitHub OAuth setup](docs/github-oauth-setup.md) — accounts and callbacks.
4. [Comments system](docs/comments-system.md) and [Member comments](docs/member-comments.md) — Notion permissions, Turnstile, and separate comment storage.
5. [Deployment checklist](docs/deployment.md) — production environment and post-deploy checks.

Apply database migrations before using auth, the dashboard, admin area, or member comments:

```bash
pnpm db:migrate
```

Then start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Public routes are designed to avoid requiring auth/database secrets merely to render, but CMS content and the interactive server features need their corresponding configuration.

## Useful commands

| Command             | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `pnpm dev`          | Run the local Next.js development server.                  |
| `pnpm build`        | Create a production build.                                 |
| `pnpm start`        | Serve a production build.                                  |
| `pnpm lint`         | Run ESLint across the project.                             |
| `pnpm format`       | Format project files with Prettier.                        |
| `pnpm format:check` | Check Prettier formatting.                                 |
| `pnpm db:generate`  | Generate a reviewed Drizzle migration from schema changes. |
| `pnpm db:migrate`   | Apply pending migrations using `DATABASE_URL`.             |
| `pnpm db:studio`    | Open Drizzle Studio against the configured database.       |

Do not use `drizzle-kit push` for production schema changes. Migrations include custom Postgres triggers and row-level-security changes that require review.

## Project documentation

Start at [the documentation index](docs/README.md). It links setup, operations, feature, and contributor guidance. The root-level community policies are [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report suspected vulnerabilities privately using the instructions in [SECURITY.md](SECURITY.md); do not publish exploit details in an issue before a fix is available.

## Accessibility

The site provides an `/accessibility` page and per-device reading preferences for content pages. The project does not claim that every page has passed an independent accessibility audit; see [ACCESSIBILITY.md](ACCESSIBILITY.md) for current support and contribution guidance.

## License

`package.json` currently declares `AGPL-3.0`. This repository does not currently include a top-level license text file; confirm the intended terms with the maintainer before redistributing or reusing the code.
