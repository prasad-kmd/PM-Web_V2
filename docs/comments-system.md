# Comments System

Guest comments on Notion-backed content pages, ported from
[PMEngineerLK-NextJS](https://github.com/prasad-kmd/PMEngineerLK-NextJS) and
adapted for a site with **no sign-in**.

Comments are stored as native Notion comments on the page itself — no database,
no new infrastructure.

---

## What a visitor sees

A "Join the discussion" card at the end of every
`articles | blog | tutorials | projects | glossary` detail page. Clicking it
opens:

| Viewport | Component         | Behaviour                     |
| -------- | ----------------- | ----------------------------- |
| ≥ 768px  | coss **`Sheet`**  | slides in from the **right**  |
| < 768px  | coss **`Drawer`** | slides up from the **bottom** |

Both containers render the same `CommentsPanelBody`, so state and behaviour are
identical; only the shell differs. The switch is driven by the existing
`hooks/use-mobile.ts`.

To comment, a visitor supplies **name**, **email**, and optionally a
**GitHub / LinkedIn / X** handle. No account is created.

---

## Protection layers

Applied in this order on `POST /api/comments`:

| #   | Layer             | Implementation                   | Failure mode               |
| --- | ----------------- | -------------------------------- | -------------------------- |
| 1   | Same-origin check | `Origin`/`Referer` vs `Host`     | 403                        |
| 2   | Burst rate limit  | 3 / 60s per IP                   | 429                        |
| 3   | Daily rate limit  | 12 / 24h per IP                  | 429                        |
| 4   | Schema validation | `zod`                            | 400 `validation`           |
| 5   | Bot check         | Cloudflare Turnstile             | 400 `turnstile`            |
| 6   | Honeypot          | hidden `website` field           | 400 `validation` (generic) |
| 7   | Disposable email  | `fakeout` (~5k domain blocklist) | 400 `temp_mail`            |
| 8   | Profanity         | `obscenity` + English dataset    | 400 `profanity`            |

Layers 2–3 are **in-memory**, so they are per serverless instance and reset on
cold start. That is intentional — Turnstile plus the honeypot are the real bot
gate. If you need hard limits across instances, replace `recordHit()` in
`lib/comments/rate-limit.ts` with an Upstash/KV call; the `RateLimitResult`
shape is already designed for it.

The honeypot rejection deliberately returns a generic `"Comment rejected."`
with no field names, so a bot cannot learn which input exposed it.

---

## Avatars

`lib/comments/avatar.ts` probes the supplied handles **server-side**, in the
order GitHub → LinkedIn → X, and stores the first image URL that resolves
alongside the comment in Notion.

| Platform    | Method                                                                                               | Reliability                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| GitHub      | `https://github.com/{user}.png` 302 → `avatars.githubusercontent.com/u/{id}` (cache-buster stripped) | High. 404 = account does not exist.                                   |
| X / Twitter | `api.fxtwitter.com/{handle}` → `user.avatar_url`. Stock placeholder avatars are discarded.           | High.                                                                 |
| LinkedIn    | `unavatar.io/linkedin/{user}?fallback=false`                                                         | **Low.** LinkedIn blocks anonymous profile lookups, so expect misses. |

Everything fails open: if nothing resolves the UI draws a deterministic
initials avatar (hue derived from the name via FNV-1a) with no network request.

Avatar URLs are constrained to an allowlist of hosts
(`ALLOWED_AVATAR_HOSTS`), which are also in the `img-src` CSP directive in
`next.config.mjs`. Avatars are rendered with a plain `<img>` rather than
`next/image`, so no `remotePatterns` entries are needed.

---

## How a comment is stored

Notion has no author metadata for integration-created comments, so attribution
is folded into the text:

```
[PMc1|Prasad K|hello@prasadk.xyz|github:prasad-kmd|https://avatars.githubusercontent.com/u/102537177]: Great write-up.
```

`parseComment()` recognises three shapes:

1. **`PMc1|…`** — this system.
2. **`Name|userId|avatar`** — legacy PMEngineerLK-NextJS comments, still render.
3. **Anything else** — written directly in Notion; rendered as "via Notion".

Pipe, bracket and newline characters in names are escaped. Bodies are
truncated so meta + body always fit Notion's 2000-character cap.

Set `COMMENTS_STORE_EMAIL=false` to store `sha256:<16 hex chars>` instead of
the raw address.

---

## Identity cookie

`pm_commenter` — URL-encoded JSON `{v,n,e,g,l,t}`, 180 days, `Path=/`,
`SameSite=Lax`, `Secure` in production.

Deliberately **not** HttpOnly: the form must read it on the client to prefill.
It is therefore never trusted — the server re-validates name, email and handles
on every POST. A returning visitor can overwrite it with **Edit**, or wipe it
with **Not you?** (`DELETE /api/comments/identity`).

---

## API

```
GET    /api/comments?pageId=…&cursor=…   list comments (paginated, 25/page)
POST   /api/comments                     create a comment
DELETE /api/comments/identity            clear the identity cookie
```

`POST` body:

```json
{
  "pageId": "…32-hex-notion-id…",
  "content": "…",
  "name": "…",
  "email": "…",
  "github": "…", // optional, may be a full profile URL
  "linkedin": "…", // optional
  "twitter": "…", // optional
  "website": "", // honeypot, must stay empty
  "turnstileToken": "…"
}
```

---

## Files

**New — server**

```
lib/comments/types.ts                shared types
lib/comments/config.ts               env + limits
lib/comments/format.ts               encode/decode the Notion comment format
lib/comments/profanity.ts            obscenity matcher
lib/comments/disposable-email.ts     fakeout wrapper
lib/comments/rate-limit.ts           sliding-window limiter
lib/comments/turnstile.ts            siteverify
lib/comments/avatar.ts               platform avatar resolution
lib/comments/validate.ts             zod schema + orchestration
lib/comments/identity-cookie.ts      cookie helpers (server + client)
lib/comments/request-context.ts      client IP / origin
app/api/comments/route.ts            GET + POST
app/api/comments/identity/route.ts   DELETE
scripts/test-comments.mts            runtime smoke test (22 checks)
```

**New — client**

```
components/ui/sheet.tsx              coss (unmodified)
components/ui/drawer.tsx             coss (unmodified)
components/ui/scroll-area.tsx        coss (unmodified)
components/ui/spinner.tsx            coss (unmodified)
components/comments/comments-panel.tsx   Sheet/Drawer switch + trigger
components/comments/comment-form.tsx     composer
components/comments/comment-list.tsx     feed + infinite scroll
components/comments/comment-item.tsx     one comment
components/comments/identity-fields.tsx  name/email/handles
components/comments/comment-avatar.tsx   avatar + initials fallback
components/comments/turnstile-widget.tsx Turnstile
hooks/use-commenter-identity.ts          cookie-backed identity state
```

**Modified**

```
components/notion/ContentDetailPage.tsx   mounts <CommentsPanel/>
lib/notion-cms.ts                         exports createNotionClient()
app/globals.css                           --destructive-foreground tokens (coss)
next.config.mjs                           img-src CSP for avatar hosts
package.json                              deps + test:comments script
tsconfig.json                             excludes scripts/ from typecheck
```

### Note on the coss install

`pnpm dlx shadcn@latest add @coss/sheet @coss/drawer` also wants to **overwrite
`components/ui/button.tsx`** with a Base UI version whose API is incompatible
(`render` instead of `asChild`, different variant/size sets). That would break
every existing `Button asChild` call site in the repo, so the four coss files
were installed into a scratch copy and copied across by hand. **Answer "no" to
the overwrite prompt**, or use `--dry-run` first.

The coss Sheet/Drawer only use `Button` for their close button, with
`variant="ghost" size="icon"` — both of which exist in the repo's Radix-based
button, so the files work unmodified.

---

## Setup

1. Install deps:

   ```bash
   pnpm install
   ```

2. Add the variables from `docs/comments.env.example` to your environment.
   Rebuild afterwards — `NEXT_PUBLIC_*` is inlined at build time.

3. In Notion, invite the integration behind `NOTION_API_KEY` to each page that
   should accept comments, with **Read content** + **Insert comments**.

4. Smoke test:

   ```bash
   pnpm test:comments
   ```

---

## Known limitations

- **Rate limits are per-instance** (see above).
- **LinkedIn avatars rarely resolve** — LinkedIn blocks anonymous lookups.
- **No edit/delete for visitors.** Moderation happens in Notion, where comments
  can be deleted directly; the site reflects that on the next fetch.
- **No nested replies.** Notion comments are flat.
- **Comment counts are lazy.** The trigger shows a count only after the panel
  has been opened once, to avoid a Notion API call on every page view.
