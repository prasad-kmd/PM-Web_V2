# Auth setup

**Who this is for:** anyone enabling sign-in on a fresh clone, or debugging why a
sign-in did not work.
**What you need:** the database from [`database-setup.md`](./database-setup.md)
already migrated, a GitHub account, and a `.env.local`.

This is the operational half of the design. The reasoning — why database
sessions rather than JWT, why the seat gate takes a row lock, how the redirect
chain is built — is in
[`planning/03-auth-architecture.md`](./planning/03-auth-architecture.md).

**The short version of the model:** this is a personal archive, not a sign-up
site. GitHub is the only provider, there is no e-mail sign-in, and **one account
may exist** by default. The first person to sign in takes the seat and
registration then closes by itself.

---

## 1. Create the GitHub OAuth app

GitHub OAuth needs no verification review and no privacy-policy URL, which is why
it is the only provider here. (Google requires an app-verification process for
non-test users; an e-mail provider would require a paid sending domain.)

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth
   App**.
2. Fill in:

   | Field | Value |
   | ----- | ----- |
   | Application name | anything, e.g. `PM-Web_V2 (local)` |
   | Homepage URL | `http://localhost:3000` |
   | Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

3. **Register application**, then **Generate a new client secret**.

> The callback URL must match exactly — scheme, host, port and path. A trailing
> slash, `127.0.0.1` instead of `localhost`, or a different port produces
> `redirect_uri_mismatch` from GitHub before anything reaches this app.

Copy both values into `.env.local`:

```bash
GITHUB_CLIENT_ID=Ov23li...
GITHUB_CLIENT_SECRET=...
```

### What happens if you skip this step

Nothing breaks. With **both** variables empty the GitHub provider is simply not
registered: the site builds, every public page works, and sign-in is unavailable.
`<SignInCard>` disables its button and says so, rather than sending the reader to
a broken GitHub page.

Setting **exactly one** of the two is treated as a mistake and stops the server
with a message naming the missing variable — a half-configured provider would
otherwise fail confusingly at the *end* of the OAuth round trip.

---

## 2. Environment variables

All three of these are required before `lib/auth.ts` will load. If any is
missing, the process stops with a message listing every one that is absent — not
one per attempt.

| Variable | Value here | Notes |
| -------- | ---------- | ----- |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Signs session cookies. **≥ 32 characters**, checked at startup. Never reuse one between projects — anyone who knows it can mint a session for any account. Changing it invalidates every existing session. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Must equal the origin you browse **and** the host in the OAuth app's callback. No trailing slash. |
| `DATABASE_URL` | Supabase pooler, port 6543 | See [`database-setup.md`](./database-setup.md). |

Optional:

| Variable | Default | Use |
| -------- | ------- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Site origin, used by metadata, canonical URLs, RSS and `trustedOrigins`. |
| `AUTH_TRUSTED_ORIGINS` | *(unset)* | Comma-separated extra origins. See §6. |

---

### The scope requested from GitHub

`read:user user:email` — profile and verified e-mail addresses, nothing else. No
repository access is requested, so a leaked session cannot touch your code.
(Measured from the authorization URL.)

## 3. How sessions work

Sessions are stored in the `session` table and referenced by an httpOnly cookie.
A signed cookie cache (`session_data`) avoids a database read on most requests.

| Setting | Value | Why |
| ------- | ----- | --- |
| `expiresIn` | 7 days | |
| `updateAge` | 1 day | Refresh the row at most daily, not on every request. |
| `cookieCache.maxAge` | 5 minutes | How long a `role` change can take to appear on ordinary pages. |

### The 5-minute caveat, stated plainly

`GET /admin` reads the session with `disableCookieCache: true`, so a promotion
made with SQL takes effect on the **next request**. Ordinary pages — including
the Admin link in the user menu — may show a role that is up to five minutes
stale. Signing out and back in forces the change immediately.

### A note on `session.strategy`

The reference implementation set `strategy: "jwt"` with a comment about reducing
database load. **That option no longer exists** in better-auth 1.7.7 and did
nothing: sessions are written to the database regardless. Setting it here would
be cargo cult; the `session` table is the source of truth. (What *is* configurable
is how the cached cookie is encoded — `cookieCache.strategy`, `"compact"` by
default.)

---

## 4. How "return to the page you came from" works

Signing in on `/about` returns the reader to `/about`. Five hops, all passing one
sanitised value:

```
/about                                  click "Sign in"
  → /sign-in?callbackUrl=%2Fabout        <SignInButton> sets the destination
  → github.com/…                         authClient.signIn.social({ callbackURL })
  → /api/auth/callback/github            better-auth sets the session cookie
  → /about                               redirected back
```

Three things make this reliable, and all three were missing in the reference
implementation:

