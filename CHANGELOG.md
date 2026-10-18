# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — v2.9.0

Authentication for a one-owner site (GitHub OAuth, Supabase + Drizzle, Better
Auth), plus the pages, docs and governance files around it. Roadmap:
[`docs/planning/02-implementation-roadmap.md`](docs/planning/02-implementation-roadmap.md).

**Progress:** Phase 0 ✅ · Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phase 5 ✅ · **Phase 6 ✅ — v2.9.0 complete** · Phase 7 (optional) not started.

### Added — Phase 6 (governance and hardening)

The six documents that make this repository reviewable by someone who did not
build it, plus the configuration cleanup that the reading of them exposed.

- **`README.md`** — replaces the 1.4 kB create-next-app stub. Badge block, what
  the project is, the stack with a one-line reason per choice, a quickstart that
  works **without a database**, the setup guides as a table, the quality gates,
  project structure, the phase roadmap, and a **Status** section that says plainly
  that nothing is deployed.
- **`ACCESSIBILITY.md`** — the WCAG 2.2 AA commitment and what already implements
  it (reader controls, reduced motion, live regions, landmarks, contrast tokens),
  followed by **Known limitations** written specifically: there is no skip link
  and adding one means giving six `<main>` landmarks an id; the auth pages have
  not been driven with a screen reader; Notion media is only as accessible as the
  author made it; and there has been no formal audit, so the claim is a target and
  not a certification.
- **`SECURITY.md`** — supported versions (2.9.x only), private reporting through
  GitHub advisories or email, acknowledgement in ≤ 72 h and assessment in ≤ 7 d,
  in-scope areas named individually (callback sanitiser, seat gate, role
  escalation, comment role forgery, secret exposure), and a **Known and accepted**
  list so nobody spends an evening reporting the documented behaviour.
- **`CONTRIBUTING.md`** — branch and commit conventions, the command table, the
  `RULES.md` rules restated as things that will actually get a pull request
  changed, a PR checklist that mirrors CI, a **What not to send** section, and an
  honest note that there are no preview deployments, which is why the local run
  matters more here.
- **`CODE_OF_CONDUCT.md`** — the Contributor Covenant v2.1 reproduced verbatim,
  with the enforcement contact filled in, preceded by an **About this project
  first** section: content is curated, a declined pull request is not a rejection
  of the person, and the standards bind the maintainer too.
- **`docs/README.md`** — an index that routes by *intent* (“I want to turn on
  GitHub sign-in”) rather than by filename, and states at the top that most of the
  directory is not needed to run the project.
- **`docs/deployment.md`** — **nothing in it has been executed.** It exists because
  deployment knowledge decays fast: the seat-before-you-go-public step, production
  env vars, the second OAuth app (GitHub allows one callback each), the three
  values that must agree or you get a redirect loop, the CSP tightening that can
  only be verified against a production build, the Supabase keep-alive, the GitHub
  repository settings that `SECURITY.md` depends on, and a rollback section.
- **`LICENSE`** — the official AGPL-3.0 text (661 lines, fetched from gnu.org and
  reproduced byte-for-byte). `package.json` already declared `AGPL-3.0` with no
  file to point at.
- **`docs/planning/02-implementation-roadmap.md`** — Phase 6's status note, and
  Phase 5's "Next up: Phase 6" retired. The roadmap of record now marks all seven
  phases, including the deviations the later ones took.
- **`.github/ISSUE_TEMPLATE/`** — `bug_report.yml` and `feature_request.yml` as
  forms, with structured fields for what a reproduction actually needs (revision,
  environment, console output), plus `config.yml` that routes security reports,
  accessibility barriers and setup questions away from the tracker.
- **`.github/PULL_REQUEST_TEMPLATE.md`** — one concern per PR, a light/dark
  screenshot table, and the `RULES.md` checks as boxes.

### Changed — Phase 6

- **`next.config.mjs`: four unused hosts removed from the CSP and
  `remotePatterns`.** `prasadm.vercel.app` (the previous, inactive project's
  domain), `vitals.vercel-analytics.com` and `api.vercel.com` were verified to
  have **zero** references in `app/`, `components/` and `lib/` before removal.
  A host allowance with no code using it is only a widening of the policy.
- **A malformed `remotePattern` removed.** One entry was
  `hostname: "ghchart.rshah.org/409ba5/prasad-kmd"` — a path inside a hostname.
  Next.js feeds `hostname` to `new URL()`, so that pattern could never match
  anything. The same string *is* valid in a CSP `img-src`, which is why it looked
  plausible where it sat.
- **`images.contentSecurityPolicy` added** beside `dangerouslyAllowSVG: true`, so
  an SVG fetched through the image optimiser is sandboxed. The two settings belong
  together; the second without the first is the risky half.
