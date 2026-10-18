# Deployment

**Nothing in this document has been executed.** v2.9.0 runs on `localhost` only.

It exists because deployment knowledge decays faster than any other kind: it is
held in a dashboard nobody has looked at for six months, and rediscovering it
costs an afternoon. The checklist below is written now, while the reasoning is
fresh, so that deployment day is mechanical.

Read it when you deploy. Nothing here is a prerequisite for running the project
locally, and doing any of it early will make local development worse.

---

## What deploying actually changes

Four things, and the fourth is the one people forget:

1. **The origin becomes public**, so `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`
   and `metadataBase` all have to agree on it.
2. **OAuth needs a second callback**, because GitHub matches the callback URL
   exactly and `localhost` is not it.
3. **The database outlives the process**, so migrations and connection pooling
   start mattering.
4. **The threat model stops being theoretical.** Until now the attack surface was
   the repository. Afterwards it is a running service with a real user and real
   credentials, and [SECURITY.md](../SECURITY.md) has to be rewritten to match.

---

## 1. Before anything else: secure the seat

If the site is public and registration is open with a seat limit of 1, **the first
person to find it owns your admin account.**

```sql
-- Check the current state
SELECT (SELECT count(*) FROM "user") AS used, max_users, signup_enabled
FROM site_settings;
```

If zero accounts exist, register **yourself** first, on the local instance if you
can, and promote yourself in the same sitting:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

Then confirm `/admin` opens for you and registration is closed before the domain
resolves publicly. The details, including what "closed" means for existing
accounts, are in [admin-guide.md](admin-guide.md).

---

## 2. Database

Supabase free tier, per [database-setup.md](database-setup.md). Two changes from
the local setup:

| | Local | Deployed |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://pmweb:…@127.0.0.1:5432/pmweb` | The **transaction pooler** string from Supabase |
| Migrations | `pnpm db:migrate` against the same URL | Run them **before** the first deploy, and keep using the pooler URL |

- [ ] `pnpm db:migrate` has been run against the production database
- [ ] `site_settings` behaves: `SELECT * FROM site_settings;` returns one row
- [ ] The connection string uses the **pooler** host and the transaction port

### The free-tier inactivity pause

A Supabase free project pauses after a period of inactivity. The threshold is
theirs to change, so check the current policy in the dashboard rather than
trusting a number written here.

The consequence is specific and worth understanding: **a paused project makes the
site's sign-in fail, not the site.** Content pages read from Notion and keep
working. If you want the database awake, the usual approach is a scheduled ping —
a GitHub Actions workflow on a `cron:` schedule that issues one trivial query —
and it is worth setting up **at the same time as the first deploy**, because the
failure mode (sign-in stops days after you stopped looking) is easy to misdiagnose
as an auth bug.

---

## 3. Environment variables

Set all of these in the hosting provider's dashboard. The full reference is
[env-variables.md](env-variables.md); this is what *changes*.

| Variable | Local value | Production |
| -------- | ----------- | ---------- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://<your-domain>` — **no trailing slash** |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://<your-domain>` — must match the browser's origin exactly |
| `DATABASE_URL` | local Postgres | the Supabase pooler string |
| `BETTER_AUTH_SECRET` | a local secret | **generate a new one**; never reuse the local value |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | local app | the same app, with a second callback (step 4) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional | required — a public comment form without Turnstile is an open relay to your Notion workspace |
| `AUTH_TRUSTED_ORIGINS` | unset | only if you serve from more than one origin |

```bash
openssl rand -base64 32   # the new BETTER_AUTH_SECRET
```

Generating a fresh secret is not paranoia: it signs session tokens, and a value
that has been sitting in a local `.env.local` — possibly in a backup, possibly in
a screenshot — should not be the one protecting a public site.

---

## 4. GitHub OAuth: add the production callback

The existing app has one callback. GitHub matches callback URLs **exactly**, so
add a second rather than replacing the first — you will want to keep signing in
on localhost.

GitHub → Settings → Developer settings → OAuth Apps → your app:

- **Homepage URL** — add `https://<your-domain>`
- **Authorization callback URL** — GitHub allows **one** callback URL per app.
  To keep both, you need a second OAuth app for production, or you change this
  field each time you switch.

The practical answer: **create a second OAuth app for production.** Two apps,
two callbacks, no editing. The environment variables differ between your local
`.env.local` and the hosting dashboard, which is exactly what they are for.

- [ ] Production OAuth app created
- [ ] Callback set to `https://<your-domain>/api/auth/callback/github`
- [ ] Its id and secret are in the hosting environment, not in the repository
- [ ] Signing in on the deployed site returns you to the page you started from

---

## 5. Origins and metadata

Three values must agree, and a mismatch shows up as a redirect loop or a
misleading `state_mismatch` rather than as a configuration error:

- [ ] `NEXT_PUBLIC_SITE_URL` = `https://<your-domain>`
- [ ] `BETTER_AUTH_URL` = `https://<your-domain>`
- [ ] `metadataBase` resolves correctly — it is derived from `SITE_URL` in
      `lib/env.ts`, so it follows `NEXT_PUBLIC_SITE_URL` automatically

Then check the derived files with a browser, not with a database client:

