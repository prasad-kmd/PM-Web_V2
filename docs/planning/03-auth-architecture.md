# 03 — Auth Architecture (v2.9.0)

The technical design behind Phases 1–4 of the roadmap. Decisions here are
intentionally explicit — every "why" is written down so a future session (human
or agent) doesn't quietly reverse one.

---

## 3.1 Stack & principles

| Layer | Choice | Why |
| ----- | ------ | --- |
| Auth library | `better-auth@1.7.7` (already installed) | Installed, documented in your skills, proven in the reference repo |
| Database | Supabase Postgres + `drizzle-orm` + `postgres.js` | Already installed; free tier is ample for 1–5 users |
| Sessions | **Database sessions** + 5-min cookie cache | Role/DB edits must not lag (see 3.2) |
| Providers | **GitHub only**, env-gated | Minimal setup, zero verification, CSP already allows its avatars |
| Route gate | `proxy.ts` (Next 16) calling the auth HTTP endpoint | Runtime-agnostic; no DB client in the proxy path; RULES.md §1.1 |
| Sign-in UI | React Bits **Pro** `auth-2` (or `auth-3`) adapted to site tokens | Ultimate licence in hand; consistent with site motion/visual language |
| Identity model | **One or few named accounts**, not a public sign-up site (item 5/6) | The seat gate is a feature, not a limitation |

**Principles**

1. **Only-creation is gated, never access.** Existing users always sign in; the seat
   limit only refuses *new* `user` rows.
2. **Fail loudly on config.** No fallback secrets, no placeholder provider ids.
3. **Sanitize on every hop.** `callbackUrl` is validated at proxy, page, and client.
4. **Guests stay first-class.** Anonymous Notion commenting keeps working — auth is
   additive.
5. **One source of truth per behaviour.** One sanitizer, one seat gate, one sign-in
   button component, one session helper module.

### How this differs from the reference repo (item 6)

| Aspect | `PMEngineerLK-NextJS` | `PM-Web_V2` v2.9.0 |
| ------ | --------------------- | ------------------ |
| Audience | Every visitor could register and sign in | **One** initial owner account; registration auto-closes |
| Providers | 6 configured (Google, GitHub, Facebook, Twitter, Reddit, Notion, Vercel) | GitHub only, env-gated |
| Sessions | `strategy: "jwt"`, 1 h cookie cache | Database + 5-min cache (instant admin-route accuracy) |
| Gate | None | Transactional seat limit in `databaseHooks.user.create.before` |
| Return-to-page | Entry points forgot `callbackUrl` | `<SignInButton>` cannot forget + guard on the auth pages |
| Comments | Signed-in users only (auth inherited from the old site) | Guest comments remain; signed-in identity pre-fills them |

---

## 3.2 Session strategy — why *not* `"jwt"`

| Criterion | `strategy: "jwt"` (reference repo) | **Database + 5-min cookie cache (chosen)** |
| --------- | ---------------------------------- | ------------------------------------------ |
| Your workflow (edit `role` by hand) | Up to **1 h** before it takes effect | ≤ 5 min on public pages, **instant** on `/admin*` |
| Revocation (ban/kill session) | Impossible without rotating the secret | Delete the row |
| DB reads at 1–5 users | Slightly fewer | Irrelevant — a handful of queries/day |
| Complexity | Higher (JWT semantics, staleness caveats) | Default behaviour, less to explain |
| Fit for free tier | Marginal saving | Free tier covers it by orders of magnitude |

Config:

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7,          // 7 days
  updateAge: 60 * 60 * 24,              // refresh the row at most daily
  cookieCache: { enabled: true, maxAge: 5 * 60 },
}
```

And on admin gating only — in `lib/auth/server.ts` and `proxy.ts` — bypass the cache:

```ts
const session = await auth.api.getSession({
  headers: await headers(),
  query: { disableCookieCache: true },
});
```

**Documented consequence:** on a public page, a role change can take up to five
minutes to appear (e.g. the "Admin" link in the user menu). On `/admin*` it is
immediate. Signing out and back in is the manual flush.

---

## 3.3 The redirect-back guarantee (item 4)

### 3.3.1 Why it failed in the reference repo

Three independent bugs, any one of which is enough to break "return to the page
you came from":

1. **Entry points dropped the destination.** The global user menu navigated with
   `window.location.href = "/sign-in"` — no `callbackUrl` at all. Only the
   protected-route path in `proxy.ts` ever set one, so every *voluntary* sign-in
   started with no destination.
2. **The default hid the bug.** The sign-in card defaulted the destination to
   `/dashboard`, so a missing `callbackUrl` looked like "correct behaviour with
   the wrong target" rather than an error.
3. **No signed-in guard on `/sign-in`.** After the OAuth round trip the page
   happily re-rendered the form in some paths (back button, cached render) and the
   user could be left looking at "Sign in" while already authenticated.

### 3.3.2 The five-hop model

```
   ┌─ hop 1: anywhere on the site ─────────────────────────────┐
   │  <SignInButton>  → /sign-in?callbackUrl=<current path+query>
   └───────────────────────────────────────────────────────────┘
                            ↓
   ┌─ hop 2: /sign-in (server component) ──────────────────────┐
   │  sanitize(searchParams.callbackUrl, fallback)  → `safe`    │
   │  render <AuthRedirectGuard safe={safe}> + <SignInCard>     │
   └───────────────────────────────────────────────────────────┘
                            ↓
   ┌─ hop 3: GitHub OAuth ─────────────────────────────────────┐
   │  signIn.social({ provider:"github",                        │
   │                  callbackURL: safe,                        │
   │                  newUserCallbackURL: "/dashboard?welcome=1"})
   └───────────────────────────────────────────────────────────┘
                            ↓
   ┌─ hop 4: /api/auth/callback/github ────────────────────────┐
   │  better-auth validates state, creates/loads the user,       │
   │  sets the session cookie, redirects to `callbackURL`        │
   └───────────────────────────────────────────────────────────┘
                            ↓
   ┌─ hop 5: destination page ─────────────────────────────────┐
   │  renders signed-in; <AuthRedirectGuard> auto-forwards       │
   │  anyone already authenticated who lands back on /sign-in    │
   └───────────────────────────────────────────────────────────┘