- **`docs/notion-cms-setup.md`** no longer instructs anyone to set
  `NEXT_PUBLIC_SITE_URL=https://prasadm.vercel.app`. It was the only *live*
  instruction pointing at the old domain — the other references are comments
  explaining what not to do.

### Removed — Phase 6

- `prasadm.vercel.app`, `vitals.vercel-analytics.com`, `api.vercel.com` and
  `va.vercel-scripts.com` from the Content-Security-Policy and image
  configuration. **No analytics script was ever loaded** — these were
  allowances left over from the create-next-app and Vercel defaults, and
  `vitals.vercel-analytics.com` in a CSP is exactly the kind of line that reads
  as “this site reports to Vercel” when it does not.

### Decided — Phase 6

- **The GitHub repository settings are documented, not applied.**
  `docs/deployment.md` §8 lists them (private vulnerability reporting, branch
  protection, CodeQL, Dependabot, topics, social card) because they need the
  repository owner's account. Until private vulnerability reporting is switched
  on, the instruction at the top of `SECURITY.md` points at a disabled page —
  that is a known, deliberate gap rather than an oversight.
- **Deliberately kept:** `avatar.vercel.sh` and the `ghchart.rshah.org` image host
  (both still referenced), and `x-vercel-forwarded-for` in
  `lib/comments/request-context.ts` — that is client-IP header support, not a
  host allowance.
- **`README.md` states the absence of analytics explicitly**, at the user's
  request. A reader who sees no analytics badge should find out why in the README
  rather than guess.
- **No new dependencies, and no code changes** beyond `next.config.mjs`. Phase 6 is
  documentation and configuration by design.

### Found — Phase 6

**The repository has never been Prettier-formatted, and `.prettierrc` is empty
(`{}`).** Discovered while checking whether the new documents could honestly list
`pnpm format:check` as a gate. They could not:

- `.prettierrc` contains no rules, so Prettier applies its defaults — including
  `semi: true`. The codebase, however, is **mixed**: 133 `.ts`/`.tsx` files lean
  semicolon-terminated and 77 do not. No single `semi` setting makes it clean.
- With Prettier's defaults, **82 files** fail `format:check`. With `semi: false`,
  **228** fail. Either way, running `pnpm format` rewrites files nobody touched.
- `format:check` is **not** in `.github/workflows/ci.yml`, which runs `lint`,
  `typecheck` and `build` — which is the only reason this has never blocked a
  pull request.

**Nothing was reformatted.** A hundred-file diff with `typecheck` and `build`
unrunnable in this environment is not a change that can be verified, and it would
bury the actual deliverable. What changed instead:

- `CONTRIBUTING.md` now says **do not run `pnpm format` across the repository**,
  explains why, and asks contributors to match the file they are editing. The
  previous draft — written earlier in this same phase — said "Prettier is
  authoritative, run `pnpm format`", which would have handed contributors a
  command that rewrites their checkout.
- `pnpm format:check` is labelled as **not currently clean and not a CI gate** in
  both `CONTRIBUTING.md` and the pull-request template.

Picking a `semi` value and running `pnpm format` once is a **worthwhile one-off
chore**, and it is the right way to end this. It is deliberately left to the
repository owner because it is a house-style decision, not a defect with a
correct answer, and because it deserves its own commit that says nothing else.

### Verification — Phase 6

`pnpm lint` **clean, exit 0.** `pnpm typecheck` was clean at Phase 5 packaging but
**cannot be run in this environment any more** — see the note below.

A new suite, `verification/docs-claims.test.mjs`, runs **50 checks** with no
database, no build and no server. Because Phase 6 shipped no code, the exposure it
covers is not a crash: it is **a document describing software that does not
exist**, which is worse than no document because a reader trusts it. So the suite
checks *claims* rather than prose — every `pnpm` script named in the documents
exists, every relative link resolves, the badge image is a real file, no document
claims a deployed instance, the CSP relaxations admitted in `SECURITY.md` are the
ones actually in `next.config.mjs` (in both directions), `ACCESSIBILITY.md`'s
"there is no skip link" is still true, the reader-controls list matches the
accessibility panel, and `docs/README.md` indexes every guide that exists.

**209 checks in total** across all suites (50 + 34 + 39 + 27 + 51 + 8). The three
non-database suites were re-run and pass. The three database suites need
PostgreSQL and were not re-run — Phase 6 changed no code they cover.

**Both application paths were verified byte-identical:** the cumulative
`phase-0+1+2+3+4+5+6.patch` onto a clean clone, and `phase-0+1+2+3+4+5.patch` then
`phase-6.patch`, produce a tree with the same SHA-256 over every file
(`96c323d9…`) as the development workspace. The 50 checks were then re-run
**against the patched tree**, not only against the workspace, so they pass on what
a reader will actually have.