- [ ] `https://<your-domain>/robots.txt` — `Sitemap:` points at the real domain
- [ ] `https://<your-domain>/sitemap.xml` — absolute URLs use the real domain
- [ ] `https://<your-domain>/rss.xml` — same
- [ ] A shared link previews with the right title, description and image

**`prasadm.vercel.app` must not appear in any of them.** It belongs to a previous,
inactive project. Nothing in this repository references it; if it turns up, some
environment variable is still pointing at the old default.

### `AUTH_TRUSTED_ORIGINS`

Only needed when you serve from more than one origin — a custom domain plus a
provider preview URL, for instance. Comma-separated:

```bash
AUTH_TRUSTED_ORIGINS=https://preview-abc123.example.vercel.app
```

**Decide the preview-deployment policy deliberately.** Every preview URL is a new
origin, and each one you trust widens the CSRF boundary. A site with one owner
does not need preview deployments at all; if you keep them, disable OAuth on
preview environments rather than trusting `*.vercel.app` wholesale.

---

## 6. Content-Security-Policy

The CSP in `next.config.mjs` currently carries `'unsafe-inline'` and
`'unsafe-eval'` in `script-src`. Both are local-development concessions
(`'unsafe-eval'` is required by the dev overlay and by WebAssembly for Mermaid
and Shiki). Tightening it is a **deployment-time** job because it can only be
verified against a running production build.

- [ ] Build and run in production mode locally (`pnpm build && pnpm start`)
- [ ] Remove `'unsafe-eval'` and confirm Mermaid, Shiki and the dev tooling still
      work — they may need `'wasm-unsafe-eval'` alone
- [ ] Move the inline-script allowances to a nonce or a hash if `'unsafe-inline'`
      can be dropped; if it cannot, document why in the config
- [ ] Re-read the `img-src` / `connect-src` / `script-src` host lists and delete
      anything the site does not actually use. An allow-list is only worth
      having if it is short enough to read.
- [ ] Verify the browser console is free of CSP violations on every route

The `images.contentSecurityPolicy` alongside `dangerouslyAllowSVG` was added in
Phase 6 and needs nothing further — but if you ever remove it, **remove
`dangerouslyAllowSVG` with it.** An SVG can carry script, and those two settings
are a pair.

---

## 7. Supabase keep-alive

Only if the inactivity pause in step 2 matters to you.

- [ ] A scheduled workflow issues one trivial query on `cron:`
- [ ] It uses a `DATABASE_URL` secret, not the production one — a read-only role
      is enough and limits what a leaked workflow token can do
- [ ] It has run at least twice and the project has stayed awake

---

## 8. GitHub repository settings

These are referenced by the governance documents and by nothing else, which is
why they are easy to skip and why `SECURITY.md` is wrong until they are done.

- [ ] **Private vulnerability reporting: enabled.** [SECURITY.md](../SECURITY.md)
      tells researchers to use it; if it is off, that instruction is a dead end.
- [ ] **Branch protection on `main`** — require a pull request and the CI check
      before merging. The repository is not deployed from a branch, but `main`
      should still be the revision that passed.
- [ ] **CodeQL / code scanning: enabled** (default setup). `RULES.md` §5 is
      written as if it is enforcing those rules.
- [ ] **Dependabot**: security updates on, plus a grouped monthly version bump.
      Accept the monthly PR only after lint, typecheck and build pass.
- [ ] **Repository description and topics** — `nextjs`, `portfolio`,
      `notion-cms`, `better-auth`, `drizzle-orm`, `tailwindcss`, `typescript`.
- [ ] **Social preview image** — one 1280×640 card, so a shared link looks
      deliberate.

---

## 9. After the first deploy

Run this by hand, in a browser, on the deployed URL. It is the shortest set that
catches the failures which are invisible from the build log.

- [ ] A content page loads, with real images and a working table of contents
- [ ] `/robots.txt`, `/sitemap.xml` and `/rss.xml` serve and use the real domain
- [ ] Signing in returns you to the page you started from — not the home page
- [ ] Signing out from an article leaves you on that article
- [ ] `/admin` opens for the owner and redirects a signed-out visitor to
      `/sign-in` with the right callback
- [ ] A second GitHub account is refused while the seat limit is 1, with the
      "Registration is closed" message rather than an error
- [ ] Comments post, and they appear in Notion
- [ ] A comment left while signed in shows the **Owner** badge
- [ ] The browser console is clean on `/`, an article, `/sign-in` and `/admin`
- [ ] [SECURITY.md](../SECURITY.md) has been updated: it currently says the site
      runs locally, and that is no longer true

---

## Rollback

The database is the only thing that is hard to reverse; the application is a
redeploy of the previous revision.

- **Application** — roll back to the previous deployment from the hosting
  provider's dashboard.
- **Schema** — migrations are forward-only. Take a Supabase backup before
  deploying a release that includes one. v2.9.0's schema is a single migration
  (`drizzle/0000_init.sql`) and can be recreated by dropping the five tables.
- **OAuth** — deleting the production callback URL immediately stops new
  sign-ins. Existing sessions survive until they expire or the secret rotates.
- **Lockout** — if you lose access to `/admin`, the recovery SQL is in
  [admin-guide.md](admin-guide.md). It works without the application running.
