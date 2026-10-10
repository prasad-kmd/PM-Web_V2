# Documentation index

Use the guide that matches the task. Keep credentials and private data out of committed files and browser code.

## Start here

| Guide                                     | Use it for                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| [Development setup](development-setup.md) | Local prerequisites, environment setup, and common commands.                  |
| [Deployment](deployment.md)               | Production environment, migration order, OAuth callbacks, and release checks. |
| [Notion CMS setup](notion-cms-setup.md)   | Content databases, permissions, fields, and Notion environment values.        |
| [Database setup](database-setup.md)       | Supabase/Postgres configuration, Drizzle migrations, and RLS notes.           |

## Features and operations

| Guide                                                | Use it for                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Authentication setup](authentication-setup.md)      | GitHub-only OAuth, account cap, manual admin promotion, and authentication architecture. |
| [GitHub OAuth setup](github-oauth-setup.md)          | OAuth Apps, exact callback URLs, and return paths.                                       |
| [User dashboard](user-dashboard.md)                  | Member profile fields, account gateway, and dashboard navigation.                        |
| [Admin dashboard](admin-dashboard.md)                | Server-side admin checks and manual role assignment.                                     |
| [Comments system](comments-system.md)                | Guest comments, Notion permissions, Turnstile, and guest identity behavior.              |
| [Member comments](member-comments.md)                | Separate Postgres comment feed, API, migration, and owner-only deletion.                 |
| [Contact form setup](contact-form-setup.md)          | Turnstile, Telegram delivery, and attachment limits.                                     |
| [Comments environment example](comments.env.example) | Optional guest-comment and Turnstile variables to merge into your environment.           |

## Repository policies

The repository root contains the [Code of Conduct](../CODE_OF_CONDUCT.md), [Contributing guide](../CONTRIBUTING.md), [Security policy](../SECURITY.md), and [Accessibility guidance](../ACCESSIBILITY.md).

## Recommended setup sequence

1. Set up Notion CMS access and content collections.
2. Configure PostgreSQL, then apply all committed migrations with `pnpm db:migrate`.
3. Add Better Auth and GitHub OAuth secrets/callbacks before testing account features.
4. Configure Turnstile and Notion comment permissions for guest comments; configure Telegram credentials only if the contact form should deliver messages.
5. For deployment, complete the [production checklist](deployment.md) and verify the relevant features in the deployed environment.
