<p align="center">
  <img src="public/svg/pm4.svg" alt="PrasadM" width="96" height="96" />
</p>

<h1 align="center">PM-Web_V2</h1>

<p align="center">
  <em>A working archive of a mechanical + mechatronics engineer — robot builds,
  mechanism drawings, firmware notes, tutorials and the lessons learned between
  the CAD viewport and the workbench.</em>
</p>

<p align="center">
  <a href="https://github.com/prasad-kmd/PM-Web_V2/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/prasad-kmd/PM-Web_V2?style=flat-square&logo=github&color=blue"></a>
  <a href="https://github.com/prasad-kmd/PM-Web_V2/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/prasad-kmd/PM-Web_V2?style=flat-square&logo=git&logoColor=white"></a>
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square&logo=gnu&logoColor=white"></a>
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="pnpm 11" src="https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white">
</p>

<p align="center">
  <img alt="Better Auth" src="https://img.shields.io/badge/auth-Better_Auth-6C47FF?style=flat-square">
  <img alt="Drizzle ORM" src="https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat-square">
  <img alt="Postgres" src="https://img.shields.io/badge/Postgres-Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt="Notion CMS" src="https://img.shields.io/badge/CMS-Notion-000000?style=flat-square&logo=notion&logoColor=white">
  <img alt="WCAG 2.2 AA" src="https://img.shields.io/badge/a11y-WCAG_2.2_AA-005A9C?style=flat-square&logo=w3c&logoColor=white">
</p>

<p align="center">
  <strong>Runs locally.</strong> There is no deployed instance — see
  <a href="#status">Status</a>.
</p>

---

## What this is

An engineering portfolio and long-form archive. Content lives in **Notion** and is
rendered through the Notion API, so writing happens in a tool built for writing
rather than in MDX. The site adds the things a Notion page cannot: a reading
experience, a searchable index, comments, and a small amount of sign-in.

The identity is a one-owner site. One GitHub account can register, and its role
is promoted to `admin` in the database when the owner wants the admin surface.
That is a deliberate design choice rather than a limitation — see
[docs/admin-guide.md](docs/admin-guide.md).

### What's inside

| Section | Route | Notes |
| ------- | ----- | ----- |
| Articles | `/articles` | Long-form, database-driven |
| Blog | `/blog` | Shorter entries |
| Tutorials | `/tutorials` | Step-by-step |
| Projects | `/projects` | Build write-ups |
| Glossary | `/glossary` | Terms, cross-linked |
| Portfolio | `/portfolio` | Curated index |
| Bookmarks | `/bookmarks` | Saved locally on the device |
| Tools | `/tools` | Coming soon |
| Dashboard | `/dashboard` | Signed-in readers |
| Admin | `/admin` | Seat limit, accounts, registration |

---

## Tech stack

| Layer | Choice | Why |
| ----- | ------ | --- |
| Framework | **Next.js 16** (App Router) | Server components do the reading; the client bundle stays small. Uses `proxy.ts` for the request gate — Next 16 removed `middleware.ts`. |
| UI | **React 19** | Server components, `useActionState`, and `ref` as a plain prop. |
| Styling | **Tailwind CSS 4** | CSS-first config; design tokens live in `app/globals.css` as `--pm-ink`, `--pm-ink-soft` and friends. |
| Primitives | **Base UI** + coss | Accessible dialogs, sheets, switches and selects. No wrapper library holding the focus management. |
| Motion | **Motion** + **GSAP** | Everything animated is gated on `prefers-reduced-motion`. |
| CMS | **Notion API** | The writing tool is the CMS. No MDX pipeline, no rebuild to publish. |
| Auth | **Better Auth** | Database sessions with a 5-minute signed cookie cache. GitHub is the only provider. |
| Database | **Postgres** (Supabase free tier) + **Drizzle** | The schema is hand-written in `lib/db/schema.ts` and is the source of truth. |
| Culture | **React Bits** (Free + Pro) | Blocks and primitives, restyled to the site's tokens rather than pasted in. |
| Spam | **Cloudflare Turnstile** | On the comment and contact forms. |

**No analytics vendor.** PostHog was removed in v2.9.0 and nothing replaced it —
the CSP carries no analytics host, and `package.json` carries no analytics
dependency. If you were looking for the analytics badge, its absence is the point.

---

## Quickstart

**Requirements:** Node **22.13 or newer** (pnpm 11 requires it), pnpm **11**.

```bash
git clone https://github.com/prasad-kmd/PM-Web_V2.git
cd PM-Web_V2

pnpm install
cp .env.local.example .env.local     # then fill it in
pnpm dev                             # http://localhost:3000
```

**You do not need a database to browse the site.** Content pages read from
Notion, and every non-auth page renders without one. You need Postgres only for
sign-in, `/dashboard` and `/admin` — and even then, only those three.