```

### 3.3.3 `sanitizeCallbackUrl` — the single source of truth

Used by the proxy (hop 2 prelude), the sign-in page (hop 2), and `<SignInButton>`
(hop 1). Returns an internal path or the fallback; **never** throws.

```ts
export function sanitizeCallbackUrl(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let value = raw.trim();
  try { value = decodeURIComponent(value); } catch { return fallback; }        // double-encoding
  if (!value.startsWith("/")) return fallback;                                  // absolute URL
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;       // protocol-relative
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;                     // control chars
  if (value.includes("://")) return fallback;                                   // smuggled scheme
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";              // compare on path alone
  if (path === "/sign-in" || path === "/sign-up" || path.startsWith("/api/auth")) return fallback; // loop guard
  return value.slice(0, 512);                                                   // bound the length
}
```

Consumed by the **RULES.md §5.9 / CodeQL `js/unvalidated-url-redirection`** rule —
this is why it must exist in one place with no exceptions: the sanitizer *is* the
allowlist.

### 3.3.4 `<SignInCard>` (hop 3)

```tsx
"use client";
export function SignInCard({ callbackUrl, providerEnabled, registrationOpen }: Props) {
  const navigate = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const search = useSearchParams();

  const signIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl,                    // already sanitized upstream
        newUserCallbackURL: "/dashboard?welcome=1",  // first-ever sign-in lands somewhere sensible
        errorCallbackURL: "/sign-in",                // provider denials come back with ?error=
      });
      // No navigate() here: the browser is leaving for github.com. Reaching this
      // line means the request failed before the redirect.
      navigate.refresh();
    } catch {
      toast.error("GitHub sign-in couldn't start. Please try again.");
      setIsLoading(false);
    }
  };

  const error = search.get("error");
  if (!registrationOpen) return <RegistrationClosedState />;
  return (
    <form onSubmit={(e) => { e.preventDefault(); void signIn(); }}>
      {error ? <p role="alert" aria-live="polite">{describeAuthError(error)}</p> : null}
      <button type="submit" disabled={!providerEnabled || isLoading} aria-busy={isLoading}>
        <GitHubMark aria-hidden /> {isLoading ? "Opening GitHub…" : "Continue with GitHub"}
      </button>
    </form>
  );
}
```

Rendering rules: real `<form>` + `<button type="submit">` so Enter submits;
`role="alert"` + `aria-live="polite"` for the error sentence; the GitHub mark is
`aria-hidden` (the label already says GitHub); `aria-busy` while redirecting.

### 3.3.5 Edge cases and their answers

| Case | Behaviour |
| ---- | --------- |
| `callbackUrl` absent (direct visit to `/sign-in`) | Fallback `/` — but `/dashboard` if the *proxy* generated the link, because that's the user's actual intent |
| `callbackUrl=https://evil.example` | Sanitizer → `/` (open-redirect blocked) |
| `callbackUrl=//evil.example`, `/\/evil`, `%2F%2Fevil` | All → `/` |
| `callbackUrl=/sign-in` or `/api/auth/...` | → `/` (loop guard) |
| Very long query strings | Truncated at 512 chars before use |
| User already signed in, presses Back to `/sign-in` | `<AuthRedirectGuard>` replaces history with the callback target |
| User cancels on GitHub | `?error=access_denied` → friendly sentence, form still usable |
| Session cookie blocked (strict privacy browser) | Post-callback page renders signed-out; form shows a "cookies are required" notice |
| Seat filled mid-flow by another device | Callback returns with the registration-closed error → closed state, **existing** accounts unaffected |
| Crash after cookie set, before render | The destination page is public; the guard/cache self-heals on next navigation |