1. **Every entry point passes the current path.** `<SignInButton>` reads
   `usePathname()` + `useSearchParams()`. Nothing navigates with a bare
   `window.location.href = "/sign-in"`.
2. **The destination is sanitised at every hop** by `sanitizeCallbackUrl()` in
   `lib/auth/callback-url.ts` — the single implementation, and the allowlist. A
   hostile value (`https://evil.example`, `//evil.example`, `%2F%2Fevil.example`,
   `/api/auth/…`, `/sign-in`) becomes `/`, so an open redirect is not possible.
   Sign-in loops are prevented the same way.
3. **There is no silent default that looks like success.** An absent
   `callbackUrl` falls back to `/`, so a mistake is visible rather than disguised
   as "worked, wrong destination".

---

## 5. The seat gate

`site_settings` holds a single row that governs how many accounts may exist.

```sql
-- seats used, and the limits
SELECT (SELECT count(*) FROM "user") AS used, max_users, signup_enabled
FROM site_settings;

-- allow three accounts instead of one
UPDATE site_settings SET max_users = 3, updated_at = now() WHERE id = 'primary';

-- stop new registrations without removing anybody
UPDATE site_settings SET signup_enabled = false, updated_at = now() WHERE id = 'primary';
```

Rules that matter:

- **Existing accounts always sign in.** The limit is checked only when a *new*
  row is about to be created, so even `max_users = 0` cannot lock you out. (The
  settings form refuses zero — a site with no accounts has no owner — but SQL will
  accept it, and the guarantee still holds if you go that way.)
- **On a fresh database the row does not exist yet** — there is no seeding step.
  The first sign-up creates it via `INSERT … ON CONFLICT DO NOTHING`, and until
  then the defaults are one seat and registration open.
- **Two simultaneous first sign-ins cannot both win.** The count is read under
  `SELECT … FOR UPDATE` on the settings row, so the second transaction waits,
  re-counts and is refused. See `registration.ts`.
- **Deleting every user re-opens registration.** The gate compares a live count
  against `max_users`, so it closes and re-opens on its own.

### Becoming an administrator

`role` is never set by the client — see the note below. Promotion is deliberate:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

Then reload `/admin`. No sign-out required (that route bypasses the cookie cache).

> **Why the client cannot do this.** `role` is declared with `input: false`. Better
> Auth's default would let a sign-up request body set any additional field, so
> `{"role": "admin"}` would be written verbatim — meaning whoever reached the
> sign-up endpoint first could have claimed the single seat *as an admin*. With
> `input: false` such a request is rejected outright. Details:
> `planning/03-auth-architecture.md` §3.13.1.

### Changing the limit without SQL

`/admin/settings` edits both fields from the browser, records who made the change
in `site_settings.updated_by`, and revalidates `/sign-up` so the page cannot show
a stale open/closed state.

Promotion to `admin` stays SQL-only by design — that is what makes self-promotion
impossible. Full walkthrough, including the SQL equivalents for when a terminal is
already open: [`docs/admin-guide.md`](admin-guide.md).

---

## 6. Local-only constraints

This repository is not deployed. These are deliberate, not oversights:

| Constraint | Why |
| ---------- | --- |
| `trustedOrigins` is `http://localhost:3000` only | Better Auth rejects an origin that is not listed — that is the CSRF boundary. |
| Visiting the dev server from a phone via LAN IP (`http://192.168.x.x:3000`) | **Refused by design.** The OAuth callback is registered against `localhost`, and `localhost` on a phone is the phone. |
| `prasadm.vercel.app` is never the origin | It belongs to the previous, inactive site. Metadata and RSS default to `http://localhost:3000` instead. |

> **One thing that changes when you deploy.** Better Auth's rate limiter logs
> `Rate limiting could not determine a client IP ... falling back to a single
> shared per-path bucket` whenever the client address cannot be resolved — which
> is every request until the runtime supplies a trusted header. It is harmless
> locally (your own browsing is the only traffic), but on a deployed site it
> means all visitors share one bucket. The fix belongs in `advanced.ipAddress`:
> set `ipAddressHeaders` to the header your host sets (`x-forwarded-for` on
> Vercel) or `trustedProxies` for the fronting proxy. Revisit this in the
> deployment checklist.

To test from another device, use a tunnel and update **both** sides:

```bash
cloudflared tunnel --url http://localhost:3000
```

```bash
# .env.local — add the tunnel origin, keep the default
AUTH_TRUSTED_ORIGINS=https://random-words.trycloudflare.com
```

…then set the OAuth app's callback URL to
`https://random-words.trycloudflare.com/api/auth/callback/github`. **Revert both
afterwards** — a stale trusted origin is a real (if small) hole.

## 7. Error catalogue

