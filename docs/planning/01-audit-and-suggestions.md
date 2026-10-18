# 01 — Audit & Suggestions

Findings from reading `PM-Web_V2@v2.8.0`, the reference implementation
(`PMEngineerLK-NextJS@v2.6.0`), the React Bits library and the 42 skills in
`.agents/skills`. Severity: **P0** = do before/inside v2.9.0 auth work ·
**P1** = do soon after · **P2** = nice to have.

---

## 1. Repo state snapshot

| Area | Reality today | Implication for v2.9.0 |
| ---- | ------------- | ---------------------- |
| Framework | Next **16.3.5**, React 19.2.8, Turbopack default, App Router | `middleware.ts` is gone — the RBAC gate **must** be `proxy.ts` (RULES.md §1.1) |
| Package manager | pnpm 11.9.0, `pnpm-workspace.yaml` present | Keep pnpm; no npm/yarn drift |
| Auth deps | `better-auth@1.7.7`, `drizzle-orm@0.45.4`, `drizzle-kit@0.31.11`, `postgres@3.4.9` **installed but unused** | Activation work, not new dependencies |
| DB scripts | `db:generate`, `db:migrate`, `db:studio` exist | Only `drizzle.config.ts` + schema are missing |
| Content layer | Notion CMS (`lib/notion-cms.ts`) for articles/blog/tutorials/projects/glossary | Unchanged by auth; page-view counters can key off the same slugs |
| Comments | Guest comments stored as **Notion comments** (`lib/comments/*`, `docs/comments-system.md`) — no DB, 8 protection layers, Turnstile | Auth must *extend*, not replace: anonymous commenting stays a feature |
| Bookmarks | Local via `ContentBookmarksProvider` | Optional later sync to `user.preferences` |
| Analytics | **PostHog remnants only** — `posthog-js` in `package.json`, `/ingest/*` rewrites and 3 CSP entries in `next.config.mjs`; **no code imports it** | Being removed in Phase 0 (you don't want it). Page-view counters therefore have no existing data source — see doc 04 |
| Route protection | **None.** No `proxy.ts`, no session code anywhere | Green field |
| Nav surfaces | 3 separate components each hard-code their own link lists (`FloatingNavbar`, `AppSidebar`, `MobileBottomNav`) + `FooterSection` | Entry-point integration happens in 4 places — plan for a shared nav config |
| Type safety | `next.config.mjs` sets `typescript.ignoreBuildErrors: true` | Type errors cannot fail a build today — fix in Phase 0 |
| Security headers | CSP + X-Frame-Options + Referrer-Policy + Permissions-Policy already in `next.config.mjs` | GitHub OAuth needs **no** CSP change: `img-src` already allows `avatars.githubusercontent.com` and `*.githubusercontent.com`, `connect-src` allows `'self'` |
| Accessibility | `AccessibilityContext`, `AccessibilityPanel`, `/accessibility` page, reader metrics | New auth UI must respect this system (reduced motion, contrast, reader prefs) |

---

## 2. Findings (bugs & inconsistencies found during the audit)

### F1 — `/tools` is a dead link in four places — **P0 (fixed in Phase 3)**
`FloatingNavbar.tsx:29`, `AppSidebar.tsx:55`, `MobileBottomNav.tsx:58`,
`FooterSection.tsx:23` all point at `/tools`, but `app/` has no `tools/`
segment. Every one of those is a 404 for visitors, and the mobile bottom nav
computes `active: pathname.startsWith("/tools")` for a page that can never load.
*Resolution:* the tools themselves are **coming soon**, so Phase 3 ships a
`/tools` "coming soon" page (React Bits `empty-state`/`waitlist` block, site
tokens, `noindex` until real tools exist). All four links then resolve and the
mobile `active` state starts working for free.

### F2 — Authentication/DB dependencies are dead weight — **P0 (resolved by v2.9.0)**
`better-auth`, `drizzle-orm`, `drizzle-kit`, `postgres` plus three `db:*`
scripts ship in every install while no code imports them. Nothing breaks today,
but the moment Phase 1 lands, `drizzle-kit generate` starts owning schema
history — so the first migration must be written *after* the auth tables and
`site_settings` are final (not before), or you get a messy history to clean.

### F3 — Three version numbers that disagree — **P1**
`package.json` → `2.8.0`; `lib/config.ts` → `revision: "v2.7.5"`;
`README.md` → untouched `create-next-app` boilerplate. Pick one source of truth
(recommend importing `version` from `package.json` into `siteConfig`) and let
doc 05's README rewrite consume the same value.

### F4 — `typescript.ignoreBuildErrors: true` — **P0**
`next.config.mjs` opts out of type checking during `next build`, and Next 16 no
longer lints during build either. Nothing currently fails on a type error.
For an auth feature (sessions, `searchParams`, Drizzle inferred types) that is
the wrong default. Flip to `false` in Phase 0, add `"typecheck": "tsc --noEmit"`,
and fix whatever surfaces while the diff is still small. Keep `eslint .` in the
same pipeline.

### F5 — No `proxy.ts` — **P0 (resolved by v2.9.0)**
Everything about route protection has to be built. Per RULES.md this is
`proxy.ts` + exported `proxy()` — **never** `middleware.ts`. Design in doc 03 §3.4.

### F6 — Session strategy in the reference repo fights your own workflow — **P0**
`PMEngineerLK-NextJS/lib/auth.ts` sets `session.strategy: "jwt"` with a 1-hour
`cookieCache`. You promote yourself by editing `role` in the DB — with a JWT
session that change can take **up to an hour** to be visible, and sessions can't
be revoked centrally. Doc 03 §3.2 recommends database sessions with a 5-minute
cache and a cache-bypass specifically on `/admin*` gating.

### F7 — Nothing prevents registration in the reference repo — **P0**
There is no user-count gate there: any GitHub account that hits the OAuth flow
becomes a user. Item 5 wants the opposite. Doc 03 §3.5 specifies the seat gate.

### F8 — `requireAdmin()` derives `callbackUrl` from the `Referer` header — **P1**
`lib/auth-utils.ts` in the reference repo reads `referer` to guess where the user
came from. Referers are often absent (privacy settings, `no-referrer` policies,
server-side renders) — so the redirect silently degrades to `/`. Callers must
pass the path explicitly; keep `referer` only as a last-resort fallback.

### F9 — Auth entry points lose the current page — **P0 (the item-4 bug)**
In the reference repo the global user menu does
`window.location.href = "/sign-in"` with **no** `callbackUrl`, while protected
routes *do* pass one. Result: signing in from anywhere except a protected route
always lands on `/dashboard`. Doc 03 §3.3 replaces "every caller must remember"
with a `<SignInButton>` that cannot forget, plus a guard on the sign-in page.

### F10 — In-memory rate limits on serverless — **P2**
`better-auth`'s default rate limiter is in-memory: each serverless instance has
its own window. That's acceptable here (1–5 accounts, GitHub OAuth already
rate-limits its side), but it must be a *conscious* choice, documented, not an
assumption. If you ever expose an unauthenticated write endpoint, revisit
(`rateLimit.storage: "database"` or Upstash).