### 3.3.6 Manual test list (Phase 3 acceptance)

The nine-row matrix in `02-implementation-roadmap.md` → Phase 3. Row 1 (**sign in
from `/about` → land back on `/about`**) is the item-4 acceptance test; rows 4–5
are the open-redirect proofs; row 6 is the loop proof.

---

## 3.4 Route protection

### Matrix

| Route | Access | Enforced by |
| ----- | ------ | ----------- |
| `/` , `/about`, `/blog`, `/projects`, … | Public | — |
| `/sign-in`, `/sign-up` | Public, **redirected away if signed in** | `proxy.ts` + `<AuthRedirectGuard>` |
| `/dashboard` | Authenticated | `proxy.ts` (session) + `requireUser()` in the page |
| `/admin`, `/admin/**` | `role === "admin"` | `proxy.ts` (fresh session) + `requireAdmin()` in the page |
| `/not-authorized` | Public | — |
| `/api/auth/**` | Public (better-auth) | better-auth itself |
| Future `/api/admin/**` | Admin | `requireAdminApi()` in the handler (401/403 JSON, no redirect) |

### `proxy.ts` design notes

- **Never** import the DB client here — call `/api/auth/get-session` over HTTP with the
  incoming cookie, so the file stays runtime-agnostic (works on Node or edge runtimes).
- Add `disableCookieCache=true` **only** for `/admin*` (accuracy over speed where it
  matters).
- Redirects set `callbackUrl` for the *original* request: `pathname + search`
  (sanitized). Never redirect to a URL taken from a query parameter without sanitizing.
- Keep `config.matcher` explicit and small: `["/dashboard/:path*", "/admin/:path*",
  "/sign-in", "/sign-up"]`. A blanket matcher on `/:path*` slows every asset request.
- Signed-in users hitting `/sign-in` are redirected to their sanitized `callbackUrl`
  (or `/dashboard`) — this is what makes the Back button behave.

### Server-side dual enforcement

Middleware/proxy is a convenience gate, **not** the security boundary. Every protected
page and every admin action re-checks on the server:

```ts
// lib/auth/server.ts
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) redirect(`/sign-in?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl(await currentPath(), "/dashboard"))}`);
  if (session.user.role !== "admin") redirect(`/not-authorized?from=${encodeURIComponent(await currentPath())}`);
  return session;
}
```

---

## 3.5 The seat gate — "one person can register, then registration closes" (item 5)

### Data model

```ts
export const siteSettings = pgTable("site_settings", {
  id:            text("id").primaryKey().default("primary"),   // singleton row
  maxUsers:      integer("max_users").notNull().default(1),
  signupEnabled: boolean("signup_enabled").notNull().default(true),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
  updatedBy:     text("updated_by"),
});
```

Semantics:

| Field | Meaning |
| ----- | ------- |
| `max_users = 1` (default) | Exactly one account may ever exist. The second person's first sign-in is refused |
| `max_users = n` | Raise the ceiling from `/admin/settings` (Phase 4) or `UPDATE` SQL |
| `signup_enabled = false` | Hard stop regardless of remaining seats (useful during migrations/debugging) |
| Existing users | **Never** affected — sessions continue to work; only `user` row *creation* is gated |

### Enforcement (runs inside better-auth's user-creation path)

```ts
// lib/auth/registration.ts
export async function assertRegistrationOpen(user: IncomingUser) {
  const open = await db.transaction(async (tx) => {
    // 1. make sure the singleton exists (idempotent; no manual seeding needed)
    await tx.insert(siteSettings).values({ id: "primary" }).onConflictDoNothing();

    // 2. lock the settings row: serializes concurrent OAuth callbacks so two
    //    racing first-sign-ins can never both take the last seat
    const [settings] = await tx
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "primary"))
      .for("update");

    // 3. count inside the same transaction, after the lock
    const [row] = await tx.select({ total: count() }).from(userTable);

    return Boolean(settings?.signupEnabled) && (settings?.maxUsers ?? 1) > (row?.total ?? 0);
  });

  if (!open) {
    throw new APIError("FORBIDDEN", {
      code: "REGISTRATION_CLOSED",
      message: "Registration is currently closed for this site.",
    });
  }
  return { data: user };
}
```

Wired in `lib/auth.ts`:

```ts
databaseHooks: { user: { create: { before: (user) => assertRegistrationOpen(user) } } },
```

### Why a row lock and not a "SELECT then INSERT"

On serverless, two OAuth callbacks can execute at the same instant. `SELECT count(*)`
→ "0 users, let them in" twice would produce **two** accounts. Taking a row-level
lock on the singleton (`SELECT … FOR UPDATE`) inside the same transaction forces the
second callback to wait, re-count, see 1 user, and get refused. The count is read
*after* the lock, in the same transaction, or the guard is decorative.

### Race conditions considered