The sign-in card turns `?error=` into a sentence via
`lib/auth/error-messages.ts`. Only *known* codes get copy rendered; anything else
that is not shaped like a code is replaced by a generic message rather than
echoed back, so a crafted link cannot put arbitrary text on the page. These are
the codes you will actually meet:

| `?error=` | Meaning | What to do |
| --------- | ------- | ---------- |
| `access_denied` | Cancelled on GitHub, or the org blocks the app. | Nothing — the form is still usable. |
| `REGISTRATION_CLOSED` | The seat gate refused a **new** account. | Expected once the owner has registered. If this is wrong, raise `max_users` (§5). |
| `state_not_found` | No OAuth state on record — the flow was abandoned for over 10 minutes on GitHub's screen, or the state cookie was never stored. *(Measured: this is the code for a missing state, and the redirect target is `/api/auth/error` unless `errorCallbackURL` was sent.)* | Retry from `/sign-in`. If it repeats, cookies are being blocked. |
| `state_mismatch` | The returned state did not match the stored one — a tampered or cross-site attempt. | Retry. Repeats mean something is rewriting the state; do not ignore it. |
| `invalid_code` | The code was already used, or the pair was reused. | Retry. |
| `redirect_uri_mismatch` | GitHub-side. The app's callback URL differs from `BETTER_AUTH_URL` + `/api/auth/callback/github`. | Fix the callback URL in the GitHub app. |
| `unable_to_get_user_info` | GitHub did not return a profile — usually a revoked token or a private e-mail with an over-restrictive scope. | Recreate the client secret, retry. |

---

## 8. Troubleshooting

| Symptom | Cause |
| ------- | ----- |
| `Missing required environment variables: …` on startup | `.env.local` is absent or incomplete. The message names every missing key. |
| Sign-in button is disabled and says no provider is configured | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are both empty. That is the documented fallback, not a failure. |
| `GITHUB_CLIENT_SECRET is not set` on startup | Exactly one GitHub variable is set. Fill in the other, or remove both. |
| Signed in, then immediately signed out | `BETTER_AUTH_SECRET` changed between runs — every existing session is invalidated by design. |
| Redirected to `/api/auth/error` instead of the sign-in card | The client did not send `errorCallbackURL`. It must be `/sign-in`. |
| Session exists in the database but requests are unauthenticated | The cookie is not being sent: check that the browser is on `localhost:3000` (not `127.0.0.1`) with cookies allowed. |
| `prepared statement "s1" already exists` | `DATABASE_URL` is not the transaction pooler. See `database-setup.md` §2. |
| Everything 500s right after changing `.env.local` | Restart `pnpm dev`. `.env.local` is read at startup. |

---

## 9. Verifying the setup

Without a browser:

```bash
curl -s http://localhost:3000/api/auth/ok
# {"ok":true}
```

(The shape is better-auth's, not ours — it is `{"ok":true}`, not
`{"status":"ok"}`. The planning documents guessed the latter; this line is the
measured output.)

In a browser, the acceptance test is the one from the roadmap:

1. Go to `/about`.
2. Click **Sign in**, then authorise on GitHub.
3. You should land back on **`/about`** — not `/dashboard`, not `/sign-in`.
4. `SELECT id, email, role FROM "user";` shows exactly one row, `role = user`.

Then confirm the gate:

```sql
UPDATE site_settings SET max_users = 0, updated_at = now() WHERE id = 'primary';
```

Sign in with a **different** GitHub account: expect the registration-closed
message, and no second row in `user`. Restore with
`UPDATE site_settings SET max_users = 1, updated_at = now() WHERE id = 'primary';`

### Signing out of a bad state

```sql
-- remove one account entirely (sessions and accounts cascade)
DELETE FROM "user" WHERE id = '<id>';

-- or wipe all auth data and start over; registration re-opens automatically
TRUNCATE "user", session, account, verification CASCADE;
```

`site_settings` is deliberately not included — seat configuration survives a
wipe. See `database-setup.md` §7.

---

## 10. The pages, and what guards them

Phase 3 built the five screens and the entry points around them. Setup is not
required for any of them beyond §1–§3 — this section is the map.

### Routes

| Route | File | Gate | `robots` |
| ----- | ---- | ---- | -------- |
| `/sign-in` | `app/sign-in/page.tsx` | none — public | `index: false, follow: false` |
| `/sign-up` | `app/sign-up/page.tsx` | none; body depends on the seat gate | `index: false, follow: false` |
| `/not-authorized` | `app/not-authorized/page.tsx` | none — it *is* the refusal | `index: false, follow: false` |
| `/dashboard` | `app/dashboard/page.tsx` | `requireUser("/dashboard")` | `index: false, follow: false` |
| `/admin` | `app/admin/page.tsx` | `requireAdmin("/admin")` | `index: false, follow: false` |
| `/tools` | `app/tools/page.tsx` | none — a public stub | `index: false, follow: true` |

