# PM-Web_V2 — v2.9.0 Planning Pack

> **Status:** plan only. No feature code was written. This pack is the output of the
> audit requested in item 9 — *"before we implement any of these, I want your
> suggestions and improvements and also a Path."*
>
> **Release target:** `v2.9.0` (confirmed).
>
> **Scope agreed for this round:** auth pages only (`/sign-in`, `/sign-up`,
> `/not-authorized`, `/dashboard`, `/admin`) + a `/tools` "coming soon" stub,
> **GitHub-only** OAuth, **Supabase** free-tier Postgres, **localhost-only** (this
> repo is not deployed yet), **no analytics vendor**.
>
> **Sources used:** `prasad-kmd/PM-Web_V2` (v2.8.0), `prasad-kmd/PMEngineerLK-NextJS`
> (reference implementation), the React Bits Free + Pro library archive (Ultimate
> tier), and the 42 skills in `.agents/skills`.

| # | Document | Read it when |
| - | -------- | ------------ |
| 0 | **README.md** (this file) | Always first — decisions + phase map |
| 1 | [`01-audit-and-suggestions.md`](./01-audit-and-suggestions.md) | You want the findings, ranked fixes and what to change vs. the reference repo |
| 2 | [`02-implementation-roadmap.md`](./02-implementation-roadmap.md) | **The Path** — 8 phases, one session each, with files, commands and acceptance criteria |
| 3 | [`03-auth-architecture.md`](./03-auth-architecture.md) | You're implementing (or reviewing) the auth system — schema, flows, redirect-back algorithm, seat gate, comments bridge |
| 4 | [`04-future-features-notes.md`](./04-future-features-notes.md) | Page-view counter + Invoice Generator backlog (item 7) |
| 5 | [`05-docs-and-governance-plan.md`](./05-docs-and-governance-plan.md) | README/CoC/CONTRIBUTING/SECURITY/ACCESSIBILITY + `/docs/` plan (item 8) |

> **Revision 2** (this update) folds in your answers: localhost-only deployment,
> layout decision made, comments behaviour pinned to option (b), `/tools` is coming
> soon, PostHog removal added to Phase 0.

---

## TL;DR — the five things that matter

1. **The database is already half-installed.** `better-auth`, `drizzle-orm`,
   `drizzle-kit` and `postgres` are in `package.json`, and the
   `db:generate / db:migrate / db:studio` scripts exist — but there is **no
   `drizzle.config.ts`, no `lib/db/`, no `lib/auth.ts` and no `proxy.ts`**. Phase 1–2
   is therefore mostly *activating* what is already paid for, not adding new deps.