Documentation was verified against the code rather than against itself, because
every claim in these files is a claim about a moving codebase:

- **Every command in every table exists** in `package.json`'s scripts. The
  README's quality-gate block and `CONTRIBUTING.md`'s command table were checked
  script by script.
- **Every path linked from a root document resolves.** The image at the top of the
  README is `public/svg/pm4.svg`, which exists; the earlier draft pointed at
  `public/img/logo.svg`, which does not — that is now a check rather than a hope.
- **Every factual claim about behaviour was traced to its implementation** before
  being written down. Two did not survive: a claim that the auth error path
  compared codes in constant time (invented — what actually happens is that
  non-code-shaped input is discarded entirely, which is now what the document
  says), and a reader-controls list that omitted the typeface switch.
- **The `prasadm.vercel.app` grep is now a release gate.** Any live instruction
  containing it is a bug, and at Phase 6 close there is exactly one class of
  remaining reference: comments stating that the domain is *not* this project.

**Five failures appeared on the first run of the new suite, and four of them were
in the test, not the deliverable** — recorded because the pattern is the useful
part:

1. `pnpm install` was reported as a missing script. pnpm's own subcommands are
   not `package.json` scripts; the check now has an explicit allow-list.
2. Disclaimers were matched per line, and the documents wrap at 80 columns, so a
   bullet whose disclaimer sat on the previous line was flagged. The check is now
   section-aware.
3. **`config.yml` genuinely did not name `SECURITY.md`** — the one real defect the
   suite caught. It linked to the advisory form but never to the policy document.
4. `feature_request.yml` was required to carry its own security warning. It does
   not, deliberately: the chooser disables blank issues and shows the security link
   to everyone before they pick a form. Requiring it in both was asserting a
   convention this project does not have.
5. A dead helper left over from an abandoned draft of the licence check, which
   asserted `true`.

**The one thing Phase 6 could not verify is the one that matters most for
reviewers: nobody has read these documents cold.** They are internally consistent
and consistent with the code, which is a different property from being
comprehensible.

### Note — the typecheck gate moved to CI

`pnpm typecheck` cannot complete in the development environment any more.
Packaging Phase 5 deleted `tsconfig.tsbuildinfo`, so every run is a cold
`tsc --noEmit`, and a cold run no longer fits in the 1.9 GB available: it is
OOM-killed at the default heap and at `--max-old-space-size=700`. Stopping
Postgres, dropping caches and retrying did not help, and one attempt hung the
environment for half an hour.

This is an environment limit, not a code problem — the same command passed at
Phase 5 packaging, and `.github/workflows/ci.yml` runs it on a runner with room
for it. **CI is the gate for typechecking from here.** Worth recording for anyone
who wonders why a local run is failing: it is memory, and it is not your change.

### Added — Phase 5 (signed-in comments, robots, docs)

- **Signed-in comments.** A visitor who is signed in gets the composer prefilled
  from their session and locked, with a line offering to sign out and comment as a
  guest. Their comment is stored in the **`PMc2`** wire format — one extra
  segment carrying `owner` or `member` — and renders with an **Owner** badge.
- **`lib/comments/viewer.ts`** — the single place that maps an account to a
  comment role. Two call sites need it (the POST handler and the article page)
  and they must never disagree.
- **`app/robots.ts`**. This file did not exist before, so Next served a default
  that allowed everything, including `/admin` and `/dashboard`.
- **`docs/env-variables.md`** — every variable, what happens when it is missing,
  and where each value comes from.

### Changed — Phase 5

- **`app/api/comments`** now reads the session. When one exists the author is
  built from the session — name, email, avatar **and role** — and whatever the
  request body sent for those fields is ignored. A client that posts
  `role=owner` is not rejected; it is ignored, which needs no explanation and has
  no error path to get wrong.
- **`components/notion/ContentDetailPage.tsx`** reads the session on the server
  and passes a `viewer` down, so the client form never has to ask who it is.
  `getSession()` is memoised per request, so this costs nothing extra.
- **The publish version is now `2.9.0`.** `siteConfig.revision` reads it from
  `package.json`, so the sidebar badge follows automatically.

### Fixed — Phase 5

- **A dead file that could have silently reverted this entire phase.**
  `components/comments/CommentsPanel.tsx` was unreferenced, from before the
  panel was refactored, and exported the *same name* as the live
  `comments-panel.tsx`. On a case-insensitive filesystem (macOS, Windows) those
  two paths are one path, and the import could resolve to the old component —
  whose props are `{ type, slug }` rather than `{ pageId, contentTitle }`. It
  would not have failed a typecheck on Linux, and it would not have looked wrong
  until it was running. Removed.
