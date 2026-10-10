# Contributing

Thanks for helping improve PM-Web. For substantial changes, open an [issue](https://github.com/prasad-kmd/pm-web_v2/issues) first so the intended behavior and scope can be discussed. Small documentation fixes can be sent directly as a pull request.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md), [Security Policy](SECURITY.md), and [Accessibility guidance](ACCESSIBILITY.md). Never include credentials, private user data, OAuth tokens, or production database exports in an issue or pull request.

## Development setup

- Use Node.js 22.13 or newer with the repository-pinned `pnpm@11.9.0`.
- Follow [Development setup](docs/development-setup.md) and the relevant feature guide from the [documentation index](docs/README.md).
- Use `.env.local` for local credentials; it is ignored by Git. Use test credentials and a non-production database when possible.

## Pull request workflow

1. Create a focused branch from the repository's current default branch.
2. Keep the change scoped and explain the user-visible behavior or problem it addresses.
3. Update relevant setup, security, accessibility, and feature documentation.
4. Include tests or a reproducible manual verification checklist when the change affects behavior.
5. Describe migrations, new environment variables, external-service permissions, and any deployment order.
6. Open a pull request with a concise summary, validation results, and screenshots for visual changes where useful.

There is no enforced commit-message convention; clear, descriptive messages are preferred.

## Project-specific rules

- Keep GitHub OAuth as the only sign-in method unless the project owner explicitly changes the product decision. Do not add email/password sign-in or email-verification flows as a side effect.
- Preserve the hard cap of 50 accounts, including admins. Existing accounts must still be able to sign in when the cap is reached.
- Keep profile updates limited to the approved profile fields. Never accept a role or OAuth avatar URL from an untrusted client.
- Keep guest comments in their existing Notion-backed flow and signed-in member comments in the separate Postgres table. The server—not a client-side flag—must enforce session and owner-only deletion.
- Continue to validate OAuth return destinations as same-origin paths and apply server-side authorization to every protected route/action.
- Keep database access and secrets server-side. Do not replace reviewed migrations with `drizzle-kit push`; custom triggers and row-level security must be preserved.
- Prefer free-tier-compatible services and avoid adding a dependency or paid external service without explaining why it is needed.
- Treat third-party assets and licensed components according to their own terms. Do not commit vendor credentials or license keys.

## Validation

Run the relevant checks from the project root:

```bash
pnpm format:check
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

For database/schema changes, also review the generated SQL and run:

```bash
pnpm db:generate
pnpm exec drizzle-kit check
```

Apply migrations only to a development/test database during development. Do not run production migrations from an unreviewed branch. If a change involves OAuth, database state, comments, or an external integration, include a manual test plan; successful type/lint checks do not verify those services.

### Known baseline check failures

At the time this guidance was written, full-project ESLint reports pre-existing `react-hooks/set-state-in-effect` errors in `components/animate-ui/primitives/effects/highlight.tsx` and `hooks/use-controlled-state.tsx`. TypeScript reports pre-existing errors in `components/animate-ui/primitives/animate/slot.tsx` and `components/animate-ui/primitives/effects/highlight.tsx`. If those baseline errors remain, identify them separately from failures introduced by your change and include the exact command/output summary in the pull request. Do not suppress or modify unrelated rules just to make a check appear green.

## Review and communication

Pull requests may receive requests for changes or be closed if they introduce security, privacy, accessibility, licensing, or scope concerns. For vulnerability reports, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.