Every one of them is listed in `NON_INDEXABLE_ROUTES` (`lib/nav.ts`), which
`app/sitemap.ts` filters on. A page that sets `index: false` is a page that is
absent from the sitemap by construction, and `verification/nav.test.mjs` asserts
the two stay in step.

`/tools` is the deliberate exception on `follow`: it is a thin "coming soon"
page, so it should not rank, but the links pointing at it should still pass
signal.

### Two gates, on purpose

`proxy.ts` runs first and gives a reader a clean redirect before any page work
happens. It is **not** the security boundary — anything reaching a route handler
or a server component directly skips it entirely. So `/dashboard` and `/admin`
call `requireUser` / `requireAdmin` themselves, which is what the dead-link check
in the test suite enforces.

| | `proxy.ts` | `requireUser` / `requireAdmin` |
| --- | --- | --- |
| Reads the session by | `fetch("/api/auth/get-session")` | `auth.api.getSession()` |
| Runtime | edge-safe — no database driver | Node |
| Purpose | a redirect that arrives before the page renders | the actual gate |

The proxy reads over HTTP rather than importing `lib/auth.ts`, which would pull
`postgres.js` and Drizzle into the edge bundle. If that fetch fails, the reader
is treated as signed out: somebody who cannot be *proved* to have a session does
not get `/dashboard` or `/admin`. The cost is that an auth outage looks like
being signed out, which is the correct direction to fail.

**`/admin` bypasses the 5-minute cookie cache.** The proxy passes
`disableCookieCache=true` for that scope, and `requireAdmin` calls
`getFreshSession()`. So promoting yourself with

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

grants access on the very next request, not up to five minutes later.

### Getting to the sign-in page

`<SignInButton>` (`components/auth/SignInButton.tsx`) is the only sanctioned way
to send a signed-out reader to sign in. It reads the current location itself and
sanitises it, so no call site can forget the destination — which is precisely how
the reference implementation lost it. It appears in all four navigation surfaces:

| Surface | File |
| ------- | ---- |
| Floating navbar (desktop) | `components/site/FloatingNavbar.tsx` |
| Sidebar rail | `components/site/AppSidebar.tsx` |
| Mobile dock | `components/site/MobileBottomNav.tsx` |
| Footer | `components/home/FooterSection.tsx` |

The mobile dock is the one exception to "it reads the full location": it builds
its href from `usePathname()` alone. The dock lives in `SiteShell`, which wraps
every page, so a `useSearchParams()` there would need a Suspense boundary around
the entire site chrome and would force static pages to client-render their
navigation. The path survives; a query string may be dropped. Everywhere else the
full location — path *and* query — is preserved.

`verification/nav.test.mjs` fails the build if any file outside the registry and
the sanitiser hand-writes a `/sign-in` link.

### Already signed in, and back on `/sign-in`

Two mechanisms, because they cover different cases. `proxy.ts` catches a fresh
navigation to `/sign-in` or `/sign-up` and forwards to the destination before the
page renders. `<AuthRedirectGuard>` catches what the proxy cannot see: the back
button, a second tab left on the form, a restored session — none of which produce
a document request. It calls `router.replace()` and then `router.refresh()`, the
refresh because the destination may sit in the client router cache from before
this reader was signed in.

### Signing out

`SignOutButton` and the account menu both use `hooks/use-sign-out.ts`. Signing
out does **not** navigate: the reader stays exactly where they are and the page
re-renders without their session. The single exception falls out of the gate
rather than the button — signing out on `/dashboard` leaves them on a protected
URL for one request, and `proxy.ts` then redirects to `/sign-in`. If you are
signed out on a protected page, that is what you should see.

### The account menu

`components/auth/UserMenu.tsx` renders three states: a fixed-size placeholder
while the session resolves (so the nav does not reflow), a sign-in button when
signed out, and an avatar menu when signed in. The menu links to `/dashboard`,
to `/admin` **only when `role === "admin"`**, and to sign out. `role` is typed
rather than cast because `lib/auth-client.ts` registers
`inferAdditionalFields<typeof auth>()`.

Note the menu items navigate through `onSelect` rather than wrapping an `<a>`:
this dropdown's items are their own `role="menuitem"` elements and the primitive
disallows `asChild`, which is what keeps roving focus, Escape and typeahead
working.

### Errors on the sign-in card

`lib/auth/error-messages.ts` maps `?error=` codes to a sentence. It renders copy
for known codes only. An unmapped value that is not shaped like a real code is
replaced by a generic message rather than echoed — a link to
`/sign-in?error=Your+account+is+locked%2C+call+1-800-…` must not render
attacker-authored text wearing this site's styling.