- **Browser exception text was being rendered as product copy.** The comment
  feed printed `cause.message` on a failed fetch, which for a dropped connection
  is the browser's `"Failed to fetch"`. Only messages carried by the API's own
  error type are shown now; anything else gets a sentence written here.
- **`window.confirm` is gone from the admin surface**, replaced by the site's own
  `Dialog`. Cancel is first in the DOM and the popup's close button is suppressed,
  because Base UI moves focus into the dialog and the first focusable element is
  what a stray Enter activates. With JavaScript off the button is still
  `type="submit"` and posts straight through, exactly as it did before — a guard
  rail should never be the thing that *creates* a dependency.
- **A profanity block used to disable the composer with no way back.** The
  blocked-word list is now cleared when the text changes, because the block
  described the text that was submitted, not the text on screen.

### Decided — Phase 5

- **`/roadmap` and `/changelog` are out of the footer.** Both describe the
  repository rather than the site, and the only way to build them was Markdown →
  HTML → `dangerouslySetInnerHTML`, which `RULES.md` §4 forbids. `SECURITY.md` and
  the planning pack stay where they are, in the repository, written as they are.
- **The "Systems operational" badge is gone.** It replaced a link to `/status`,
  which never existed. This repository is not deployed anywhere, so a pulsing
  green light was a claim about a service that does not run.
- **Bookmarks sync is not built.** It needs a `user.preferences` JSONB column —
  a migration — to sync state that `ContentBookmarksProvider` already persists
  per device, on a site that runs on one machine. The cost is real and the
  benefit is zero until there is a second device.
- **The one `autoFocus` in the codebase is now justified in place** rather than
  removed. It is on the table-of-contents disclosure, where focus has to enter
  the content that was just revealed.

### Verification — Phase 5

**34 new checks** (`verification/comments-format.test.mjs`), plus the whole
existing suite re-run: 39 structural + 27 admin + 51 auth + 8 provider.
**159 checks in total**, `pnpm typecheck` and `pnpm lint` clean. No database and
no build needed for the new suite.

The format suite exists because `lib/comments/format.ts` is pure — it imports
types and nothing else — and the thing most likely to break is silent:

- **A `PMc1` comment parses exactly as it did before v2.9.0.** Every comment
  already in Notion is in that format, and a mistake in the parser would not show
  up until somebody happened to open an old article. The test pins the full output
  — role `null`, name, email, avatar, handle, source and body — not just that it
  does not throw.
- **An invented role is ignored.** `[PMc2|X|x@…|||superowner]:` parses with
  `role: null`, because the decoder validates against an allow-list on the way in
  *and* on the way out. A comment can be hand-edited in Notion after it is
  written.
- The role spelling is exact across seven spellings, and truncation keeps the
  role segment intact at the 2000-character cap.
- **The role is never read from the request body**, checked structurally: every
  mention of `role` in the route must trace back to the session, and the zod
  schema has no such field to send.
- The case-colliding duplicate has not come back, `/feed.xml` and `/status` are
  still absent from `lib/nav.ts`, `robots.ts` still derives from the shared
  exclusion list rather than hard-coding one, and every variable in
  `.env.local.example` is documented.

Two of the checks were wrong when first written and the code was right — both
because they matched their own explanatory comments rather than the code. Worth
recording: a test that greps prose will eventually find the prose.

### Added — Phase 4 (admin surface)

- **`/admin` overview** — accounts, administrators, seats used against the limit,
  and registration state. The registration card always says *which* reason
  applies: the toggle being off, or the seat limit being reached. "Closed" alone
  is a bug report waiting to happen, because the two have different fixes.
- **`/admin/users`** — every account with its role, join date and last sign-in,
  plus promote, demote and remove. Adapted from the Pro `data-table-*` blocks
  without their client-side sorting, filtering or pagination: with a seat limit in
  the single digits, all three would be code that never runs.
- **`/admin/settings`** — the seat limit and the registration toggle, which is the
  "change the allowable user count in the DB" control from item 6 given a form.
  Saving records **who** changed it in `site_settings.updated_by`.
- **`lib/admin/settings.ts`**, **`lib/admin/users.ts`**, **`lib/admin/queries.ts`**,
  **`lib/admin/messages.ts`** — the rules, the reads, and the copy.
- **`components/admin/`** — `AdminNav`, `AccountsTable`, `SiteSettingsForm`,
  `AdminNotice`, `ConfirmSubmit`.
- **`docs/admin-guide.md`** — how to become an administrator, what each screen
  does, the seat semantics, the SQL equivalents, and the reasoning behind the
  plugin decision.

### Changed — Phase 4

- **`lib/auth/server.ts`** — both session reads are wrapped in React's `cache()`,
  so a layout and a page that both need the session cost one database query
  instead of two.
