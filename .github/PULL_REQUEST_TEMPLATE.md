## What this changes

<!-- One or two sentences. What the change does, not which files it touches. -->

## Why

<!--
The problem this solves. Link the issue if there is one (`Closes #12`).
If this was not discussed in an issue first and is larger than a one-line fix,
say so here — it may need to wait for a phase.
-->

## How to verify it locally

<!--
This project has no deployed instance, so there is no preview URL. Give the
reviewer the smallest sequence that shows the change works:

1. pnpm dev
2. Open http://localhost:3000/…
3. …
-->

## Screenshots

<!--
Anything visual, in BOTH themes. Drag images into this box.
Delete this section if the change is not visual.
-->

| | Light | Dark |
| --- | --- | --- |
| Before | | |
| After | | |

## Checklist

**CI runs the first four. Run them locally so you are not waiting on a queue.**

- [ ] `pnpm lint` — zero errors **and zero warnings**
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm build` — succeeds
- [ ] Formatting — the files you changed match the style around them (`pnpm format:check` is not currently clean and is not a CI gate)
- [ ] Documentation updated in **this** pull request, not a follow-up
- [ ] Keyboard pass over anything focusable
- [ ] `prefers-reduced-motion` honoured by anything that animates
- [ ] No new secrets or third-party accounts required to run the project

## Rules (`RULES.md`)

- [ ] No `any`, no `@ts-ignore`, no `as unknown as`
- [ ] No `dangerouslySetInnerHTML`
- [ ] No `middleware.ts` — Next.js 16 uses `proxy.ts`
- [ ] Non-null `!` only with a comment explaining why it cannot be null
- [ ] No commented-out code, no `console.log`

## Scope

- [ ] This pull request is **one concern**. A bug fix and a dependency bump and a
      reformat is three pull requests.
- [ ] If this changes the database schema, a migration is included and
      `pnpm db:migrate` has been run against a fresh database.
- [ ] If this touches auth, the redirect-back behaviour still works from an
      arbitrary page.
