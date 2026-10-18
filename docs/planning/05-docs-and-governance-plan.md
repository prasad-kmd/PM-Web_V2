# 05 — Docs & Governance Plan (item 8)

The exact contents of the five root documents plus the `/docs/` set, so Phase 6 is
a copy-paste-and-edit session instead of a blank-page one.

> **Preview note:** shields.io badges and other remote images won't render in the
> in-app Markdown preview (no network in the sandbox) — they render normally on
> GitHub. Everything else in these files is self-contained.

---

## 0. Root documents at a glance

| File | Purpose | Target length | Written in |
| ---- | ------- | ------------- | ---------- |
| `README.md` | What this is, what's inside, how to run it, where the docs live | 200–300 lines | Phase 6 |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1 + enforcement contact | ~120 lines | Phase 6 |
| `CONTRIBUTING.md` | Dev setup, conventions, PR flow | ~120 lines | Phase 6 |
| `SECURITY.md` | Supported versions, private reporting, scope, disclosure timeline | ~80 lines | Phase 6 |
| `ACCESSIBILITY.md` | WCAG 2.2 AA commitment, known limits, how to report a barrier | ~90 lines | Phase 6 |
| `CHANGELOG.md` | One entry per phase, Keep-a-Changelog format | starts Phase 0 | Phase 0 onward |
| `LICENSE` | AGPL-3.0 (already declared in `package.json`) | — | verify presence |

Plus the `/docs/` set (§3) and GitHub repository settings (§4).

---

## 1. `README.md` — full outline

### 1.1 Badge block (copy-paste starting point)

```markdown
<p align="center">
  <img src="public/img/logo.svg" alt="PrasadM" width="96" height="96" />
</p>

<h1 align="center">PM-Web_V2</h1>

<p align="center">
  <em>Working archive of a mechanical + mechatronics engineer — robot builds,
  mechanism drawings, firmware notes, tutorials and field lessons.</em>
</p>

<p align="center">
  <a href="https://github.com/prasad-kmd/PM-Web_V2/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/prasad-kmd/PM-Web_V2?style=flat-square&logo=github&color=blue"></a>
  <a href="https://github.com/prasad-kmd/PM-Web_V2/forks"><img alt="GitHub forks" src="https://img.shields.io/github/forks/prasad-kmd/PM-Web_V2?style=flat-square&logo=github"></a>
  <a href="https://github.com/prasad-kmd/PM-Web_V2/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/prasad-kmd/PM-Web_V2?style=flat-square&logo=github"></a>
  <a href="https://github.com/prasad-kmd/PM-Web_V2/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/prasad-kmd/PM-Web_V2?style=flat-square&logo=git&logoColor=white"></a>
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square&logo=gnu&logoColor=white"></a>
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white">
</p>

<p align="center">
  <img alt="Better Auth" src="https://img.shields.io/badge/auth-Better_Auth-6C47FF?style=flat-square">
  <img alt="Drizzle ORM" src="https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat-square&logoColor=black">
  <img alt="Supabase" src="https://img.shields.io/badge/Postgres-Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt="Notion CMS" src="https://img.shields.io/badge/CMS-Notion-000000?style=flat-square&logo=notion&logoColor=white">
  <img alt="GitHub Actions CI" src="https://img.shields.io/badge/CI-lint_%2B_typecheck_%2B_build-2088FF?style=flat-square&logo=githubactions&logoColor=white">
  <img alt="WCAG 2.2 AA" src="https://img.shields.io/badge/a11y-WCAG_2.2_AA-005A9C?style=flat-square&logo=w3c&logoColor=white">
</p>
```

> **Deployment badge:** deliberately worded **"Vercel ready"** rather than "deployed
> on Vercel" — this repo is local-only today. Swap it to the plain Vercel badge (and
> add the live-site link) the moment you deploy, so the README never claims more than
> reality.

Notes: `simple-icons`-backed badges (`logo=` parameters) are the "icons" ask;
keep the palette restrained (neutral + one blue/indigo accent) so the README reads
as a system, not a christmas tree. Add a `PRs welcome` badge only if you actually
want external PRs (see `CONTRIBUTING.md`).

### 1.2 Sections

