# Security Policy

## Supported code

This repository does not publish a separate supported-version matrix. Security reports should identify the affected commit or deployment; fixes will be developed against the current default branch unless maintainers advise otherwise.

## Report a vulnerability privately

Please email [hello@prasadk.xyz](mailto:hello@prasadk.xyz) with **Security report — PM-Web** in the subject. Do not open a public issue or pull request containing an unpatched vulnerability or exploit details.

Useful information includes:

- The affected route, component, dependency, or commit.
- A concise description of the impact and realistic attack conditions.
- Minimal reproduction steps or a proof of concept that does not access or alter other people's data.
- Any suggested mitigation and a safe way to contact you.

Please do not include live credentials, personal data, or production-user content in a report. If a secret has been exposed, revoke or rotate it immediately and then notify the maintainer. Do not test against production systems or accounts without explicit authorization.

The maintainer will acknowledge and investigate reports as availability allows, coordinate a fix and disclosure where appropriate, and avoid publishing reporter details without consent. There is no guaranteed response or remediation SLA. If you receive no response, you may send a concise follow-up to the same address.

## Security-sensitive project areas

- OAuth callback and same-origin redirect validation.
- Server-side authorization for `/dashboard` and `/admin`; admin roles are manually assigned in the database.
- The 50-account registration cap and its PostgreSQL trigger/counter.
- Server-only `DATABASE_URL`, Better Auth secrets, GitHub OAuth secrets, Notion tokens, Turnstile secrets, and Telegram bot credentials.
- Row-level security and reviewed Drizzle migrations.
- Guest comments stored in Notion and signed-in member comments stored separately in Postgres, including owner-only deletion.

Never put production secrets in issues, screenshots, committed files, browser code, or client-prefixed environment variables. Security-sensitive changes should include a migration/configuration review and should not weaken the protections above without an explicit design decision.