| Scenario | Result |
| -------- | ------ |
| Two devices, same person, first-ever sign-in, simultaneously | One succeeds; the other is refused with the closed message, then can simply sign in as the now-existing user |
| Seat raised while somebody is mid-OAuth | Their callback re-counts under lock → admitted if a seat is genuinely free |
| Settings row missing (fresh DB, migration ran, no seed) | The transaction upserts it first — self-healing |
| Admin deletes all users (manual SQL) | Registration re-opens automatically (count < max) |
| Provider returns an existing user (normal sign-in) | Hook is **not** called — creation path only. No false refusals |

### Operator playbook (goes into `docs/admin-guide.md`)

```sql
-- who am I / how many seats are used
SELECT (SELECT count(*) FROM "user") AS used, max_users, signup_enabled FROM site_settings;

-- raise the ceiling
UPDATE site_settings SET max_users = 3, updated_at = now() WHERE id = 'primary';

-- promote myself (item 5's documented path; also possible from /admin/users after Phase 4)
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';

-- emergency: wipe a bad test account
DELETE FROM session  WHERE "user_id" = '<id>';
DELETE FROM account  WHERE "user_id" = '<id>';
DELETE FROM "user"   WHERE id = '<id>';
```

---

## 3.6 Schema — full picture (auth) + future-proofing

**This phase ships only the five tables below.** The backlog tables (doc 04) are
listed in the same file as commented designs so the migration history stays linear.

```ts
// ── better-auth core (column names/compat matter — see the library docs) ──
user          (id text PK, name, email unique, email_verified, image, created_at, updated_at,
               role text default 'user', banned, ban_reason, ban_expires)   ← last three only if admin plugin
session       (id text PK, expires_at, token unique, created_at, updated_at, ip_address, user_agent,
               user_id → user.id, impersonated_by?)                        ← impersonated_by only if admin plugin
account       (id text PK, account_id, provider_id, user_id → user.id, access_token, refresh_token,
               id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
verification  (id text PK, identifier, value, expires_at, created_at, updated_at)

// ── product config ──
site_settings (id PK 'primary', max_users int default 1, signup_enabled bool default true,
               updated_at, updated_by)
```

**Notes**

- `user.id` is `text` (better-auth generates IDs). Keep it text — do not "improve" it to uuid.
- `password` exists in `account` even with OAuth-only: keep the column so adding
  email/password later is a config change, not a migration. It stays `NULL` forever.
- **Indexes:** unique on `user.email`, `session.token`, and an index on
  `session.user_id` (the admin users list joins on it). Nothing else is needed at this scale.
- If you adopt the `admin()` plugin in Phase 4, re-generate/“diff” the schema and add
  only the new columns (`banned`, `ban_reason`, `ban_expires`, `session.impersonated_by`).
- Timezone-aware timestamps (`timestamptz`) for anything you'll display in `Asia/Colombo`.

---

## 3.7 Environment variables