- **`app/admin/**`** — the Phase 3 placeholder body is replaced by the real
  surface. The route group the roadmap sketched (`app/admin/(panel)/…`) was
  dropped: it would wrap a single group with a single layout, the same behaviour
  with an extra directory between the reader and the file.

### Fixed — Phase 4

- **Four ways the admin surface could have locked you out of itself.** None
  shipped, all now covered by tests: demoting the only administrator, deleting the
  only administrator, two simultaneous demotions each seeing "2 administrators and
  acting on it, and a settings `UPDATE` against a database with no
  `site_settings` row (a freshly migrated one has none — the write is an upsert).
- **Row-action results travel as codes, not sentences.** The result of a row
  action comes back in the query string, and a query string is written by whoever
  builds the link — so `/admin/users?error=<anything>` would have rendered that
  text on the admin page in this site's own styling. Actions now return a code
  from a closed set and `lib/admin/messages.ts` holds the copy.

### Decided — Phase 4

- **Hand-written server actions, not better-auth's `admin()` plugin.** The plugin
  was the roadmap's first suggestion. It needs a migration (four columns), ships
  an impersonation endpoint, and its ban feature is meaningless on a site where
  every account was invited and removal is the operation that actually happens.
  `site_settings.updated_by` already existed for the audit trail, so this approach
  adds no columns at all. Recorded in `docs/admin-guide.md` §5, along with the
  conditions under which the plugin becomes the right answer.

### Verification — Phase 4

**27 behavioural checks** (`verification/admin-actions.test.mjs`) against a live
PostgreSQL, plus the Phase 3 structural suite grown to **39**, and Phase 2's
suites re-run unchanged at 51 + 8. **125 checks in total.**

The value of the split between `lib/admin/**` and `app/admin/actions.ts` shows up
here: a `"use server"` module only runs inside a request context, so its functions
cannot be called from a harness. Keeping the rules in plain functions is what lets
the suite call them and assert what they *do*, rather than grepping the action file
for the right words.

- The settings write creates its row on a database that has none, updates in place
  afterwards, records `updated_by`, and writes nothing at all when validation
  fails.
- `max_users` refuses `0`, `1.5`, `-1`, `1e3`, `abc`, an empty field and `1001`;
  accepts `1` and `1000`.
- The last administrator cannot be demoted or deleted, and the role is verified
  unchanged afterwards — the refusal is not merely reported.
- **Two simultaneous demotions leave exactly one administrator.** Without the
  `SELECT … FOR UPDATE` on the settings row, both transactions would read
  "2 administrators", both would demote, and the site would be left with none.
  This is the check that would fail first if the lock were ever removed.
- Removing an account takes its sessions with it (the cascade fires), reports a
  missing row instead of throwing, and frees a seat.
- **Lowering the limit below the account count deletes nobody** — only creation is
  gated, which is the roadmap's acceptance criterion stated as an assertion.
- `listAccounts` keeps an account that has never signed in (a `LEFT JOIN`, not an
  inner one — that account is the one an operator is most likely looking for), and
  `getAdminOverview` survives a completely empty database.

Gates: `pnpm typecheck` exit 0, `pnpm lint` exit 0.

### Added — Phase 3 (pages, and the redirect-back guarantee)

- **The five screens.** `/sign-in`, `/sign-up`, `/not-authorized`, `/dashboard`
  and `/admin`, each with `robots: { index: false, follow: false }` and each
  listed in `NON_INDEXABLE_ROUTES` so the sitemap drops it automatically.
- **`/tools`** — a "coming soon" page that retires a link four navigation
  surfaces pointed at while no route existed. `index: false, follow: true`: a
  thin placeholder should not rank, but links to it should still pass signal.
- **`proxy.ts`** — the Next 16 request gate. It reads the session by fetching
  `/api/auth/get-session` rather than importing `lib/auth.ts`, which keeps
  `postgres.js` and Drizzle out of the edge bundle, and it passes
  `disableCookieCache=true` for `/admin*` so a database role change is honoured
  on the next request rather than within five minutes.
- **`components/auth/`** — `SignInButton`, `SignInCard`, `AuthRedirectGuard`,
  `UserMenu`, `SignOutButton`, and `RegistrationClosed` for the closed and
  unknown seat states.
- **`hooks/use-sign-out.ts`** — signing out without navigating. The reader stays
  on the page they were reading; only the session changes. The one redirect comes
  from the gate, not the button.
- **`lib/nav.ts`** — the route registry. All four navigation surfaces now read
  one list instead of keeping private copies, and `verification/nav.test.mjs`
  resolves every entry against the filesystem.
- **`lib/auth/error-messages.ts`** — `?error=` codes to sentences. Unmapped
  values are not echoed, so a crafted link cannot render arbitrary text on the
  page in this site's styling.