1. **Hero** — one paragraph from `siteConfig.description` (single source of truth), plus 2–3 real screenshots or short screen-recordings. Reference them from `public/img/readme/` so they render on GitHub; capture light **and** dark once, and show one accent variant.
2. **What's inside** — a small table: Articles · Blog · Tutorials · Projects · Glossary · Portfolio · Bookmarks · Tools *(coming)*.
3. **Tech stack** — table with the *why* column (one line each): Next.js 16 App Router (Turbopack, proxy.ts), React 19 + React Compiler, Tailwind CSS 4, Base UI / coss primitives, Motion + GSAP, Notion CMS, better-auth + Drizzle + Supabase, React Bits (Free + Pro), Cloudflare Turnstile. **No analytics vendor** — PostHog was removed in v2.9.0 and nothing replaced it; say that explicitly so nobody wonders where the analytics badge went.
4. **Quickstart** — `pnpm install` → copy `.env.local.example` → `pnpm dev`; note **Node 20+** and pnpm 11.
5. **Environment variables** — table *names + purpose only* pointing at `/docs/env-variables.md`; never paste values.
6. **Database & auth setup** — two lines each, linking `/docs/database-setup.md` and `/docs/auth-setup.md`.
7. **Project structure** — annotated tree of `app/`, `components/`, `lib/`, `docs/` (8–10 lines, not the whole repo).
8. **Quality gates** — `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus the RULES.md promise (zero ESLint warnings, zero CodeQL alerts).
9. **Roadmap** — link to `docs/planning/02-implementation-roadmap.md` + the phase table.
10. **Accessibility** — 2 lines → `ACCESSIBILITY.md`.
11. **Contributing & security** — 1 line each → `CONTRIBUTING.md`, `SECURITY.md`.
12. **Credits & licence** — React Bits (Free + Pro, used under a one-developer licence), Notion API, Cloudflare Turnstile; AGPL-3.0 with a link to `LICENSE`.

---

## 2. The other four root documents

### 2.1 `CODE_OF_CONDUCT.md`

- **Contributor Covenant v2.1**, verbatim, as the standard.
- Adapt: enforcement contact = your public email (`hello@prasadk.xyz` per `lib/config.ts`); scope (issues, PRs, discussions, any project space); enforcement ladder (correction → warning → temporary ban → permanent ban) as the Covenant defines it.
- Add a short "This is a personal engineering archive" preamble: contributions are welcome, but curatorial decisions on content remain the author's.
- Enforcement reports are handled privately; note the alternative channel (GitHub private report) for people who don't want to email.

### 2.2 `CONTRIBUTING.md`

- **Before you start:** read `README.md` + `RULES.md`; open an issue for anything larger than a typo.
- **Dev setup:** pnpm 11, Node 20+, `.env.local.example` → `.env.local`, `pnpm dev`; note that a DB is **not** required for content pages (Notion-driven) — only auth work needs one.
- **Commands:** `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `db:generate`, `db:migrate`, `db:studio` — in one table.
- **Branch & commit conventions:** `feat/… · fix/… · docs/… · chore/…`; Conventional Commits (`feat(scope): …`) since the CHANGELOG is generated from them.
- **Code style:** Prettier is authoritative (`.prettierrc`); ESLint flat config; TypeScript strict-**er** than today — no `any`, no `@ts-ignore`, no `console.log`.
- **PR checklist:** lint + typecheck + build pass (the Phase 0 GitHub Actions workflow enforces all three); screenshots for UI changes; docs updated in the same PR; accessibility considered (keyboard pass); no new secrets or third-party keys.
- **Running the site:** `pnpm dev` locally only — there is no deployed instance at v2.9.0, so a change is "verified" by the local checklist plus CI, not by a preview URL.
- **What not to send:** drive-by redesigns, dependency bumps without a reason, generated files, commented-out code.
- **Where to ask:** Discussions for questions, Issues for bugs, SECURITY.md for vulnerabilities (never a public issue).

### 2.3 `SECURITY.md`

- **Supported versions:** `2.9.x` ✅ · `< 2.9` ❌ (personal project — only the deployed revision is patched).
- **Reporting:** GitHub **Private vulnerability reporting** (enable it in repo settings) *and* email `hello@prasadk.xyz`; never a public issue; include repro steps, impact, and a suggested fix if you have one.
- **Response targets:** acknowledgement ≤ 72 h, assessment ≤ 7 days, fix timeline depending on severity (documented, best-effort — say so honestly).
- **Scope:** the deployed site, auth flows (session handling, OAuth callback handling, open-redirect via `callbackUrl`, seat-gate bypass), the comments API, and anything that leaks credentials.
- **Out of scope:** missing best-practice headers on unchanged third-party embeds, rate-limit observations at these volumes (documented as F10), self-XSS, and reports requiring a compromised GitHub account.
- **Secrets:** none in the repo; `.env*` ignored (with `!.env.local.example` allowed); `BETTER_AUTH_SECRET` and the Supabase database password are rotated in `.env.local` — and in the hosting environment once deployed — if ever exposed.
- **Deployment status (honest framing):** the site runs **locally only** at v2.9.0; there is no public instance to attack yet. State this plainly so researchers know the current attack surface is the repository itself (dependencies, committed files) plus local setups.
- **Disclosure:** credit by name unless asked otherwise.

### 2.4 `ACCESSIBILITY.md`