| Variable | Where | Notes |
| -------- | ----- | ----- |
| `DATABASE_URL` | Server | Supabase **transaction pooler**, port `6543`, `?pgbouncer=true` |
| `BETTER_AUTH_SECRET` | Server | `openssl rand -base64 32`; ≥32 chars; never reused between projects |
| `BETTER_AUTH_URL` | Server | **`http://localhost:3000`** — this repo is local-only today; at deployment time this becomes the production URL (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | Both | `http://localhost:3000` for now. Used by metadata + trusted origins + `metadataBase` (which currently still defaults to the *old* site's `prasadm.vercel.app` — set this explicitly so local metadata is truthful) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Server | Both empty ⇒ provider simply not registered (site still builds) |
| `AUTH_DEBUG` (optional) | Server | Verbose auth logging in dev only; **never** enabled in production |

Rule: no `NEXT_PUBLIC_` prefix on anything secret — RULES.md §5.8.

---

## 3.8 Security checklist (mapped to RULES.md)

| Area | Measure |
| ---- | ------- |
| Open redirect (§5.9) | `sanitizeCallbackUrl`; single implementation, used at all three hops |
| CSRF | better-auth state cookie + `trustedOrigins`. **Today: `["http://localhost:3000"]` only.** Add the production origin when you deploy; add a `https://*.vercel.app` pattern **only** if you genuinely want preview sign-ins. A LAN IP (`http://192.168.x.x:3000`) will be rejected — intended, documented in `docs/auth-setup.md` |
| Session cookies | `httpOnly`, `secure` in production, `sameSite: "lax"` (required for the OAuth redirect back) |
| Secrets (§5.8) | `.env.local` only; `.env.local.example` documents names with empty values; no fallback strings in code |
| SQL injection (§5.2) | Drizzle parameterized queries only; never template-literal SQL with input |
| XSS (§5.1) | No `dangerouslySetInnerHTML` in any auth surface; error copy rendered as text/JSX |
| Rate limiting | better-auth built-in (in-memory; documented limitation, F10) + GitHub's own limits; revisit only if an unauthenticated write endpoint is added |
| PII / GDPR | We store name, email, avatar URL from GitHub. Update the privacy policy (Phase 6) and never log full session objects |
| Audit | Phase 4 writes admin-action rows; auth events stay in better-auth's own tables (no custom logging of tokens/emails) |
| CSP | No change required for GitHub; document the `cdn.discordapp.com` addition if Discord is ever enabled |
| CodeQL | No new suppression comments; the sanitizer removes the one real unvalidated-redirect sink |

---

## 3.9 React Bits mapping (Ultimate licence — Pro included)

| Screen | Primary source | Adaptation notes |
| ------ | -------------- | ---------------- |
| `/sign-in` | **`pro/blocks/auth/auth-2` (decided)** | Split layout: branded panel left, OAuth column right. Delete the Apple/Google buttons, the email+password form and the demo `console.log` handlers; replace the Unsplash image with a site asset or a React Bits backdrop (`aurora-blur`/`glass-flow`); restyle the hardcoded `neutral-*` palette to card/ink tokens + `google-sans`; wire `authClient.signIn.social`; add the `role="alert"` error slot. **Fallback:** `auth-3` (centered card over imagery) if the split reviews as too heavy |
| `/sign-up` (seat open) | Same `auth-2` shell, different copy | Title "Create your account", one line explaining GitHub is the identity provider (no password, nothing to remember) |
| `/sign-up` (seat closed) | `pro/blocks/waitlist/waitlist-*` or `app-ui/empty-state-*` | "Registration is closed" + how to reach you; keep it honest, not a fake lead-capture form |
| `/not-authorized` | `pro/blocks/404/404-3` (blurred numerals + CTA) or `404-6` (theme GLSL glitch) | Reuse site tokens; single primary action back to `/`; no auto-redirect (the user may want to read it) |
| `/tools` | `app-ui/empty-state-*` or `pro/blocks/waitlist/*` | "Tools — coming soon" in site tokens; link to `/projects` + a mailto; `noindex`, out of the sitemap until real tools exist |
| `/dashboard` | `pro/app-ui/dashboard/dashboard-1`; optionally `app-ui/navbar`, `app-ui/empty-state` | Render **inside** the existing `SiteShell`; no nested sidebar; keep the "signed in as …" moment understated |
| `/admin` overview | `pro/app-ui/dashboard-1` (metric cards) | Four cards: users, seats used/limit, registration state, last sign-in |
| `/admin/users` | `pro/app-ui/data-table/data-table-*` + `app-ui/filtering` | Columns per §3.6; role actions guarded (never demote/delete the last admin) |
| `/admin/settings` | `pro/app-ui/settings-form/settings-form-*` | `maxUsers` number input (min 1) + `signupEnabled` switch, server action + revalidate |
| User menu | `pro/app-ui/navbar/navbar-*` for the dropdown *pattern*, built on your `coss` `Menu` primitive | Signed-out → `<SignInButton>` icon; signed-in → avatar + Dashboard/Admin/Sign out |
| Polish layers | `app-ui/dashboard-7` (skeleton/loading patterns); free-library `FadeContent`, `SplitText`, `ShinyText` (already in the repo) + `pro/components/aurora-blur`/`glass-flow` for the sign-in backdrop | Honour `prefers-reduced-motion` + the AccessibilityContext toggle for every animated layer |
| Command palette (later) | `pro/app-ui/command-menu` | Nice fit for quick "go to /admin/settings" jumps |

### Compliance pass for every copied Pro block (RULES.md)

1. Remove demo handlers, fake forms and `console.log`s.
2. `<a>` → `next/link`; `<img>` → `next/image` with meaningful `alt`.
3. Constants/props typed; no `any`; no index-as-key on reorderable lists.
4. `"use client"` only where hooks/handlers need it; keep page shells as server components.
5. Respect reduced motion and the site's accessibility settings.
6. Hardcoded palettes → CSS variables (`bg-card`, `text-ink`, accent tokens) so the
   accent picker keeps working.
7. Any image URL that isn't yours → replace with local assets or the existing allow-listed hosts.

*(Pro licence note: files are yours to edit and reuse across your projects; don't
repackage them as a component library or share the raw archive — internal use in
this repo is exactly what the licence covers.)*

---

## 3.10 Comments identity bridge (Phase 5 — your option (b))

Goal: signed-in **owner** comments are prefilled *and* visibly marked; guests are
untouched.

### 3.10.1 The wire format — `PMc1` → `PMc2` (additive)

`lib/comments/format.ts` already folds attribution into the comment text because
Notion has no first-class author metadata for integration comments:

```
PMc1:  [PMc1|Name|email|source:handle|avatarUrl]: body
PMc2:  [PMc2|Name|email|source:handle|avatarUrl|role]: body      ← new, one extra segment
```

`role` is `owner` for comments created through a signed-in admin session, `member`
for any other signed-in user, and empty for guests. Parser rules (all backward
compatible — existing comments must keep rendering):

| Input | Parsed as |
| ----- | --------- |
| `PMc2|…|owner` | `author.role = "owner"` → **Owner** badge |
| `PMc2|…|member` | `author.role = "member"` → name only |
| `PMc2|…|` (empty) | `author.role = null` → guest rendering |
| `PMc1|…` (existing comments) | `author.role = null`, unchanged behaviour |
| legacy `[Name|id|avatar]:` | unchanged (`isLegacy`) |
| raw Notion-typed | unchanged (`isExternal`, "via Notion") |

Because the meta segment eats into Notion's 2000-char comment limit, add the two
new possible characters to the existing budget calculation in `formatComment`
(+1 separator + up to 6 chars) and keep the truncation as-is.

### 3.10.2 Where the flag comes from — server, always

```
POST /api/comments
  ├─ require nothing (guests allowed)
  ├─ try  getSession()  ── signed in? ─┬─ yes → role = session.user.role === "admin" ? "owner" : "member"
  │                                    └─ no  → role = ""  (guest path, exactly as today)
  ├─ build ResolvedCommenter from the SESSION (name, email, avatar) when signed in,
  │  ignoring any name/email/role in the request body
  └─ formatComment(commenter, body) → PMc2 → Notion
```

Hard rules:

- **The `role` segment is never read from the request body.** A client that sends
  `role=owner` must be ignored (RULES.md §5.6 mindset — no user-controlled property
  selects behaviour). Add a zod entry in `lib/comments/validate.ts` only for the
  *guest* shape; when a session exists, the server overrides the identity fields
  outright.
- Rate limits, Turnstile, profanity, disposable-email and daily caps apply to
  signed-in comments too — being the owner is not a bypass. If you want the owner
  exempt from Turnstile for speed, that's a deliberate, documented exception (say so
  in `docs/comments-system.md`), not an accident.
- The avatar for owner comments comes from the GitHub account
  (`avatars.githubusercontent.com`) — already allowed by CSP and `next.config.mjs`
  `remotePatterns`.

### 3.10.3 UI behaviour

| State | Comment form | Rendered comment |
| ----- | ------------ | ---------------- |
| Signed out | Today's guest form (name, email, optional handles) | Today's rendering |
| Signed in (owner) | Name/email/avatar **prefilled and locked**; small line "Signed in as @handle · Sign out to comment as a guest"; Turnstile unchanged | **Owner** badge (coss `Badge`) next to the name; avatar from GitHub |
| Signed in (non-admin, if seats are ever raised) | Same prefilled behaviour | No badge (or "Member", your call at build time) |

### 3.10.4 Files touched

`lib/comments/format.ts` (tag + optional segment + parser branches),
`lib/comments/types.ts` (`author.role`), `lib/comments/validate.ts` (session
override, guest shape preserved), `app/api/comments/route.ts` (session lookup +
role assignment), `components/comments/*` (form prefill state, lock, badge),
`hooks/use-commenter-identity.ts` (seed from session when present),
`docs/comments-system.md` (document `PMc2`, the owner semantics, and the
"badge is server-set" guarantee).

**Regression guard:** after Phase 5, every comment created *before* v2.9.0 must still
render with its original name/email/avatar — test by posting one guest comment before
the change and viewing it after.

---

## 3.11 Failure modes & troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| `invalid_origin` / state mismatch on callback | `BETTER_AUTH_URL` or `trustedOrigins` doesn't match the URL you're browsing | Align both (and restart dev after editing `.env.local`) |
| Sign-in succeeds but page still shows signed-out | Cookie cache/hydration race | `<AuthRedirectGuard>` calls `router.refresh()`; verify `sameSite=lax` + no cross-origin dev proxy |
| Registration refuses *you* | `max_users` reached/set to 0, or `signup_enabled=false` | `SELECT * FROM site_settings;` then fix the row |
| `prepare` / “prepared statement already exists” | Pooler + `prepare: true` | Keep `prepare: false` (Phase 1) |
| Connection timeouts on Vercel | Using port 5432 (direct) instead of 6543 (pooler) | Swap the URI; keep `max: 1` |
| Role change invisible for minutes | Expected ≤5-min cookie cache | Sign out/in, or wait; `/admin*` is already instant |
| Admin route 307-loop | Proxy redirecting `/not-authorized` or `/sign-in` for a signed-in admin | Sanitizer loop-guard covers `/sign-in`; ensure `/not-authorized` isn't in the matcher |
| Build fails after flipping `ignoreBuildErrors` | Pre-existing type errors surfacing (Phase 0) | Fix in Phase 0 while the diff is small |

---

## 3.12 File inventory (new + modified, all phases)

**New**

```
proxy.ts
drizzle.config.ts
lib/db/index.ts                      lib/db/schema.ts
lib/env.ts
lib/auth.ts                          lib/auth-client.ts
lib/auth/server.ts                   lib/auth/registration.ts
lib/auth/callback-url.ts
app/api/auth/[...all]/route.ts
app/sign-in/page.tsx                 app/sign-up/page.tsx
app/not-authorized/page.tsx          app/dashboard/page.tsx
app/tools/page.tsx                   ← "coming soon" stub (F1)
app/admin/page.tsx                   app/admin/users/page.tsx
app/admin/settings/page.tsx          app/admin/actions.ts
components/auth/SignInButton.tsx     components/auth/SignInCard.tsx
components/auth/AuthRedirectGuard.tsx components/auth/UserMenu.tsx
components/auth/SignOutButton.tsx    components/auth/AdminOnly.tsx
components/admin/UsersTable.tsx      components/admin/SiteSettingsForm.tsx
docs/database-setup.md               docs/auth-setup.md
docs/admin-guide.md                  docs/env-variables.md
```

**Modified**

```
package.json               next.config.mjs            .env.local.example (new)
lib/config.ts              app/sitemap.ts             lib/nav.ts (new, optional)
components/site/FloatingNavbar.tsx   components/site/AppSidebar.tsx
components/site/MobileBottomNav.tsx  components/home/FooterSection.tsx
# Phase 5 comments bridge:
lib/comments/format.ts     lib/comments/types.ts     lib/comments/validate.ts
app/api/comments/route.ts  hooks/use-commenter-identity.ts
components/comments/*      docs/comments-system.md
```

**Untouched by design:** `lib/notion-cms.ts`, `lib/profile-data.ts`,
`contexts/AccessibilityContext.tsx` (new pages simply consume it). The **guest**
comment path in `lib/comments/*` changes only additively (PMc2 + session override) —
anonymous commenting is a permanent feature.

---

## 3.13 Findings from the Phase 1 build (read before Phase 2)

Discovered while implementing and verifying the schema against the installed
`better-auth@1.7.7` (not from its documentation — from `getAuthTables()` and the
sign-up input parser in `node_modules`), and against a live Postgres 17.

### 3.13.1 `role` must be declared `input: false` — otherwise, self-promotion

The single most important correction to the Phase 2 sketch.

`user.role` is a Better Auth **additional field**, so it has to be declared in
`lib/auth.ts`. The default for `input` is "client may set this", and Better Auth's
own `parseInputData()` copies client-supplied values straight into the insert.
A sign-up request body carrying `{"role": "admin"}` would therefore be written
verbatim — the seat gate would happily admit the site's *only* user as an admin,
and anyone who could reach the sign-up endpoint before the owner did could take
the seat as an admin.

```ts
user: {
  additionalFields: {
    role: {
      type: "string",
      required: true,
      defaultValue: "user",
      input: false,   // ← do not omit. The client must never set this.
    },
  },
},
```

With `input: false`, a request that tries to send `role` is rejected with
`FIELD_NOT_ALLOWED` rather than silently ignored — which is the behaviour we want,
because it makes an attempt visible in the logs.

Promotion stays a deliberate database action:
`UPDATE "user" SET role = 'admin' WHERE email = '…';`

### 3.13.2 Phase 4's `admin()` plugin needs exactly four new columns

Simulated by calling the installed plugin's schema definition through
`getAuthTables()`:

| Table | Column | Notes |
| ----- | ------ | ----- |
| `user` | `banned` | boolean, default `false` |
| `user` | `ban_reason` | text, nullable |
| `user` | `ban_expires` | timestamptz, nullable |
| `session` | `impersonated_by` | text, nullable |

`user.role` is **already satisfied** by Phase 1, so the Phase 4 migration is one
`ALTER TABLE` and needs no data backfill. The plugin also *redeclares* `role`
with `input: false` — and since `getFields()` merges plugin schemas **after**
`additionalFields`, the two declarations do not conflict. Declaring `role` in
Phase 2 and adding the plugin in Phase 4 is safe in either order.

### 3.13.3 Session timestamps are `required` in 1.7.7 — the reference repo is wrong

`verification.created_at` / `updated_at` are `notNull().defaultNow()` in 1.7.7.
The reference implementation (`PMEngineerLK-NextJS`) declares them **nullable**,
which is an older library contract. Copying that schema forward would trip
Better Auth's schema-drift check (below). `lib/db/schema.ts` uses the 1.7.7
contract.

### 3.13.4 There *is* a schema-drift check — but not at runtime

Better Auth 1.7.7 ships `diffSchema()` / `SchemaMismatchError`: every table and
column it writes must exist, and every column it does *not* write must be
nullable or defaulted (or inserts fail with a constraint error that explains
nothing). Its rule is worth keeping in mind:

> A column Better Auth does not write must accept an insert that omits it.

The Drizzle adapter does **not** register this check, so it does not run on
request. It surfaces through the CLI (`auth generate` / `auth migrate`). Practical
consequence: a schema mismatch will not announce itself as a tidy error — it
appears as a failing insert. This is why `lib/db/schema.ts` was verified against
`getAuthTables()` directly, and why it should be re-verified whenever the library
is upgraded.

### 3.13.5 `drizzle-orm` 0.45 wraps driver errors

A Postgres error raised through Drizzle arrives as a `DrizzleQueryError` with the
original `PostgresError` on `.cause`. `e.code` is `undefined`; `e.cause.code` is
`'23505'`. Phase 2 must unwrap before switching on a SQLSTATE — otherwise the
seat-gate race handler (§3.5) will treat a unique violation as an unknown
failure.

```ts
const code = (error as { cause?: { code?: string } })?.cause?.code ?? undefined;
```

### 3.13.6 Migrations are committed

`drizzle/0000_init.sql` plus `drizzle/meta/` are in Git, so a fresh clone runs
`pnpm db:migrate` and has the schema. `db:generate` is only for *changing* the
schema. `drizzle-kit push` is not used at all — it mutates the database without
leaving a migration behind, so Git and the database drift with no record.

---

## 3.14 Findings from the Phase 2 build (read before Phase 3)

Verified against the installed `better-auth@1.7.7` and a live PostgreSQL 17.

### 3.14.1 `session.strategy` is gone — the reference repo's `"jwt"` did nothing

`BetterAuthDBOptions<"session">` in 1.7.7 offers `expiresIn`, `updateAge`,
`disableSessionRefresh`, `deferSessionRefresh`, `storeSessionInDatabase`,
`preserveSessionInDatabase` and `cookieCache` — **there is no `strategy`**.
Sessions live in the `session` table unless `secondaryStorage` is configured.

The reference implementation's comment ("use stateless JWT sessions to reduce
database load on free tier") therefore describes behaviour it never had. The
distinction that *is* real is how the cached cookie is encoded
(`cookieCache.strategy`: `"compact"` | `"jwt"` | `"jwe"`), which is unrelated to
where sessions are stored. §3.2's reasoning stands on its own: database sessions
are what make `UPDATE "user" SET role = 'admin'` take effect without a re-login.

### 3.14.2 An `APIError` thrown from `create.before` becomes a friendly redirect

Traced end to end, because the whole refusal UX depends on it:

```
databaseHooks.user.create.before
  ← internalAdapter.createUser → createWithHooks(data, "user")     [fires]
  → throws APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED" })
  → api/routes/callback.mjs:  catch (e) { if (isAPIError(e) && e.body?.code)
                                redirectOnError(e.body.code, e.body.message) }
  → 302 to <errorCallbackURL>?error=REGISTRATION_CLOSED&error_description=…
```

Two consequences worth keeping:

- **`errorCallbackURL` is load-bearing.** Without it the redirect target defaults
  to `${baseURL}/error` — i.e. `/api/auth/error`, a dead end. `<SignInCard>` must
  send it.
- Returning `false` from the hook also aborts creation, but the callback then
  reads `result.error` off a null user and reports a generic failure, losing the
  reason. Throw, don't return `false`.

### 3.14.3 The session cookie is HMAC-signed — an unsigned token cannot authenticate

The cookie value is `<token>.<HMAC-SHA256(token, secret)>` (`signCookieValue` in
the installed source), and the signature is verified on read. A row inserted
directly into `session` with no signature is refused. Two regression tests now
cover this: an unsigned cookie and a wrongly-signed one both resolve to `null`.

This also means **changing `BETTER_AUTH_SECRET` invalidates every session** — by
design, and worth stating in the docs so it is not mistaken for a bug.

### 3.14.4 `/api/auth/ok` returns `{"ok":true}`

Measured through the real handler, not assumed: `GET /api/auth/ok` → `200
{"ok":true}`. The planning documents said `{"status":"ok"}`; corrected in
`02-implementation-roadmap.md`. Other measured responses: `get-session` → `200
null` when unauthenticated, `sign-out` → `200 {"success":true}`, `sign-in/social`
→ `400 VALIDATION_ERROR` on a bodyless POST.

### 3.14.5 Rate limiting needs a trusted client IP once deployed

With no resolvable client address, Better Auth logs:

> `Rate limiting could not determine a client IP and is falling back to a single
> shared per-path bucket.`

Harmless on localhost, meaningfully wrong behind a proxy — every visitor shares
one bucket. The fix is `advanced.ipAddress` (`ipAddressHeaders` for the host's
header, or `trustedProxies`). Deferred to the deployment checklist on purpose:
adding a guess now would be unverifiable.

### 3.14.6 `trustedOrigins` is the CSRF boundary, and a LAN IP is outside it

`lib/env.ts#trustedOrigins()` returns `BETTER_AUTH_URL` + `NEXT_PUBLIC_SITE_URL`,
deduplicated and stripped of trailing slashes, plus anything in the optional
`AUTH_TRUSTED_ORIGINS`. The default must not be widened: the OAuth callback is
registered against `localhost`, so `http://192.168.x.x:3000` cannot complete a
real sign-in anyway. The env var exists only so a tunnel test does not require
editing source, and the docs tell the operator to revert it.