### F11 — CSP is ready for GitHub, not for later providers — **P2**
No change needed now. If Discord is added later, `cdn.discordapp.com` must be
added to `img-src`; Google avatars (`lh3.googleusercontent.com`) are already
allowed.

### F12 — PostHog remnants with no consumer — **P0 (removed in Phase 0)**
Three places carry PostHog wiring while **zero files import `posthog-js`**:
`package.json:53` (dependency), `next.config.mjs:29-40` (the `/ingest/static/*`,
`/ingest/:path*` and `/ingest/decide` rewrites plus the `NEXT_PUBLIC_POSTHOG_HOST`
lookup), and three CSP directives (`script-src`, `img-src`, `connect-src` each list
`https://*.posthog.com`). Dead proxy routes and dead CSP allowances widen the
attack surface for nothing — and the `script-src`/`connect-src` entries would let
any injected script exfiltrate to PostHog. Removal is a clean delete:
`pnpm remove posthog-js`, drop the `async rewrites()` block, drop the three CSP
tokens. Nothing else depends on them (verify with `grep -rn "ingest" app components lib`).

---

## 3. Suggestions, ranked

### P0 — inside the auth work (already folded into doc 02)

| # | Suggestion | Why |
| - | ---------- | --- |
| 1 | **Remove PostHog**: dependency, `/ingest` rewrites, CSP tokens (Phase 0) | F12 — dead weight, and the CSP allowances are a real exfiltration path |
| 2 | Flip `ignoreBuildErrors` to `false` + add `typecheck` script (Phase 0) | Auth code is exactly where type errors hide; keep the diff small while you can |
| 3 | Create `.env.local.example` with every new variable documented (Phase 0) | You rotate machines/UIs; setup docs are useless if the template lies |
| 4 | Build `<SignInButton>` as the *only* sanctioned entry point (Phase 3) | Structurally prevents F9 from ever recurring |
| 5 | Sanitize `callbackUrl` on **every** hop (proxy, page, client) — doc 03 §3.3.2 | Open-redirect (`js/unvalidated-url-redirection`) is in your RULES.md §5.9 and CodeQL default suite |
| 6 | Gate registration in a DB transaction with `FOR UPDATE` (Phase 2) | Two racing callbacks on the free tier must not both win the last seat |
| 7 | Set the `owner` flag for comments **server-side from the session only** (Phase 5, doc 03 §3.10) | A client-supplied flag would let anyone mint an "Owner" badge — RULES.md §5.6 mindset |
| 8 | `/tools` coming-soon page (Phase 3) | Fixes 4 broken links; matches your "coming soon" plan |
| 9 | `robots: { index: false }` + sitemap exclusion for `/sign-in`, `/sign-up`, `/dashboard`, `/admin`, `/tools` (Phase 3) | Auth/private/thin pages shouldn't be indexed |
| 10 | Keep the guest comment path intact; layer session identity on top (Phase 5) | Your comments system is a public feature; auth must not become a gate for readers |