- **Commitment:** WCAG **2.2 AA** as the target for all reader-facing pages, including the new auth pages.
- **What already exists:** the accessibility panel (`components/accessibility/`), reader metrics, accent/contrast controls, reduced-motion handling, semantic landmarks; link `/accessibility` as the live statement page.
- **Known limitations (be specific and honest):** 3D/canvas backgrounds degrade (they respect reduced motion but are decorative only), some Notion-embedded media depends on third parties, and — until Phase 5 — the auth pages have not had a full audit.
- **How to report a barrier:** email with the page URL, assistive tech + browser, and what happened. Ack in ≤ 72 h; state the intent to fix or document.
- **How the project verifies it:** keyboard-only pass on every new page, screen-reader spot checks, contrast checks against both themes, `prefers-reduced-motion` respected, no motion-only affordances. (This is the same list RULES.md §7 encodes — cross-reference it.)

---

## 3. `/docs/` inventory

| File | Contents | Written in |
| ---- | -------- | ---------- |
| `docs/README.md` | Index: one line per doc + "which one do I need?" routing table | Phase 6 |
| `docs/database-setup.md` | Supabase project creation → pooler URI (6543) → `DATABASE_URL` → `BETTER_AUTH_SECRET` → `pnpm db:generate/migrate/studio` → reset SQL → free-tier **inactivity-pause keep-alive** → connection troubleshooting | Phase 1 |
| `docs/auth-setup.md` | GitHub OAuth app creation (exact callback URLs for dev + prod) → env vars → how sessions work (5-min cache, why not JWT) → the redirect-back algorithm → the seat gate + SQL → error catalogue (`access_denied`, `REGISTRATION_CLOSED`, `state_mismatch`) | Phases 2–5 |
| `docs/env-variables.md` | Every variable: name, client/server, required?, where to get it, what breaks without it | Phase 5 |
| `docs/admin-guide.md` | Becoming admin (SQL) → `/admin` screens → seat-limit semantics → audit rows → emergency SQL → recovery procedures | Phases 4–5 |
| `docs/deployment.md` | **The day-you-deploy checklist** (nothing in v2.9.0 needs it — the site is local-only today): Vercel project settings, production env vars, adding the production OAuth callback next to the localhost one, `trustedOrigins` + `metadataBase` updates, preview-deployment policy, Supabase keep-alive cron | Phase 6 (content can be written now, executed later) |
| `docs/page-views.md` | *When built* — counter design, dedupe rules, where numbers are displayed | backlog |
| `docs/invoice-generator.md` | *When built* — schema, numbering, PDF endpoint, client/PII handling | backlog |
| *Existing* | `comments-system.md`, `comments.env.example`, `notion-cms-setup.md` — keep; add a "signed-in identity" section to the comments doc in Phase 5 | — |
| *This pack* | `docs/planning/*` — move to a release tag or keep as the roadmap of record | now |

Style rules for all docs: start with **who this is for** and **what you need**;
every command in a fenced block; copy-paste-able SQL; no screenshots of dashboards
that will rot (link instead); one canonical place per fact (link, don't repeat).

---

## 4. GitHub repository settings to match the docs

| Setting | Recommendation |
| ------- | -------------- |
| Private vulnerability reporting | **Enable** (referenced by `SECURITY.md`) |
| Branch protection on `main` | Require PR + the CI check (`lint`/`typecheck`/`build`) before merge |
| CodeQL / code scanning | Enable default setup to enforce the RULES.md §5 goals |
| Dependabot | Enable security updates + a monthly grouped version-bump PR (accept it only after lint/build pass) |
| Issue templates | `bug_report.yml`, `feature_request.yml`, plus a `config.yml` that routes security reports to SECURITY.md |
| PR template | Mirrors the CONTRIBUTING checklist |
| Topics & description | e.g. `nextjs`, `portfolio`, `notion-cms`, `better-auth`, `drizzle-orm`, `tailwindcss` |
| Discussions | On, if you want a public space for questions (otherwise omit the badge/links) |
| Social preview image | One 1280×640 card (reuse the OG style) so shared links look intentional |

---

## 5. Phase 6 execution order (so it's mechanical)

1. `README.md` badge block + hero (screenshots first — they take the longest).
2. README body sections 2–12.
3. `ACCESSIBILITY.md` (shortest, mostly links to existing features).
4. `SECURITY.md` → then flip the repo settings in §4.
5. `CONTRIBUTING.md`.
6. `CODE_OF_CONDUCT.md` (verbatim Covenant + your contact/scope preamble).
7. `/docs/README.md` index, then reconcile every `/docs/*` page written during Phases 1–5 against that index.
8. `CHANGELOG.md` — backfill one entry per phase already shipped, then keep it per-PR.
9. `docs/deployment.md` — write it **now** (it's local-only knowledge that decays):
   the deferred list from the planning README's "Deferred to deployment time" section,
   plus the OAuth/`trustedOrigins`/`metadataBase` steps and the Supabase keep-alive.
   Nothing in it is executed at v2.9.0 — it exists so deployment day is mechanical.