- **The account entry point in all four surfaces** — navbar, sidebar rail,
  mobile dock and footer. On the dock the item switches between "Sign in" and
  "Account" depending on the session.
- **`docs/auth-setup.md` §10** — the route table, the two-gate model, and where
  each entry point lives.

### Fixed — Phase 3

- **Ten dead links in the footer.** `EXPLORE_LINKS`, `PROJECT_LINKS` and
  `LEGAL_LINKS` each held their own copy of the link list, and the copies had
  drifted: `/now`, `/uses`, `/roadmap`, `/changelog`, `/open-source`,
  `/privacy-policy`, `/terms-and-conditions`, `/disclaimer` and `/security` were
  all live links to pages that were never built. They now render as text marked
  "soon" — visible as intent, not clickable, and deliberately not focusable.
- **The RSS icon pointed at `/feed.xml`, which has never existed.** The feed is
  `app/rss.xml/route.ts`. Every reader who clicked the RSS icon got a 404.
- **The footer's status badge linked to `/status`**, another route that does not
  exist. It is decorative text now.
- **`AuthRedirectGuard` covers the cases the proxy cannot see** — the back
  button, a second tab left on the form, a restored session. None of those
  produce a document request, so a server-side gate never gets a look at them.

### Verification — Phase 3

**31 structural checks** (`verification/nav.test.mjs`) plus the Phase 2 suites
re-run unchanged at 51 + 8. The Phase 3 set is the class of mistake this phase
exists to fix: four surfaces with private link lists and nothing comparing them
to the routes on disk.

- Every `href` in `PRIMARY_NAV`, `SIDEBAR_NAV` and `FOOTER_EXPLORE` resolves to a
  real page; `/tools` is present in all four surfaces.
- Every footer entry is either `shipped` or explicitly `planned` — and the check
  asserts that a plan is *still* unbuilt, so building one turns the test red
  until the list is cleaned up.
- The registry parser asserts its own output (`AUTH_ROUTES.x` references
  resolved), because a regex over a half-resolved list would silently check three
  entries of six and report success.
- `proxy.ts` exists, exports `proxy` (Next 16 ignores `middleware`), has no
  `middleware.ts` beside it, and its matcher covers every protected route without
  a broad catch-all that could lock readers out of public pages.
- Three redirects in `proxy.ts`, three calls to the one sanitiser.
- `/dashboard` and `/admin` call their own guard with an explicit path, so a
  direct request cannot lean on the proxy.
- No file outside the registry, the sanitiser and `SignInButton` hand-writes a
  `/sign-in` link.
- No `"use client"` file imports the database or the auth server. `import type`
  is exempt — `lib/auth-client.ts` uses it deliberately to infer the session
  shape, and it is erased at compile time.

Gates: `pnpm typecheck` exit 0, `pnpm lint` exit 0. Phase 2's suites re-run
against a freshly migrated database: **51 + 8, unchanged**.

### Added — Phase 2 (auth core)

- `lib/env.ts` — one validated place for server configuration. No fallback
  secrets; a missing variable stops the process with a message naming **every**
  missing key. GitHub credentials are all-or-nothing: both, neither, or a loud
  failure on one — never a provider built from placeholders.
- `lib/auth.ts` — better-auth with the Drizzle adapter, GitHub the only provider,
  database sessions with a 5-minute cookie cache, rate limiting, and the seat gate
  wired into `databaseHooks.user.create.before`.
- `lib/auth/registration.ts` — the seat gate. `INSERT … ON CONFLICT DO NOTHING`
  self-heals a fresh database, `SELECT … FOR UPDATE` serialises concurrent
  sign-ups, and the count is read under that lock. Throws
  `APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED" })`, which better-auth
  turns into a redirect back to the sign-in card.
- `lib/auth/callback-url.ts` — `sanitizeCallbackUrl()`, the single open-redirect
  guard, plus `buildSignInHref()` so no caller hand-writes the query string.
- `lib/auth/server.ts` — `getSession`, `getFreshSession`, `requireUser`,
  `requireAdmin`, `requireAdminApi`. Every one takes its callback path as an
  **explicit argument**; none reads `Referer` or a spoofable header.
- `lib/auth-client.ts` — browser client with `inferAdditionalFields` so
  `session.user.role` is typed. Type-only import; no server code reaches the bundle.
- `app/api/auth/[...all]/route.ts` — better-auth's HTTP surface.
- `docs/auth-setup.md` — OAuth app creation, env table, session semantics, the
  five-hop redirect model, the seat-gate SQL, the local-only constraints, an
  error catalogue and troubleshooting.

### Changed — Phase 2

- `lib/content-metadata.ts`, `app/layout.tsx` — the site origin is now defined
  once, in `lib/env.ts`. The previous default, `https://prasadm.vercel.app`,
  belongs to the **previous, inactive** site and is gone: metadata and canonical
  URLs default to `http://localhost:3000`.