### P1 — right after auth (a later session, low effort)

| # | Suggestion | Why |
| - | ---------- | --- |
| 11 | Single source of truth for nav items (`lib/nav.ts`) | 3 nav components × their own lists will drift the moment auth adds an entry |
| 12 | Version single-sourcing (F3) + rewrite README (doc 05) | Stops the "what version am I looking at" confusion |
| 13 | Add `CHANGELOG.md` and start using it per phase | Each phase is a clean, documented unit |
| 14 | Add a `/sign-in?error=…` mapping table (denied, closed, state-expired) | OAuth errors are opaque; users must see a sentence, not a code |
| 15 | CI check `pnpm lint && pnpm typecheck && pnpm build` on PRs — **GitHub Actions now**, Vercel when deployed | Next 16 doesn't lint or typecheck during build anymore; and since the site runs locally only, CI is the safety net until deployment |

### P2 — quality-of-life / later

| # | Suggestion | Why |
| - | ---------- | --- |
| 16 | Optional bookmark sync to `user.preferences` (JSONB) behind a flag | Reference repo had it; useful only once you have more than one device + account |
| 17 | `system_logs`-style audit trail for admin actions (settings changes, role edits) | You already hand-edit the DB; an audit row makes admin UI safe to adopt |
| 18 | Keyboard/focus pass on auth pages (`autoFocus` avoided, `aria-live` for errors) | RULES.md §7; OAuth buttons are the whole interaction — must be flawless |
| 19 | Consider `admin()` better-auth plugin for Phase 4's users table | Maintained `listUsers`/`setRole`/`banUser` endpoints instead of hand-rolled actions |
| 20 | Keep `@marsidev/react-turnstile` as the pattern for any future public write endpoint | Your protection stack already exists; reuse it |
| 21 | Local HTTPS/tunnel recipe for testing auth on other devices | If you ever test from a phone, `trustedOrigins` + OAuth callback + tunnel host must line up; document once in `docs/auth-setup.md` rather than rediscovering it |

---

## 4. Reference-repo post-mortem — keep / fix

**Keep (proven and working):**

