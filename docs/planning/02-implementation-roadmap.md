# 02 — Implementation Roadmap (the Path)

One phase = one working session = one branch = one PR. Every phase leaves `main`
buildable and deployable, so you can stop after any phase without a half-built
site. Effort is in *sessions*, not hours — with an AI pair you should finish most
phases in one sitting.

**Branch convention:** `feat/v2.9.0-p<N>-<slug>` → PR into `main` → review locally
(`pnpm dev` + the phase's manual checklist) → merge. Tag `v2.9.0` only after Phase 5
(or 6 if docs ship last).

**Deployment status:** this repo runs **locally only** right now — there is no
production URL, and `prasadm.vercel.app` belongs to the old site. Nothing in
Phases 0–7 requires a deployment; the "when you deploy" work is collected in
`docs/deployment.md` (Phase 6) so it's a checklist later, not a blocker now.

---

## Skills map — which `.agents/skills` to load per phase

| Phase | Load these skills | Purpose |
| ----- | ----------------- | ------- |
| 0 | `pnpm`, `vercel-react-best-practices` | Lockfile/scripts hygiene, config sanity |
| 1 | `supabase-postgres-best-practices`, `drizzle-skills`, `drizzle` (references) | Schema design, indexes, migrations, pooler behaviour |
| 2 | `create-auth`, `better-auth-best-practices`, `better-auth-security-best-practices`, `supabase-postgres-best-practices` | Auth core, hooks, sessions, secrets, rate limiting |
| 3 | `frontend-ui-engineering`, `coss`, `design-taste-frontend`, `ui-ux-pro-max`, `motion-design`, `transitions-polish`, `vercel-react-best-practices` | Pages + React Bits adaptation, a11y, motion polish |
| 4 | `better-auth-best-practices` (admin plugin), `coss`, `frontend-ui-engineering` | Admin tables/forms on your primitives |
| 5 | `redesign-existing-projects`, `notion-api`, `frontend-ui-engineering`, `clarity` | Comments bridge, a11y/motion audit, copy |
| 6 | `clarity`, `humanizer`, `brandkit` | Governance docs + badge/visual identity |
| 7 | `two-factor-authentication-best-practices`, `better-auth-best-practices` | Optional TOTP |
| B | `firebase-basics`, `firebase-firestore`, `firebase-security-rules-auditor` *(only if Firebase)*, `supabase-postgres-best-practices`, `notion-api` | Backlog features (doc 04) |

Rule of thumb: **backend phase = load the auth/drizzle/Supabase skills; frontend
phase = load the UI/taste/motion skills.** Load them at the start of the session,
not mid-way.

---

## Phase 0 — Prep & guardrails (0.5 session)

> **Status: ✅ implemented.** All Phase 0 changes are in this working tree:
> `pnpm lint` and `pnpm typecheck` are clean; the production build is verified by
> CI (the dev sandbox used for implementation had too little RAM to run Turbopack's
> build). Next up: Phase 1.

**Goal:** a trustworthy baseline before any feature work — and the PostHog removal
you asked for. Small, boring, valuable.

| Type | Files |
| ---- | ----- |
| Mod | `next.config.mjs` (`ignoreBuildErrors` → `false`; delete `/ingest` rewrites + 3 PostHog CSP tokens) |
| Mod | `package.json` (`posthog-js` removed via `pnpm remove`; add `"typecheck": "tsc --noEmit"`) |
| New | `.env.local.example` (documented, committable) |
| Mod | `.gitignore` (verify `.env*` is ignored, `!.env.local.example` allowed) |
| New | `.github/workflows/ci.yml` *(recommended — see step 6)* |

**Steps**

1. `git checkout -b feat/v2.9.0-p0-prep && pnpm install` — confirm the lockfile is clean.
2. **Remove PostHog remnant-free** (F12): `pnpm remove posthog-js`; delete the
   `async rewrites()` block in `next.config.mjs` (all three `/ingest*` rules); delete
   `https://*.posthog.com` from the `script-src`, `img-src` and `connect-src` CSP
   directives. Verify nothing else references it:
   `grep -rn -i "posthog\|/ingest" app components lib next.config.mjs`.
   Keep `unsafe-eval`/`wasm-unsafe-eval` in `script-src` — that's for Turnstile/Mermaid,
   not PostHog, don't remove it in the same pass.
3. Flip `ignoreBuildErrors` to `false`, then `pnpm typecheck` and fix what it surfaces.
   Budget for a handful of pre-existing errors — fix them properly, no `@ts-expect-error`
   unless RULES.md §9 conditions are met (narrow scope + WHY comment).
4. `pnpm lint && pnpm typecheck && pnpm build` — all three gates must pass before Phase 1.
5. Create `.env.local.example` (**localhost-only values**, since the site isn't deployed):

   ```env
   # ── Database (Supabase) ────────────────────────────────
   DATABASE_URL=postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
   # ── Better Auth ────────────────────────────────────────
   BETTER_AUTH_SECRET=            # openssl rand -base64 32
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   # ── OAuth: GitHub ──────────────────────────────────────
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   # ── Registration gate (optional floor; the DB row wins) ─
   # ── Added at deployment time (see docs/deployment.md) ──
   # production URL replaces both BETTER_AUTH_URL / NEXT_PUBLIC_SITE_URL above
   ```
6. *(Recommended)* Add a minimal GitHub Actions workflow so the three gates run on
   every PR — with no deployment yet, CI is the only outside check on a phase:
   `on: [push, pull_request]` → pnpm setup (pnpm 11) → `pnpm install --frozen-lockfile`
   → `pnpm lint` → `pnpm typecheck` → `pnpm build` with a dummy `DATABASE_URL`/
   `BETTER_AUTH_SECRET` env so the build never needs real secrets.
7. Optional but recommended: consolidate versions — `lib/config.ts` imports
   `version` from `package.json` instead of the stale `v2.7.5` literal (F3).

**Acceptance:** `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass on a fresh clone;
`grep -ri posthog . --exclude-dir=node_modules` returns nothing but the lockfile
(if it lags) — better still, nothing at all after `pnpm install`;
`.env.local.example` lists every variable Phases 1–3 will need.

**Rollback:** revert the single commit.

---

## Phase 1 — Database foundation (0.5 session)

> **Status: ✅ implemented and verified against a live PostgreSQL 17.** Migration
> applies cleanly; 14 functional checks pass, including concurrent seat-gate
> races. Design corrections found during the build are recorded in
> `03-auth-architecture.md` §3.13 — **read §3.13.1 before writing Phase 2**.
> Next up: Phase 2.

**Goal:** schema + migration + a live Supabase connection, with zero auth logic.

| Type | Files |
| ---- | ----- |
| New | `drizzle.config.ts` |
| New | `lib/db/index.ts`, `lib/db/schema.ts` |
| New | `docs/database-setup.md` |
| Mod | `package.json` (only if a `db:seed`-style script is added — prefer lazy ensure, see below) |

**Steps**

1. Supabase → new project → **Connect → Transaction pooler (port 6543)** → copy the
   URI → `DATABASE_URL` in `.env.local`. Generate the secret:
   `openssl rand -base64 32` → `BETTER_AUTH_SECRET`.
2. `drizzle.config.ts` (mirrors the reference repo's working pattern):

   ```ts
   import { config } from "dotenv";
   import { defineConfig } from "drizzle-kit";
   config({ path: ".env.local" });

   export default defineConfig({
     schema: "./lib/db/schema.ts",
     out: "./drizzle",
     dialect: "postgresql",
     dbCredentials: { url: process.env.DATABASE_URL! },
   });
   ```
3. `lib/db/index.ts` — pooler-safe client (keep the reference repo's proven values):

   ```ts
   export const client = postgres(process.env.DATABASE_URL!, {
     prepare: false,   // required for Supabase transaction pooler
     max: 1,           // serverless-safe
     idle_timeout: 20,
     connect_timeout: 10,
   });
   export const db = drizzle(client, { schema });
   ```
4. `lib/db/schema.ts` — the four better-auth core tables (`user`, `session`, `account`,
   `verification`) **plus** the singleton `site_settings` table that item 5 needs:

   ```ts
   export const siteSettings = pgTable("site_settings", {
     id: text("id").primaryKey().default("primary"),
     maxUsers: integer("max_users").notNull().default(1),
     signupEnabled: boolean("signup_enabled").notNull().default(true),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
     updatedBy: text("updated_by"),
   });
   ```
   Keep the better-auth tables column-compatible with the library (snake_case columns,
   `user.id` as text PK, `email` unique). If you prefer generating them: after Phase 2
   exists, `pnpm dlx auth@latest generate --output lib/db/auth-schema.ts` and diff —
   do **not** let two generators own the same tables.
5. Migration + apply: `pnpm db:generate && pnpm db:migrate` (or `db:studio` to inspect
   in dev). **No manual seed needed** — Phase 2 ships a lazy
   `ensureSiteSettings()` (`INSERT … ON CONFLICT DO NOTHING`) so a fresh DB heals itself.
6. Write `docs/database-setup.md`: project creation, pooler URI, secret generation,
   `db:*` commands, the free-tier inactivity-pause keep-alive, and the reset SQL
   (`TRUNCATE "user", session, account, verification CASCADE`).

**Acceptance:** `pnpm db:studio` shows the five tables; `pnpm build` still passes;
`DATABASE_URL` never appears in any client bundle (grep the build output once).

**Risks:** using the **direct (5432) URI** instead of the pooler (6543) → connection
exhaustion the moment this is deployed, and it's the kind of mistake that only shows
up under load, so use the pooler from day one; `prepare: true` against the pooler →
intermittent errors; the Supabase project pausing after ~7 days idle (free tier) →
first query fails until you resume it in the dashboard.

**Docs to update:** `docs/database-setup.md` (new).

---

## Phase 2 — Auth core (1 session)

> **Status: ✅ implemented and verified.** 59 checks pass against a live
> PostgreSQL 17 — 21 open-redirect cases, forged-cookie rejection, seat-gate
> concurrency, and the authorization URL itself.
> Two claims in the text below were disproved while building and are corrected
> inline: `/api/auth/ok` returns `{"ok":true}` (not `{"status":"ok"}`), and
> `session.strategy: "jwt"` **does not exist** in better-auth 1.7.7. See
> `03-auth-architecture.md` §3.13 and §3.14.

**Goal:** GitHub sign-in that works end-to-end on `localhost`, with the seat gate
already enforced. No UI polish yet — the pages come in Phase 3.

| Type | Files |
| ---- | ----- |
| New | `lib/env.ts`, `lib/auth.ts`, `lib/auth-client.ts`, `lib/auth/server.ts`, `lib/auth/registration.ts`, `lib/auth/callback-url.ts` |
| New | `app/api/auth/[...all]/route.ts` |
| New | `docs/auth-setup.md` (first draft; finished in Phase 5) |
| Mod | `.env.local.example` if anything new appears |

**Steps**

1. GitHub OAuth app: **Settings → Developer settings → OAuth Apps → New OAuth App**.
   Homepage `http://localhost:3000`; callback **exactly**
   `http://localhost:3000/api/auth/callback/github`. Add both id + secret to `.env.local`.
   (Production callback added in Phase 3's deploy step.)
2. `lib/env.ts` — one validated module; **no fallback secrets** (see audit §4):

   ```ts
   const required = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const;
   export function assertServerEnv(): void { /* throw with a clear message per missing key */ }
   export const githubOAuth = {
     enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
     clientId: process.env.GITHUB_CLIENT_ID ?? "",
     clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
   } as const;
   ```
3. `lib/auth.ts` — better-auth with the drizzle adapter, **one** provider, database
   sessions, and the registration hook:

   ```ts
   export const auth = betterAuth({
     database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
     baseURL: process.env.BETTER_AUTH_URL,
     trustedOrigins: [process.env.BETTER_AUTH_URL!, process.env.NEXT_PUBLIC_SITE_URL!].filter(Boolean),
     session: {
       expiresIn: 60 * 60 * 24 * 7,   // do NOT add `strategy: "jwt"` — removed in 1.7.7
       updateAge: 60 * 60 * 24,
       cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5 min: DB edits show up fast (F6)
     },
     socialProviders: githubOAuth.enabled
       ? { github: { clientId: githubOAuth.clientId, clientSecret: githubOAuth.clientSecret } }
       : {},
     user: { additionalFields: { role: { type: "string", required: true, defaultValue: "user", input: false } } },  // input:false is load-bearing — §3.13.1
     account: { accountLinking: { enabled: true } }, // same-email linking for future providers
     rateLimit: { enabled: true, window: 60, max: 100 },
     databaseHooks: { user: { create: { before: async (user) => assertRegistrationOpen(user) } } },
     plugins: [nextCookies()],
   });
   ```
4. `lib/auth/registration.ts` — the seat gate (doc 03 §3.5). Serialize with a row lock so
   two simultaneous OAuth callbacks cannot both claim the last seat:

   ```ts
   export async function assertRegistrationOpen(user: User) {
     const open = await db.transaction(async (tx) => {
       await tx.insert(siteSettings).values({ id: "primary" }).onConflictDoNothing();
       const [s]  = await tx.select().from(siteSettings).where(eq(siteSettings.id, "primary")).for("update");
       const [c]  = await tx.select({ n: count() }).from(userTable);
       return Boolean(s?.signupEnabled) && (s?.maxUsers ?? 1) > (c?.n ?? 0);
     });
     if (!open) throw new APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED", message: "Registration is currently closed." });
     return { data: user };
   }
   ```
5. `lib/auth/server.ts` — the only sanctioned server helpers:
   `getSession()`, `requireUser(callbackPath?)`, `requireAdmin()`, `requireAdminApi()`.
   Each builds `callbackUrl` from an **explicit** path (F8), never `Referer` alone.
6. `lib/auth/callback-url.ts` — `sanitizeCallbackUrl(raw, fallback)` (doc 03 §3.3.2). Write it
   once, use it in proxy, page, and client.
7. `lib/auth-client.ts` — `createAuthClient()`; keep it dependency-free so client
   bundles stay small.
8. `app/api/auth/[...all]/route.ts`:

   ```ts
   import { toNextJsHandler } from "better-auth/next-js";
   export const { POST, GET } = toNextJsHandler(auth);
   ```

**Verification (manual)**

- `GET /api/auth/ok` → `{ "ok": true }`  *(measured; the original guess of `{"status":"ok"}` was wrong)*.
- Sign in via GitHub on a throwaway page → session cookie set, row appears in `user`.
- **Seat gate:** temporarily `UPDATE site_settings SET max_users = 0;` → sign in with a
  *different* GitHub account → expects a rejection redirect (registration closed), then
  `UPDATE site_settings SET max_users = 1;` and delete the throwaway rows:
  `DELETE FROM "user" WHERE email = '<test>';` (accounts/sessions cascade if your FKs do;
  otherwise delete them explicitly).

**Local-only constraints to record in `docs/auth-setup.md` (confirmed once, while building this phase)**

1. The GitHub OAuth app callback must match `BETTER_AUTH_URL` exactly:
   `http://localhost:3000/api/auth/callback/github`.
2. `trustedOrigins: ["http://localhost:3000"]` is sufficient. Visiting the dev server
   from another device via LAN IP (`http://192.168.x.x:3000`) is **rejected by design** —
   document that rather than loosening it.
3. If you ever need phone/manual testing, use a tunnel (`cloudflared`/`ngrok`) and update
   *both* `trustedOrigins` and the OAuth app callback to the tunnel host; revert after.

**Risks:** provider left half-configured (`enabled: true`, empty id) → the config above
makes that impossible; cookie `sameSite`/domain mis-set → not an issue on localhost,
revisit when you deploy; Supabase project paused (free tier) → resume from the dashboard,
see doc 01 §5.

**Docs to update:** `docs/auth-setup.md` (env table, OAuth app steps, seat gate SQL).

---

## Phase 3 — Pages & the redirect-back guarantee (1 session)

> **Status: ✅ implemented.** The five screens, `proxy.ts`, `lib/nav.ts`, the
> `components/auth/` set and the `/tools` stub are all in this working tree;
> `pnpm typecheck` and `pnpm lint` are clean. 31 structural checks pass, and
> Phase 2's suites re-run unchanged at 51 + 8.
> **The manual matrix below is still the real acceptance test** — hops 1, 4 and 5
> need a browser and a GitHub login, so they are handed to you in
> `APPLY-PHASE-3.md` rather than claimed here.
> Two things the audit in this document missed, found while building: the footer
> had **ten** dead links (not just the four `/tools` ones), and its RSS icon
> pointed at `/feed.xml`, which has never existed. Both are fixed.
> Next up: Phase 4.

**Goal:** all five pages + entry points, and the item-4 behaviour proven by a manual
test: *click sign-in on `/about` → GitHub → land back on `/about`.*

| Type | Files |
| ---- | ----- |
| New | `proxy.ts` |
| New | `app/sign-in/page.tsx`, `app/sign-up/page.tsx`, `app/not-authorized/page.tsx`, `app/dashboard/page.tsx`, `app/admin/page.tsx` |
| New | `app/tools/page.tsx` — **"Tools — coming soon"** (fixes the 4 dead links, F1) |
| New | `components/auth/SignInButton.tsx`, `SignInCard.tsx`, `AuthRedirectGuard.tsx`, `UserMenu.tsx`, `SignOutButton.tsx` |
| Mod | `components/site/FloatingNavbar.tsx`, `AppSidebar.tsx`, `MobileBottomNav.tsx`, `components/home/FooterSection.tsx` |
| Mod | `app/sitemap.ts` (exclude auth/private/coming-soon routes) |
| New | `lib/nav.ts` *(optional, recommended — audit P1-#11)* |

**Steps**

1. `proxy.ts` (Next 16 replacement for `middleware.ts` — RULES.md §1.1). Follow the
   reference repo's shape, with the fixes:

   ```ts
   const PROTECTED = [
     { path: "/dashboard", scope: "user" },
     { path: "/admin",     scope: "admin" },
   ] as const;

   export async function proxy(request: NextRequest) {
     // 1. call /api/auth/get-session (with disableCookieCache=true for /admin*) via fetch
     //    → keeps the proxy runtime-agnostic (no DB client in the edge path)
     // 2. no session  → /sign-in?callbackUrl=<sanitized path+search>
     // 3. wrong role  → /not-authorized?from=<path>
     // 4. signed-in user hitting /sign-in|/sign-up → redirect to sanitized callbackUrl (or /dashboard)
   }
   export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/sign-in", "/sign-up"] };
   ```

   **Important:** use `disableCookieCache=true` for `/admin*` so a role you just changed
   in the DB is honoured immediately (F6).
2. React Bits Pro adaptation — copy, then comply:
   - **`/sign-in`** ← `pro/blocks/auth/auth-2` (**decided**: split layout — branded panel
     left, OAuth column right). Swap the Unsplash placeholder for a site asset or a
     React Bits animated backdrop (`aurora-blur` / `glass-flow`), delete the
     Apple/Google buttons, the email+password form and the demo `console.log`
     handlers, restyle the hardcoded `neutral-*` palette to card/ink tokens, and add
     the `role="alert"` error slot. `auth-3` remains the fallback if, at review, the
     split feels too heavy for a personal site.
   - **`/sign-up`** ← same card when a seat is free (copy: "Create your account");
     when closed, render `pro/blocks/waitlist/waitlist-*` (or `app-ui/empty-state-*`)
     as a "Registration is closed" state with a link to `/sign-in`. Server component
     reads registration status, so there is no flash of the wrong state.
   - **`/not-authorized`** ← `pro/blocks/404/404-3` (blurred numerals + compact CTA) or
     `404-6` (theme-aware GLSL glitch); button returns to `/`.
   - **`/dashboard`** ← `pro/app-ui/dashboard/dashboard-1` structure, but render inside
     your **existing** `SiteShell` (do not nest a second app shell/sidebar).
   - **`/admin`** ← placeholder page in this phase; built out in Phase 4 with
     `app-ui/data-table-*`.
   - **Compliance pass on every copied block** (non-negotiable, RULES.md):
     remove demo `console.log` handlers and fake forms · `<a>` → `<Link>` ·
     `<img>` → `<Image>` with `alt` · add `"use client"` where hooks are used ·
     type all props, no `any` · respect `prefers-reduced-motion` (+ your
     AccessibilityContext) · labels for every input, `role="alert"` with `aria-live`
     for error copy · no positive `tabIndex`, no `dangerouslySetInnerHTML`.
3. `<SignInButton>` — the structural fix for F9. It reads the current location and
   can't forget the callback:

   ```tsx
   "use client";
   export function SignInButton({ children, className }: SignInButtonProps) {
     const pathname = usePathname();
     const search = useSearchParams();
     const callbackUrl = sanitizeCallbackUrl(`${pathname}${search.size ? `?${search}` : ""}`, "/");
     return <Link href={{ pathname: "/sign-in", query: { callbackUrl } }} className={className}>{children}</Link>;
   }
   ```
   Use it in all four nav surfaces + the `/about` CTA (the item-4 test case). Replace the
   reference repo's `window.location.href = "/sign-in"` pattern everywhere.
4. `<SignInCard>` — client component: `authClient.signIn.social({ provider: "github",
   callbackURL: safe, newUserCallbackURL: "/dashboard?welcome=1" })`; `isLoading` state
   per button; `?error=` mapping (denied / closed / state-expired).
5. `<AuthRedirectGuard>` — mounted on `/sign-in` and `/sign-up`: if `useSession()` returns
   a session (back button, second tab, already signed in), `router.replace(safeCallback)`
   + `router.refresh()` instead of showing the form again.
6. `<UserMenu>` / `<SignOutButton>` — signed-out → `<SignInButton>` (icon + tooltip);
   signed-in → avatar (`Image`, `avatars.githubusercontent.com` already allowed by CSP)
   with a coss `Menu` (matches repo primitives) linking to `/dashboard`, `/admin`
   (admin only), and sign-out (`authClient.signOut()` → back to the page they were on).
7. `/tools` — **"coming soon"** page (your call, and it retires F1):
   - Build with a Pro `empty-state`/`waitlist` block in site tokens; headline
     "Tools — coming soon", one line on what's planned, a link back to `/projects`
     and a mailto for suggestions. No fake email-capture form, no countdown gimmick.
   - `robots: { index: false, follow: true }` and out of the sitemap until real tools
     ship — a thin "coming soon" page shouldn't rank, but links to it should pass
     signals. All four nav links now resolve, and `MobileBottomNav`'s
     `startsWith("/tools")` active state starts working for the first time.
8. Add `robots: { index: false, follow: false }` metadata to `/sign-in`, `/sign-up`,
   `/dashboard`, `/admin`, `/not-authorized`; exclude them (and `/tools`) from
   `app/sitemap.ts`.
9. **Deployment: nothing to do now** (local-only). When you deploy, follow
   `docs/deployment.md`: add the production callback
   (`https://<domain>/api/auth/callback/github`) next to the localhost one, set
   `BETTER_AUTH_URL`/`NEXT_PUBLIC_SITE_URL`, and extend `trustedOrigins`.

**Manual test matrix (this is the phase's real acceptance)**

| # | Scenario | Expected |
| - | -------- | -------- |
| 1 | Signed out, click sign-in on **`/about`** → GitHub → back | Lands on **`/about`** (item 4) |
| 2 | Signed out, open `/dashboard` directly | `/sign-in?callbackUrl=/dashboard`, then back to `/dashboard` |
| 3 | Non-admin opens `/admin` | `/not-authorized?from=/admin` |
| 4 | `?callbackUrl=https://evil.example` | Ignored → falls back to `/` |
| 5 | `?callbackUrl=//evil.example` / `%2F%2Fevil` / `/sign-in` | Rejected → `/` (no loops, no open redirect) |
| 6 | Signed in, hit `/sign-in` via back button | Immediately forwarded to the callback target |
| 7 | Sign out from `/blog` | Stays on `/blog` (no jump to `/`) |
| 8 | Second GitHub account, seats full | "Registration is closed" — **not** a crash |
| 9 | Keyboard-only + screen reader pass | All flows operable; errors announced |
| 10 | Click "Tools" in the navbar, sidebar, bottom nav and footer | "Coming soon" page renders from all four surfaces (was four 404s) |

**Risks:** proxy mis-matcher (locking out public pages) → keep the matcher list explicit;
CSP blocking GitHub avatar → already allow-listed, verify in preview; OAuth state cookie
dropped by aggressive browser settings → the `?error=` state must explain it in words.

**Docs to update:** `docs/auth-setup.md` (pages, redirect-back algorithm, deploy env vars).

---

## Phase 4 — Admin surface (1 session)

> **Status: ✅ implemented and verified.** 27 behavioural checks pass against a
> live PostgreSQL, including the one that matters most: two simultaneous
> demotions leave exactly one administrator standing. Phase 3's structural suite
> grew to 39; Phase 2's suites re-run unchanged at 51 + 8. **125 checks in total**,
> `pnpm typecheck` and `pnpm lint` clean.
> **Two deviations from the sketch below, both deliberate.** The `admin()` plugin
> was not used — see the "Decided" section of the CHANGELOG and
> `docs/admin-guide.md` §5; the admin surface adds no columns and no migration.
> The `app/admin/(panel)/` route group was dropped as needless indirection; the
> guard lives in `app/admin/layout.tsx` and every page also guards itself.
> The audit-log table (step 5) was **not** built: it is marked optional, needs a
> migration, and `site_settings.updated_by` already answers "who changed the seat
> limit".
> Next up: Phase 5.

**Goal:** you stop needing SQL for routine tasks at *two* levels: role management stays
SQL-by-choice, but **seat count and signup toggle move to the UI**.

| Type | Files |
| ---- | ----- |
| Mod | `lib/auth.ts` (add the `admin()` plugin or keep hand-rolled; see note) |
| New | `app/admin/(panel)/page.tsx`, `app/admin/(panel)/users/page.tsx`, `app/admin/(panel)/settings/page.tsx`, `app/admin/actions.ts` |
| New | `components/admin/UsersTable.tsx`, `components/admin/SiteSettingsForm.tsx` |
| New | `docs/admin-guide.md` |

**Steps**

1. Decide the admin API style. **Recommended:** better-auth's `admin()` plugin
   (`listUsers`, `setRole`, `banUser`) — maintained endpoints, less code. **Alternative:**
   hand-rolled server actions (`requireAdmin()` → Drizzle queries) if you want zero
   plugin surface. Either way, add an `accessControl` mapping (`admin` can manage users;
   `user` has read-only self access).
   *State this choice in the PR so the plugin-vs-actions decision is recorded.*
2. `/admin` → overview cards (`app-ui/dashboard-1`): total users, seats used/limit,
   registration open/closed, last sign-in.
3. `/admin/users` → `app-ui/data-table-*` adapted for: avatar, name, email, role,
   created, last session. Actions: promote/demote, ban (if plugin), delete (guarded —
   never allow deleting the last admin).
4. `/admin/settings` → `app-ui/settings-form-*`: `maxUsers` (number, min 1),
   `signupEnabled` (switch), both via server action `requireAdmin()` +
   `UPDATE site_settings …` with `updatedBy = session.user.email`, revalidate the page.
   This is the "change allowable user count in DB" control from item 5 — the SQL
   equivalent stays documented for emergencies.
5. Optional (audit P2 item): write an audit row per admin action (`system_logs` table, same
   shape as the reference repo's).
6. `docs/admin-guide.md`: how to become admin (`UPDATE "user" SET role='admin' WHERE email='…'`),
   what each screen does, the seat-limit semantics (existing users are never locked out;
   only *creation* is gated), and rollback SQL.

**Acceptance:** you promote yourself via SQL once, then raise the seat limit to 2 in the
UI and confirm a second GitHub account can now register; set it back to 1 and confirm the
next new account is refused while both existing users still sign in fine.

---

## Phase 5 — Enhancements, polish & docs completion (1 session)

> **Status: ✅ implemented and verified.** 34 new checks, 159 in total across all
> suites, `pnpm typecheck` and `pnpm lint` clean. No database or build needed for
> the new suite.
> **Deviation:** bookmarks sync was **not** built. It needs a `user.preferences`
> JSONB column — a migration — to sync state `ContentBookmarksProvider` already
> persists per device, on a site that runs on one machine. Recorded in the
> CHANGELOG under "Decided".
> **Also decided here:** the footer's `/roadmap` and `/changelog` entries were
> removed rather than built (rendering Markdown needs `dangerouslySetInnerHTML`,
> which `RULES.md` §4 forbids), and the "Systems operational" badge was deleted
> because this repository is not deployed anywhere.
> **Found on the way:** the comments directory held a dead, case-colliding
> duplicate that could have silently reverted the whole phase on macOS or
> Windows — see the CHANGELOG's "Fixed" section.

**Goal:** connect auth to the rest of the site, harden a11y/motion, finish the setup docs.

| Workstream | Detail |
| ---------- | ------ |
| Comments bridge — **your option (b)** | When the owner is signed in: `hooks/use-commenter-identity` + `lib/comments/*` **prefill and lock** name/email/avatar from the session (with a "signed in as @handle — sign out to comment as a guest" affordance), and the stored comment is marked so the renderer shows an **Owner** badge. Implementation: bump the wire format to `PMc2` with a **server-set** `role` segment (`[PMc2\|Name\|email\|source:handle\|avatar\|role]:`), parser stays back-compatible with `PMc1`, the flag is derived from the session inside `/api/comments` — never from the request body. Full spec in doc 03 §3.10. Guests keep the exact current path — no regression |
| Bookmarks *(optional, flag-gated)* | Sync `ContentBookmarksProvider` state to `user.preferences` JSONB on sign-in, merge local-first (reference repo's `useAuthSync` pattern, but opt-in) |
| Motion & a11y audit | Every auth page: keyboard order, focus ring, `aria-live` errors, no `autoFocus` without justification, reduced-motion honoured; run the `/accessibility` reader settings against `/sign-in` |
| SEO/robots | Confirm sitemap exclusions, `robots.txt`, and that `/not-authorized` doesn't leak admin structure |
| Copy pass | Error states in plain language (`clarity` skill); no raw error codes to users |
| Docs finish | `docs/auth-setup.md` (complete), `docs/env-variables.md`, `docs/admin-guide.md` final, `docs/database-setup.md` verified against a fresh Supabase project |
| Versioning | Bump to `2.9.0`, update `siteConfig`, start `CHANGELOG.md` |

**Acceptance:** the whole manual matrix from Phase 3 passes again *after* these changes;
`pnpm lint && pnpm typecheck && pnpm build` clean; docs reproduce a from-scratch setup.

---

## Phase 6 — Governance docs — item 8 (0.5 session)

> **Status: ✅ implemented and complete — v2.9.0 is done.**
> 15 files, **no application code**: 11 new documents, 3 GitHub files, and one
> configuration change. 50 new checks (`verification/docs-claims.test.mjs`),
> **209 in total** across all suites; `pnpm lint` clean. Both application paths
> verified byte-identical against a clean clone.
> **Found while writing it:** the repository has never been Prettier-formatted and
> `.prettierrc` is empty (`{}`) — 133 `.ts`/`.tsx` files lean semicolon-terminated
> and 77 do not, so no single `semi` setting makes it clean. **Nothing was
> reformatted** (it would be an unreviewable hundred-file diff with `typecheck` and
> `build` unrunnable here); `CONTRIBUTING.md` now warns against running
> `pnpm format` repo-wide, and picking a value is left to the owner as its own
> commit. Recorded in the CHANGELOG under "Found".
> **Hardening that came out of it:** four unused hosts removed from the CSP and
> `remotePatterns` (`prasadm.vercel.app`, `vitals.vercel-analytics.com`,
> `api.vercel.com`, `va.vercel-scripts.com` — all verified to have zero code
> references), a malformed `remotePattern` removed (its `hostname` was fed to
> `new URL()`, so a path inside it could never match), and
> `images.contentSecurityPolicy` added beside `dangerouslyAllowSVG`, which Next
> requires as a pair.
> **Also note:** `pnpm typecheck` no longer runs in the development environment —
> a cold `tsc` does not fit in 1.9 GB once `tsconfig.tsbuildinfo` is gone. **CI is
> the typecheck gate from here.**
> **Left to the owner:** apply the GitHub repository settings in
> `docs/deployment.md` §8 (private vulnerability reporting above all, since
> `SECURITY.md` points at it), read the documents cold, and decide the Prettier
> question.
> Next: Phase 7 is **optional and not started** — see below.

Full specification lives in [`05-docs-and-governance-plan.md`](./05-docs-and-governance-plan.md).
Deliverables: rewrote `README.md` (badges/icons, architecture, setup, feature matrix),
`CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 + enforcement contact),
`CONTRIBUTING.md`, `SECURITY.md` (supported versions, private reporting, scope),
`ACCESSIBILITY.md` (WCAG 2.2 AA commitment, barrier reporting, existing reader tools),
plus the `/docs/` set. Can run before or after Phases 1–5, but **write it last if you
want the README to describe reality rather than intent**.

---

## Phase 7 — *(optional)* Two-factor authentication (1 session)

**Goal:** TOTP as a second factor. **Gate this phase on one research task:** verify the
`twoFactor` plugin's enable-flow for OAuth-only accounts (no password available to
re-confirm). If `authClient.twoFactor.enable({ password })` is mandatory, either
(a) accept the plugin's alternative verification path if one exists in your better-auth
version, or (b) defer 2FA until email/password (which you don't want) or a passkey
plugin is added. **Do not** fake it with a custom TOTP layer — `two-factor-authentication-best-practices`
skill + the plugin is the only path RULES.md-compliant enough to trust.

If it clears: add the plugin, `/dashboard/security` enrollment page (QR + backup codes),
trusted-device handling, and a documented recovery procedure (backup codes stored
offline). Because there is exactly one account, a lost TOTP secret is a real lockout —
the recovery procedure in `docs/admin-guide.md` is part of the deliverable.

---

## Backlog — item 7 (see doc 04)

| Item | Trigger to start | First steps |
| ---- | ---------------- | ----------- |
| Page-view counter | When the auth base is merged and stable | Choose Postgres (recommended) vs Firebase per doc 04; add `page_views` table or Firebase project; `/api/views/[slug]` + display component on detail pages |
| Invoice generator (admin only) | After Phase 4 (needs admin area) | `clients` / `invoices` / `invoice_items` / numbering counter tables; `/admin/invoices/*`; PDF via `@react-pdf/renderer` |

---

## Definition of Done — v2.9.0 overall

- [ ] `/sign-in`, `/sign-up`, `/not-authorized`, `/dashboard`, `/admin` live and index-excluded
- [ ] `/tools` "coming soon" resolves from all four nav surfaces (no 404s left)
- [ ] GitHub is the only sign-in method; no email/password anywhere in the codebase
- [ ] The "sign in from `/about` → back to `/about`" test passes locally (repeat on the production URL the day you deploy)
- [ ] Registration closes automatically at `max_users` (default 1); the limit is editable in `/admin/settings`
- [ ] Role promotion via SQL is documented and takes effect within ≤5 minutes (or instantly on `/admin*`)
- [ ] Guest commenting still works exactly as before; owner comments carry the **Owner** badge
- [ ] PostHog fully removed — no dependency, no `/ingest` rewrite, no CSP token
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` clean; CI runs all three on every PR
- [ ] README/CoC/CONTRIBUTING/SECURITY/ACCESSIBILITY + `/docs/` published
- [ ] `CHANGELOG.md` has one entry per phase, tagged `v2.9.0`

---

## Session rhythm (how to keep it consistent)

1. **Open:** load the phase's skills, `git checkout -b feat/v2.9.0-p<N>-…`, read that
   phase section here.
2. **Build:** implement in the file order listed (backend → wiring → UI → docs).
3. **Verify:** run the phase's acceptance checklist manually. No automated-test detours.
4. **Commit:** one commit per phase, message
   `feat(auth): phase N — <name> (v2.9.0)`, then push the PR.
5. **Review:** run `pnpm dev` and click the phase's flows yourself (no deployment yet;
   CI from Phase 0 is the automated half) → merge → move to the next phase *in a new
   session* so context stays clean.