- `lib/env.ts` — GitHub configuration is a function, not a module-level constant,
  so a mistyped OAuth variable cannot break every page that reads the site origin.
- `docs/planning/02-implementation-roadmap.md` — Phase 2 marked done; two claims
  in its own sketch corrected after they were disproved (see below).
- `docs/planning/03-auth-architecture.md` — new §3.14 (six findings).
- `.env.local.example` — auth sections marked `[now]`; `AUTH_TRUSTED_ORIGINS`
  documented as the opt-in escape hatch for tunnel testing.

### Fixed — Phase 2

- **A self-promotion hole in the plan.** The roadmap's sketch declared `role`
  without `input: false`. Better Auth's default is that the client may set
  additional fields, so a sign-up body containing `{"role": "admin"}` would have
  been written verbatim — letting whoever reached the sign-up endpoint first
  claim the single seat *as an admin*. Now `input: false`, and such a request is
  rejected with `FIELD_NOT_ALLOWED`. (`03-auth-architecture.md` §3.13.1.)
- **`session.strategy: "jwt"` — copied from the reference repo — does not exist
  in better-auth 1.7.7** and did nothing. The reference implementation's comment
  about reducing database load by using JWT sessions describes behaviour it never
  had. Removed from the sketch with a note. (§3.14.1.)
- **`/api/auth/ok` returns `{"ok":true}`, not `{"status":"ok"}`** as the planning
  documents assumed. Measured through the real handler and corrected. (§3.14.4.)

### Verification — Phase 2

**59 checks pass** against a **live PostgreSQL 17**, exercised through the real
`lib/auth.ts` (not a stand-in): 51 behavioural checks plus 8 on the authorization
URL itself. Highlights:

- **21 open-redirect cases** — `https://evil.example`, `//evil.example`,
  `%2F%2Fevil.example`, `/\evil.example`, `javascript:`, smuggled `://`, and
  header-injection attempts all reduce to `/`; a legitimate `/blog/50%25off`
  survives intact (the sanitiser checks the decoded form but returns the
  original, so paths containing a literal `%` are not corrupted).
- **Loop guards** — `/sign-in`, `/sign-up` and `/api/auth/**` are refused as
  destinations, so the redirect cannot bounce.
- **The seat gate on a real database** — self-heals an empty database; three
  concurrent sign-ups admit **0** second users with no deadlock; `max_users`
  1 → 3 re-opens and `signup_enabled = false` closes regardless of free seats.
- **Session resolution through the Drizzle adapter** — a real signed cookie
  resolves to the user with `role` present, proving the hand-written schema's
  camelCase→snake_case mapping is correct at runtime.
- **Forged-cookie rejection** — an unsigned token and a wrongly-signed token both
  resolve to `null`.
- **Config failures are loud** — half-configured GitHub, a short
  `BETTER_AUTH_SECRET`, and missing required variables each throw with an
  actionable message.
- **The sign-in URL is right** — with credentials present, the authorization URL
  goes to `github.com/login/oauth/authorize` with `client_id` set,
  `redirect_uri` exactly `http://localhost:3000/api/auth/callback/github`, a
  32-character URL-safe state, and the minimal scope `read:user user:email` (no
  repository access). The destination is **not** readable in that URL — it lives
  in the signed state, so the provider never sees where the reader is going.
- **A callback with no state is refused** — `302 →
  /api/auth/error?error=state_not_found`, confirming the CSRF check is live.

### Added — Phase 1 (database foundation)

- `drizzle.config.ts` — reads `.env.local` directly (Next.js does not expose env
  to standalone tooling) and refuses to load without `DATABASE_URL`, with a
  message naming the file to create and the doc to read. It also warns when the
  URI is a Supabase **direct** connection (port 5432) instead of the transaction
  pooler (6543).
- `lib/db/schema.ts` — the four Better Auth core tables plus `site_settings`.
  Verified field-by-field against `getAuthTables()` in the installed
  `better-auth@1.7.7`: all 35 fields Better Auth reads or writes are present, and
  every extra column is nullable or defaulted.
- `lib/db/index.ts` — `postgres.js` client tuned for the free-tier Supabase
  pooler (`prepare: false`, `max: 1`, `idle_timeout: 20`, `connect_timeout: 10`),
  with an explicit `DATABASE_URL` check instead of a non-null assertion.
- `drizzle/0000_init.sql` + `drizzle/meta/` — the migration, committed so a fresh
  clone needs only `pnpm db:migrate`.
- `docs/database-setup.md` — project creation, the pooler URI, `db:*` commands,
  the schema contract, the seat-gate SQL, free-tier keep-alive, reset SQL, a
  troubleshooting table, and a local-Postgres alternative.