2. **Redirect-back failed in the reference repo for a specific, fixable reason** —
   not a framework limitation. Global entry points (the navbar user button, the
   `UserMenu`, `requireAdmin()`'s `referer` guess) never carried a `callbackUrl`,
   and the sign-in page had no "you're already signed in" guard. §3.3 of the
   architecture doc gives the full algorithm; Phase 3 lists the exact manual test
   (sign in from `/about` → land back on `/about`).
3. **"One person can register, then registration closes" is a design decision, not
   a hack.** It becomes a `site_settings` singleton row (`max_users = 1`) plus a
   `databaseHooks.user.create.before` gate in a transaction with `SELECT … FOR
   UPDATE`, so two racing OAuth callbacks can never both take the last seat.
   Existing users can *always* sign in — the gate only blocks **creation**.
   Raising the limit is one `UPDATE`.
4. **Use database sessions + a 5-minute cookie cache, not `strategy: "jwt"`.**
   The reference repo's JWT sessions made role/limit changes in the DB lag up to an
   hour — directly hostile to your workflow of editing `role` by hand. At one user,
   the "saved" DB lookups are not worth that cost.
5. **React Bits Pro does the heavy UI lifting.** `blocks/auth/auth-2` (**chosen**)
   is the sign-in layout, a `waitlist`/`empty-state` block becomes the "registration
   closed" state, `blocks/404/404-3` fits `/not-authorized`, and
   `app-ui/dashboard-1` + `app-ui/data-table-*` + `app-ui/settings-form-*` cover the
   dashboard and admin surface. All Pro blocks need a **compliance pass** (fake
   `console.log` handlers removed, `<a>` → `<Link>`, `<img>` → `<Image>`, RULES.md
   a11y, reduced-motion support) — budgeted inside each phase.

---

## Decisions taken (all confirmed)

| Question | Decision | Consequence |
| -------- | -------- | ----------- |
| Deployment target | **Localhost only** — this repo isn't deployed; `prasadm.vercel.app` belongs to the old site and is **not** used | `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000`; GitHub OAuth app registers the localhost callback; production URL, custom domains and preview-deployment policy are deferred to `docs/deployment.md` and revisited when you deploy |
| OAuth providers | **GitHub only** | No consent-screen review, instant setup, avatars already allowed by your CSP (`avatars.githubusercontent.com`). Google/Discord remain env-gated non-goals |
| Database | **Supabase free tier** (Postgres) | Reuses your existing knowledge. **Transaction pooler on port 6543**, `prepare: false` |
| Sign-in layout | **`reactbits-pro` `blocks/auth/auth-2`** — split layout: branded panel left, OAuth column right (my call, per your answer) | Unsplash placeholder image replaced with site assets/React Bits backdrop; Apple/Google buttons, email+password form and demo handlers removed; restyled to ink/wisteria tokens. `auth-3` (centered card) kept as the documented fallback if the split feels heavy at the review step |
| Comments (signed-in) | **Option (b)** — prefill identity **and** mark as owner/verified | Format tag extended to `PMc2` with a server-set `role` segment; comments posted by the admin render an **Owner** badge; guests unchanged (see doc 03 §3.10) |
| `/tools` | **Coming soon** | Phase 3 ships a real-but-honest "Tools — coming soon" page so the 4 dead nav links resolve; `noindex` until tools genuinely exist (see doc 02 → Phase 3) |
| Analytics | **No PostHog** — not needed for this repo | Phase 0 removes: `posthog-js` dependency, the `/ingest/*` rewrites, and the three `*.posthog.com` CSP entries. Nothing else in the code imports it, so this is a clean delete. No replacement vendor is added |
| Pages (new) | `/sign-in`, `/sign-up`, `/not-authorized`, `/dashboard`, `/admin`, `/tools` (stub) + user menu in the 3 nav surfaces | Everything else stays on the backlog |
| Version | **v2.9.0** | Bumped in Phases 5–6; tag once the manual test matrix and docs are complete |

---

## The Path at a glance

One phase = one focused session = one reviewable commit/PR. Stop after any phase and
the site still builds and runs locally.

| Phase | Name | Depends on | Sessions | Produces | Risk |
| ----- | ---- | ---------- | -------- | -------- | ---- |
| **0** | Prep & guardrails | — | 0.5 | Clean branch, PostHog removed, `.env.local.example`, typecheck script, `ignoreBuildErrors: false` fallout fixed | Low |
| **1** | Database foundation | 0 | 0.5 | `drizzle.config.ts`, `lib/db/*`, `site_settings` table, first migration applied to Supabase | Low |
| **2** | Auth core | 1 | 1 | `lib/auth.ts`, auth route handler, GitHub OAuth live on localhost, registration gate proven | Med |
| **3** | Pages & redirect-back | 2 | 1 | `proxy.ts`, 5 auth pages + `/tools` stub, `components/auth/*`, nav integration, item-4 test passing | Med |
| **4** | Admin surface | 3 | 1 | `/admin` users table + `/admin/settings` (`max_users` control) | Low |
| **5** | Enhancements & polish | 3 | 1 | Comments owner badge, a11y/motion pass, sitemap/robots exclusions, `/docs` auth guides | Low |
| **6** | Governance docs (item 8) | any | 0.5 | README + CoC + CONTRIBUTING + SECURITY + ACCESSIBILITY + `/docs/*` | None |
| **7** | *(optional)* 2FA / TOTP | 3 | 1 | `twoFactor` plugin + enrollment page | Med |
| **B** | *(backlog)* Page views, Invoice generator | 3–4 | n×1 | See doc 04 | — |

```
0 ─▶ 1 ─▶ 2 ─▶ 3 ─┬─▶ 4 ─┐
                  ├─▶ 5 ─┤─▶ B (backlog: page views, invoices)
                  └─▶ 7 ─┘
        6 (docs) can run at any time; 5 needs 3; 4 needs 2.
```

---

## Deferred to deployment time (not blockers)

These are intentionally **not** part of v2.9.0 because the site runs locally only.
`docs/deployment.md` (Phase 6) will carry the exact checklist so nothing is
rediscovered later:

1. Vercel project + production env vars (`BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`,
   `DATABASE_URL`, `BETTER_AUTH_SECRET`, GitHub id/secret).
2. Add the production callback to the GitHub OAuth app
   (`https://<domain>/api/auth/callback/github`) alongside the localhost one.
3. `trustedOrigins` — add the production origin (and any preview-domain policy you
   decide on) at that point; until then it stays `http://localhost:3000`.
4. Supabase free-tier **inactivity pause** keep-alive, once there's a deployed URL
   worth pinging.
5. Decide the public origin baked into metadata (`metadataBase` currently defaults
   to `prasadm.vercel.app`, which is the *old* site — set `NEXT_PUBLIC_SITE_URL`
   locally now and revisit for production).

**One tiny local caveat to accept:** with `BETTER_AUTH_URL=http://localhost:3000`,
GitHub sign-in works on localhost only. Testing from a phone on your LAN (e.g.
`http://192.168.x.x:3000`) needs a `trustedOrigins` entry plus matching OAuth
callback — not worth doing per-device; use desktop or a tunnel when you need it.

---

## Working agreement used by these docs

- One phase per session; commit per phase; review before merging (no remote
  deployment yet — verify with `pnpm dev` locally).
- Every phase ends with: `pnpm lint`, `pnpm typecheck`, `pnpm build` clean, manual
  checklist signed off, docs updated in the same commit.
- Failure = revert the phase commit; no phase leaves the site in a broken state.
- Skills are **loaded per phase** (mapping table in doc 02, §"Skills map") — e.g.
  Phase 1 loads `supabase-postgres-best-practices` + `drizzle-skills`, Phase 2 loads
  `create-auth` + `better-auth-best-practices` + `better-auth-security-best-practices`,
  Phase 3 loads `frontend-ui-engineering` + `coss` + `design-taste-frontend`.