Required variables are `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters) and
`BETTER_AUTH_URL`. Everything else is optional and degrades to a disabled
feature rather than a broken page. The full list, with what breaks without each
one, is in **[docs/env-variables.md](docs/env-variables.md)**.

Never commit `.env.local`. The repository has never contained a secret, and the
`.gitignore` is written to keep it that way.

---

## Setup guides

Each guide is written to be followed once, in order, by someone who has not done
it before.

| Guide | Covers |
| ----- | ------ |
| **[docs/database-setup.md](docs/database-setup.md)** | Supabase project → pooled connection string → migrations → the free-tier inactivity pause |
| **[docs/auth-setup.md](docs/auth-setup.md)** | GitHub OAuth app → callback URLs → how sessions work → the seat gate |
| **[docs/admin-guide.md](docs/admin-guide.md)** | Becoming an administrator → the three admin screens → seat semantics → recovery SQL |
| **[docs/env-variables.md](docs/env-variables.md)** | Every variable, and what breaks without it |
| **[docs/notion-cms-setup.md](docs/notion-cms-setup.md)** | Notion integration, databases, statuses and property names |

Start at **[docs/README.md](docs/README.md)**, which routes you to the right one.

---

## Quality gates

```bash
pnpm lint         # eslint .
pnpm typecheck    # tsc --noEmit
pnpm build        # next build
```

All three run in CI on every push and pull request
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Next.js 16 no longer
lints or typechecks during `next build`, so these are separate gates and all
three are required.

The bar is **zero ESLint warnings and zero CodeQL alerts**, not "few". The rules
are written down in [`RULES.md`](RULES.md) — the short version is no `any`, no
`@ts-ignore`, no `dangerouslySetInnerHTML`, no `middleware.ts`, and no non-null
assertion without a comment explaining why it cannot be null.

### Verification

Behaviour is checked by head-less suites rather than by clicking around.

```bash
# Structure and config — no database needed
mkdir -p .verify && cp verification/*.mjs .verify/
node .verify/nav.test.mjs

# The auth rules, against a live PostgreSQL
DATABASE_URL=… node --experimental-strip-types --import ./.verify/loader-register.mjs \
     .verify/auth.test.mjs
```

The suites live outside the repository on purpose — anything inside it gets
linted. Each phase's archive in the roadmap links the suite that covers it.

---

## Project structure

```
app/                routes — content, auth, admin, API handlers, robots.txt, sitemap
components/
  ui/               Base UI + coss primitives
  notion/           the content renderer
  auth/             sign-in card, user menu, buttons
  admin/            admin surface
  comments/         comment panel, composer, feed
  react-bits/       React Bits blocks, restyled to the site's tokens
lib/
  auth/             session helpers, the callback sanitiser, the seat gate
  admin/            admin rules, reads and queries
  db/               Drizzle schema and client
  comments/         wire format, validation, rate limiting, avatars
  notion-cms.ts     the Notion client and content mapping
docs/               setup guides, admin guide, planning pack
RULES.md            the code rules, enforced by ESLint and CodeQL
```

---

## Roadmap

v2.9.0 is being built in phases, one per session, with review between. The plan,
the audit it came from, and the reasoning behind each phase are in
[`docs/planning/`](docs/planning/).

| Phase | | |
| ----- | --- | --- |
| 0 | ✅ | Prep, guardrails, CI |
| 1 | ✅ | Database foundation |
| 2 | ✅ | Auth core |
| 3 | ✅ | Pages and the redirect-back guarantee |
| 4 | ✅ | Admin surface |
| 5 | ✅ | Signed-in comments, robots.txt, docs |
| 6 | ✅ | These governance documents |
| 7 | | *(optional)* Two-factor authentication |

Per-phase detail, including what was deliberately **not** built and why, is in
[`CHANGELOG.md`](CHANGELOG.md).

---

## Status

**This repository is not deployed.** It runs on `localhost`. Everything is built
and verified locally, and there is no public instance to look at.

That has two consequences worth stating plainly rather than burying:

- **`prasadm.vercel.app` is not this site.** It belongs to a previous,
  inactive project. Nothing in this repository points at it — not metadata, not
  the RSS feed, not `robots.txt`, not the Content-Security-Policy.
- **`SECURITY.md` describes the attack surface as the repository itself**
  (dependencies, committed files) plus local setups, because that is what exists.

The day-you-deploy checklist — production env vars, the second OAuth callback,
`trustedOrigins`, the Supabase keep-alive — is written and waiting in
[docs/deployment.md](docs/deployment.md). It is deliberately unexecuted.

---

## Accessibility

WCAG **2.2 AA** is the target for every reader-facing page, including the auth
pages. The reader panel (`/accessibility`) adjusts text size, typeface, spacing
and contrast, and remembers the choice on the device. Reduced-motion preferences
are respected everywhere motion is used.

Known limitations, stated honestly, are in
**[ACCESSIBILITY.md](ACCESSIBILITY.md)** — including what has *not* been audited.

---

## Contributing and security

Contributions are welcome; see **[CONTRIBUTING.md](CONTRIBUTING.md)** for the
development setup, conventions and the pull-request checklist. The community
expectations are in **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)**.

**Do not open a public issue for a security problem.** Use GitHub's private
vulnerability reporting or email — details in **[SECURITY.md](SECURITY.md)**.

---

## Credits and licence

Built on the work of others, gratefully: **Notion** for the content API,
**Cloudflare Turnstile** for spam defence, **Better Auth** and **Drizzle** for
the auth and data layers, **Base UI** and **coss** for the interaction
primitives, and **React Bits** (Free + Pro, used under a one-developer licence)
for many of the blocks — restyled to this site's tokens rather than shipped as
found.

Licensed under the **GNU Affero General Public License v3.0** — see
[LICENSE](LICENSE). In short: use it, study it, change it, share it, but if you
run a modified version as a network service, publish your changes.

---

<p align="center">
  <sub>© Prasad M · Kandy, Sri Lanka</sub>
</p>