- `toNextJsHandler(auth)` in `app/api/auth/[...better-auth]/route.ts` — correct and unchanged by version drift.
- `postgres.js` + `prepare: false` + `max: 1` + 20 s idle timeout for Supabase pooler traffic — right call for the free tier, keep it verbatim.
- Manual role promotion SQL documented in `AUTH_SETUP.md` — that's exactly the workflow you want to preserve (and to make safe in Phase 4).
- `proxy.ts` protected-route table concept + `/not-authorized` destination.
- Client `SignOutButton` / `AdminOnly` split (server gate = `requireAdmin()`, client gate = hook) — correct dual enforcement; v2 adds `requireAdminApi()` for route handlers.

**Fix (carried into v2 as requirements):**

| Reference behaviour | v2.9.0 requirement |
| ------------------- | ------------------ |
| `session.strategy: "jwt"` + 1 h cache | Database sessions + `cookieCache.maxAge = 300`, `disableCookieCache=true` on `/admin*` gating |
| No registration gate | `site_settings` seat limit enforced in a transaction (doc 03 §3.5) |
| Fallback secrets like `"fallback_secret_for_build_only"`, provider ids defaulted to `"google_id"` while also toggling `enabled` | **Fail loudly**: validate env once in `lib/env.ts`, never ship fallback secrets, enable a provider only when its pair is non-empty |
| `trustedOrigins` = one URL | Array that starts as `["http://localhost:3000"]` (local-only today) and grows to include the production origin when you deploy — plus a `https://*.vercel.app` pattern **only** if you decide preview sign-ins are worth it |
| `callbackUrl` default `/dashboard`, entry points pass nothing | Sanitized `callbackUrl` everywhere; default `/` for public pages, `/dashboard` only when the proxy generated it |
| `requireAdmin()` guessing from `Referer` | Explicit path parameter; `Referer` at most a fallback |
| Six social providers all configured | Exactly one (GitHub), env-gated; more only when you ask |
| No 404/error page for auth failures | `/sign-in?error=` state machine + `/not-authorized` |

---

## 5. Free-tier budget check (Supabase — local development today, Vercel later)

| Resource | Free tier | v2.9.0 design usage |
| -------- | --------- | ------------------- |
| Postgres storage | 500 MB | ~1 MB (4 auth tables + 1 settings row). Invoices/page-views in the backlog: still single-digit MB/year |
| Egress | ~5 GB/mo | Sessions are read through a 5-min cookie cache → tens of KB/day at 1–5 users |
| Connections | Pooler, shared | `max: 1` per serverless instance, `prepare: false`, `idle_timeout: 20` |
| Project pause | Free projects pause after ~7 days of inactivity | **Matters more while local-only**: if you don't touch the site for a week, Supabase may pause and the first sign-in attempt fails until you resume it from the dashboard. Add a weekly keep-alive (GitHub Action hitting a trivial query) now, or accept a dashboard click; documented in `/docs/database-setup.md` |
| Auth MAU | — | Not used: we run better-auth on our own Postgres, so Supabase's auth quotas never apply |

**Verdict:** the entire v2.9.0 design fits comfortably; the only real free-tier
risk is the *inactivity pause*, which is an ops task, not an architecture one.

---

## 6. Deliberately NOT recommended (parking lot)

| Idea | Why not (for now) |
| ---- | ----------------- |
| Email + password sign-in | Item 3: no affordable email verification → password reset, verification and abuse handling all become half-features |
| Magic links / email OTP | Same reason — needs a mail provider and a verified sender domain |
| Google OAuth as default | Consent-screen publishing friction you explicitly wanted to avoid; GitHub gives the same "sign in with an existing identity" outcome |
| `strategy: "jwt"` sessions | F6 — hostile to manual DB role edits, non-revocable |
| Firebase for page-view counters (initially) | Adds a second vendor + a service-account key to rotate, for data Postgres already holds. See doc 04 — revisit only if you want the realtime, no-refresh counter feel |
| Supabase Auth (GoTrue) instead of better-auth | You already own the better-auth skills, docs and reference implementation; mixing both doubles the mental model |
| Storing invoice PDFs in Postgres | Generate on demand (free) or Supabase Storage (1 GB free) if you ever need archival |