### Changed — Phase 1

- `docs/planning/03-auth-architecture.md` — new §3.13 recording what the
  implementation revealed, including one security-relevant correction: `role`
  must be declared `input: false` in Phase 2, or a client can put
  `{"role": "admin"}` in the sign-up body and self-promote into the single seat.

### Verification — Phase 1

Against a **live PostgreSQL 17**, not just a type check:

- `pnpm db:migrate` applies `0000_init.sql` cleanly; the resulting database has
  all 5 tables, 40 columns, 5 indexes, 3 unique constraints and 2 cascading
  foreign keys exactly as declared.
- 14 functional checks pass, including: the seat gate's
  `INSERT … ON CONFLICT DO NOTHING` → `SELECT … FOR UPDATE` → count transaction
  reads open on a fresh database; **three concurrent gate checks admit zero
  second users** with no deadlock; raising `max_users` 1 → 3 re-opens
  registration; `signup_enabled = false` closes it regardless of free seats;
  deleting a user cascades to `session` and `account`; and `timestamptz` columns
  round-trip as `Date` objects.
- `DATABASE_URL` is unreachable from all 86 client components, and carries no
  `NEXT_PUBLIC_` prefix.

### Added — Phase 0 (prep & guardrails)

- `typecheck` script (`tsc --noEmit`). Next.js 16 no longer type checks during
  `next build`, so this is now the gate that catches type regressions.
- `.github/workflows/ci.yml` — runs `lint`, `typecheck` and `build` on every push
  and pull request. With the site not yet deployed, CI is the second half of
  verification; the build step uses placeholder env values because the Notion CMS
  degrades to an empty listing when no token is present.
- `.env.local.example` — documented template listing every variable the project
  reads (site, Notion, comments/Turnstile, contact, and the upcoming database /
  Better Auth / GitHub OAuth values), with `[now]` / `[v2.9.0]` / `[deploy]`
  status markers.
- `docs/planning/` — the v2.9.0 plan pack (audit, roadmap, auth architecture,
  backlog notes, docs plan).
- `CHANGELOG.md`.
- `.gitignore` — `.env.local.example` is now explicitly un-ignored, since the
  template is meant to be committed.

### Changed — Phase 0

- `next.config.mjs` — `typescript.ignoreBuildErrors` is now `false`: type errors
  fail the build instead of shipping silently.
- `lib/config.ts` — the displayed `revision` is derived from `package.json`
  instead of a hand-maintained literal (the sidebar had drifted to `v2.7.5`
  while `package.json` said `2.8.0`).
- `hooks/use-controlled-state.tsx` and
  `components/animate-ui/primitives/effects/highlight.tsx` — prop→state syncing
  moved from `useEffect` to React's documented render-phase
  "adjusting state when a prop changes" pattern, which is what
  `react-hooks/set-state-in-effect` asks for and avoids a second paint.
- `components/custom-context-menu.tsx` — internal navigation now uses
  `useRouter().push()` instead of `window.location.href` (the pattern that made
  redirect-back unreliable in the reference implementation), and the
  unused imports left over from earlier edits are gone.
- `components/notion/ContentIndexPage.tsx` — removed an unused prop from
  `SourceMessage`.

### Fixed — Phase 0

- Two type errors that only became visible once build-time type checking was
  enforced: the vendored `animate-ui` primitives (`effects/highlight.tsx`,
  `animate/slot.tsx`) render a polymorphic tag whose type stayed an unresolved
  generic. `@react-three/fiber`'s global JSX augmentation also collapses the
  `React.ElementType` union, so the dynamic tag is now pinned to an explicit
  `ComponentType<Record<string, unknown>>` (`DynamicTag`). Type-only change, no
  runtime difference.
- 12 pre-existing ESLint warnings (unused imports/variables, a stale
  `eslint-disable` directive, an internal-navigation warning) — `pnpm lint` is
  now clean.

### Removed — Phase 0

- **PostHog**, entirely: the `posthog-js` dependency, the three `/ingest/*`
  rewrites in `next.config.mjs`, and the `*.posthog.com` entries in the
  `script-src`, `img-src` and `connect-src` CSP directives. No analytics vendor
  replaces it. (The CSP entries were also an exfiltration path for any injected
  script; `'unsafe-eval'`/`'wasm-unsafe-eval'` were kept — they are needed by
  Turnstile.)

### Verification

- `pnpm lint` — clean (0 errors, 0 warnings).
- `pnpm typecheck` — clean, including from a fresh clone with no `.next` or
  `next-env.d.ts` present.
- `pnpm build` — **not yet verified locally**: the development sandbox has
  ~1.9 GB RAM and Turbopack's production build was OOM-killed. The CI workflow
  runs the build on a standard runner; treat a green CI run as the build gate for
  this phase.
