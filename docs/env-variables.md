# Environment variables

Every variable this project reads, what happens when it is missing, and where
the value comes from. Copy `.env.local.example` to `.env.local` and fill it in;
`.env.local` is git-ignored and must never be committed.

This file is the **index**. The setup guides are the detail: each variable below
links to the one page that explains how to obtain it.

---

## The three that are required

Nothing in the app runs without these. They are checked by
`assertServerEnv()` in `lib/env.ts`, which reports **every** missing key in one
message rather than one per attempt — a fresh clone should be one edit away from
working.

| Variable | What it is | Where the value comes from |
| -------- | ---------- | -------------------------- |
| `DATABASE_URL` | PostgreSQL connection string. | [database-setup.md](database-setup.md) |
| `BETTER_AUTH_SECRET` | Signs session tokens. Minimum 32 characters. | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The origin the server is reached on. No trailing slash. | `http://localhost:3000` |

```bash
openssl rand -base64 32
```

Three rules that exist because breaking one causes a bug that is hard to find
afterwards:

- **No fallback secrets.** A missing `BETTER_AUTH_SECRET` stops the process. It
  does not fall back to a default — a default would be identical on every clone,
  which means anyone who has read this repository could mint a valid session
  cookie for your site.
- **Never reuse a secret from another project.** It signs session tokens, so
  reusing one means a compromise elsewhere is a compromise here.
- **`BETTER_AUTH_URL` must match the origin in the browser address bar.** A
  trailing slash is rejected outright, because `http://localhost:3000/` and
  `http://localhost:3000` are different origins to a comparison and the same
  origin to a human. That mismatch is a fifteen-minute bug.

---

## Sign-in (optional)

Sign-in is entirely optional. With neither variable set the GitHub provider is
not registered, the sign-in button is hidden, and every public page still works.

| Variable | What it is | Where the value comes from |
| -------- | ---------- | -------------------------- |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client id. | [auth-setup.md](auth-setup.md) §1 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret. | [auth-setup.md](auth-setup.md) §1 |

**All or nothing.** Setting exactly one of the pair is treated as a typo and
stops the process with an explanation. The alternative — building a provider with
placeholder credentials and letting it fail at the end of the OAuth round trip —
turns a configuration mistake into a confusing runtime error, which is what the
reference implementation did and why this one does not.

The OAuth callback URL is `http://localhost:3000/api/auth/callback/github`.

---

## Variables with an intended override

| Variable | Default | When to set it |
| -------- | ------- | -------------- |
| `AUTH_TRUSTED_ORIGINS` | *(unset)* | Extra origins allowed to start an auth flow, comma-separated. See below. |
| `NOTION_API_VERSION` | `2022-06-28` | Only when Notion deprecates that version. |

### `AUTH_TRUSTED_ORIGINS`

better-auth refuses to start an auth flow from an origin it does not recognise,
which is its CSRF boundary. By default the allow-list is exactly
`BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL`, deduplicated.

**A LAN address such as `http://192.168.1.20:3000` is deliberately not allowed.**
Reaching the dev server from another device is refused by design, because the
GitHub OAuth callback is registered against `localhost` — the flow would start
and then fail on the way back, which is a worse experience than not starting.

To test from a phone, point a tunnel at the dev server and update the OAuth app's
callback URL to match, then remove it afterwards:

```bash
AUTH_TRUSTED_ORIGINS=https://random-words.trycloudflare.com
```

---

## Content (optional)

Without Notion credentials the site builds and serves every non-content page.
The content routes render their "page isn't ready to serve" state rather than
failing.

| Variable | What it is | Where the value comes from |
| -------- | ---------- | -------------------------- |
| `NOTION_API_KEY` | Integration token with read access to the databases. | [notion-cms-setup.md](notion-cms-setup.md) |
| `NOTION_PROJECTS_ID` | Database id for projects. | Same — the id is in the database URL |
| `NOTION_BLOG_ID` | Database id for blog posts. | " |
| `NOTION_ARTICLES_ID` | Database id for articles. | " |
| `NOTION_TUTORIALS_ID` | Database id for tutorials. | " |
| `NOTION_GLOSSARY_ID` | Database id for glossary terms. | " |
| `NOTION_AUTHORS_ID` | Database id for the author list. | " |
| `NOTION_PUBLISHED_STATUS` | Status name that counts as published. | Defaults to `Published` |

A database whose id variable is unset is simply absent from the site — there is
no error, and the nav entry for it still works and shows its empty state.

---

## Comments (optional)

Comments are backed by Notion's comment API, so they need `NOTION_API_KEY` as
well. Without the Turnstile pair the widget does not render and the API rejects
posts with a clear message rather than accepting unverified ones — see
[comments-system.md](comments-system.md).

| Variable | What it is |
| -------- | ---------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key. Public by design. |
| `TURNSTILE_SECRET_KEY` | Turnstile secret. **Server-only.** |

`NEXT_PUBLIC_` prefixes are not decoration: Next.js inlines anything with that
prefix into the client bundle. A value that must not be public does not get the
prefix, and `TURNSTILE_SECRET_KEY` is the example.

---

## Notifications (optional)

| Variable | What it is |
| -------- | ---------- |
| `TELEGRAM_TOKEN` | Bot token for the contact-form notification. |
| `TELEGRAM_CHAT_ID` | Chat to notify. |

Unset means the contact form still works and simply does not notify anyone.

---

## Public origin

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Absolute origin for canonical URLs, `sitemap.xml`, `robots.txt` and the RSS feed. |

`NEXT_PUBLIC_SITE_URL` is inlined into the client bundle, which is correct: a
site's own origin is public. It is also added to the auth allow-list, so setting
it to an address you are not actually serving from will refuse sign-in attempts
that arrive on that address.

---

## Where each rule is enforced

| Behaviour | File |
| --------- | ---- |
| Required-key check, secret length, trailing slash | `lib/env.ts` |
| GitHub all-or-nothing, trusted origins | `lib/env.ts` |
| Absolute site origin for metadata and feeds | `lib/env.ts` |
| Seat limit and registration toggle — **database, not environment** | `site_settings` table, [admin-guide.md](admin-guide.md) |

That last row is deliberate. The number of accounts the site allows is *state*,
not configuration: it changes while the site is running, an administrator changes
it from `/admin/settings`, and it is recorded with who changed it. An environment
variable cannot do any of those things, which is why there is no `AUTH_MAX_USERS`.
