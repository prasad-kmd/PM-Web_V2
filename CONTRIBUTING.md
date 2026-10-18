# Contributing

Thanks for wanting to help. This is a personal engineering archive with a single
maintainer, so the flow below is deliberately small — most of it is about saving
you the round trip of a change that could not be merged.

Written for someone who has just cloned the repository.

---

## Before you start

1. Read the [README](README.md) for what the project is, and
   [`RULES.md`](RULES.md) for the code rules. The rules are enforced, not
   aspirational — a pull request that breaks one will be asked to change even if
   the feature is good.
2. **Open an issue first for anything larger than a typo or a one-line fix.**
   Not as a formality: this project is built in phases, and a change that does not
   fit the current phase may simply have to wait. Better to find that out before
   you write the code than after.
3. Small, obviously-correct fixes (a typo, a broken link, an accessibility
   improvement) can go straight to a pull request.

---

## Development setup

**Requirements:** Node **22.13+**, pnpm **11**.

```bash
git clone https://github.com/prasad-kmd/PM-Web_V2.git
cd PM-Web_V2
pnpm install
cp .env.local.example .env.local
pnpm dev
```

**You do not need a database to work on most things.** Content pages read from
Notion and every non-auth page renders without Postgres. You need a database only
for `/sign-in`, `/dashboard` and `/admin` — see
[docs/database-setup.md](docs/database-setup.md).

You do not need Notion credentials either, unless you are changing the content
renderer: pages render their "not ready to serve" state instead of failing.

### Commands

| Command | What it does |
| ------- | ------------ |
| `pnpm dev` | Development server on `http://localhost:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | `eslint .` — **zero warnings is the bar** |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier, writing changes — **see the warning below** |
| `pnpm format:check` | Prettier, check only — **not currently clean, and not a CI gate** |
| `pnpm db:generate` | Generate a migration from `lib/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Browse the database |

---

## Conventions

### Branches and commits

Branch names: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(comments): mark owner comments with a badge
fix(auth): stop the callback sanitiser accepting a protocol-relative URL
docs(env): document AUTH_TRUSTED_ORIGINS
```

The scope is the area, not the file. `CHANGELOG.md` is written by hand at the end
of each phase, so a good commit message is what makes that possible later.

### Code style

**Do not run `pnpm format` on the whole repository.** It will rewrite files you
did not touch — see *Formatting* below. Format the files you changed, or leave
formatting alone and match the style of the file you are editing.

ESLint's flat config is the source of truth for the enforced rules, and it
encodes `RULES.md`. The rules that catch people out:

- **No `any`**, no `@ts-ignore`, no `as unknown as`. If a type is genuinely
  unknowable, narrow it with a runtime check or type the boundary explicitly.
- **No `dangerouslySetInnerHTML`.** There is exactly one in the codebase, for
  JSON-LD, and it is not a precedent.
- **No `middleware.ts`.** Next.js 16 uses `proxy.ts` — a rename, but the file
  name matters to the framework.
- **Non-null `!` only with a comment saying why it cannot be null.**
- **No `console.log`** in committed code. `console.error`/`console.warn` on real
  error paths is fine and used deliberately.
- **Accessibility is not optional.** Keyboard reachability, visible focus, `alt`
  text, `role="alert"` on errors, and `prefers-reduced-motion` on anything that
  moves.

Comments explain *why*, not *what*. The existing code is a good guide: most
non-obvious decisions carry a note about the alternative that was rejected and
the reason, which is usually the part that is expensive to recover later.

### Files

- `components/ui/` — primitives. Changing one affects the whole site.
- `components/react-bits/` — third-party blocks, restyled to the site's tokens in
  `app/globals.css`. Keep them consistent with everything else rather than
  shipping them as found.
- `lib/` — no React. If it needs a hook, it belongs in `hooks/`.
- `docs/planning/` — the roadmap of record. Do not edit it in a feature PR.

### Formatting

Prettier is configured (`.prettierrc`) but **the repository is not currently
Prettier-clean**, and `pnpm format:check` is deliberately **not** a CI gate. Two
things follow:

- **Do not run `pnpm format` across the repository.** It would rewrite on the
  order of a hundred files, none of them yours.
- **Match the file you are editing.** The codebase is mixed — some files use
  semicolons, some do not — and introducing a third convention is worse than
  either. If you reformat, reformat only the files in your change.

Making the repository uniform is a worthwhile one-off chore. It is not a
prerequisite for a bug fix, and a PR that mixes the two will be asked to split.

---

## Pull request checklist

CI runs the first three. Run them locally first so you are not waiting on a
queue.

- [ ] `pnpm lint` — **zero errors and zero warnings**
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm build` — succeeds
- [ ] Formatting — the files you changed match the style around them
- [ ] Screenshots for anything visual, in **both light and dark mode**
- [ ] Keyboard pass over anything with a focusable element
- [ ] Documentation updated **in the same pull request**, not a follow-up
- [ ] No new secrets, API keys or third-party accounts required to run the project

Please keep pull requests to one concern. A PR that fixes a bug *and* reformats a
file *and* bumps a dependency takes three times as long to review and will be
asked to split.

### What not to send

- **Drive-by redesigns.** The visual language is deliberate; a restyle needs an
  issue and a discussion first.
- **Dependency bumps without a reason.** "Latest" is not a reason. A security
  advisory is.
- **Generated files, build output, `node_modules`.** `.gitignore` covers them.
- **Commented-out code.** That is what version control is for.
- **A new dependency where twenty lines would do.** Every dependency is a
  maintenance obligation and an attack surface.

---

## Running and verifying locally

There is **no deployed instance** at v2.9.0, so there is no preview URL to point
at. A change is "verified" by the checklist above plus the local server — which
means the local run matters more here than in a project with previews.

The verification suites live outside the repository (anything inside it gets
linted). Copy them in, run, remove:

```bash
mkdir -p .verify && cp verification/*.mjs .verify/
node .verify/nav.test.mjs        # structure, no database
rm -rf .verify
```

---

## Where to ask

- **Questions** — open a discussion or an issue. There is no wrong question;
  a question that reveals unclear documentation is a contribution.
- **Bugs** — an issue, with steps to reproduce.
- **Vulnerabilities** — **never a public issue.** See [SECURITY.md](SECURITY.md).
- **Accessibility barriers** — an issue is fine, or email; see
  [ACCESSIBILITY.md](ACCESSIBILITY.md).

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
