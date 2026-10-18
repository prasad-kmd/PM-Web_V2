# 04 — Backlog Notes: Page-View Counter & Invoice Generator (item 7)

You asked for a **brief** look so the DB can be designed to absorb these later.
Nothing here is implemented; it exists to stop Phase 1's schema from painting us
into a corner. Both features slot in *after* the auth base is stable.

---

## 1. Page-view counter

### What the two reference articles actually do

| Source | Approach | Key mechanics |
| ------ | -------- | ------------- |
| **pankajtanwar.in** (Next.js) | Firebase **Realtime Database** + `firebase-admin`, called from a Next.js API route | 4 env vars (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_DATABASE_URL`); `POST /api/views/[slug]` increments via `ref.transaction()` (atomic, works for concurrent hits); `GET` reads the count; the badge is lazy-loaded on the client; free on the Spark plan. Two real gotchas called out there: the private key needs its `\n` sequences restored in Vercel env vars, and the RTDB must run with **proper rules** — the article's setup uses test mode, which must not ship. |
| **fineshopdesign.com** (Blogger) | Same Firebase Realtime Database idea, wired for a Blogger/static context | Its distinguishing feature is the **realtime listener**: the displayed number swaps when the underlying value changes, without a page reload. (Note: that page is JavaScript-rendered and returned no readable text to my fetcher — I'm describing its canonical approach, not quoting it. If you want it mirrored exactly, re-read it at implementation time.) |

**Shared shape, either way:** a per-page counter keyed by path/slug, an atomic
increment endpoint, a read endpoint, and a small display component. That shape is
worth keeping regardless of the backend.

> **Note (v2.9.0):** PostHog is being removed in Phase 0 and no analytics vendor
> replaces it, so there is **no historical view data to migrate** — counters start
> from zero whenever this feature ships. That's actually convenient: no migration,
> no backfill script.

### Option A — Postgres counters (recommended)

```ts
// added in a LATER migration, not Phase 1
export const pageViews = pgTable("page_views", {
  path:       text("path").primaryKey(),      // e.g. "/blog/robot-arm-teardown"
  count:      integer("count").notNull().default(0),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- Write path: `INSERT … ON CONFLICT (path) DO UPDATE SET count = page_views.count + 1, updated_at = now()`
  — atomic without a transaction wrapper, and Drizzle-typed.
- Read path: cached (`use cache` / `revalidate`), so a popular page costs ~1 DB read per revalidation window, not per visitor.
- Dedupe: count once per `hash(ip + user-agent + path + day)` (the same "request context" helpers your comments system already has in `lib/comments/request-context.ts`), skip obvious bots, ignore `prefetch` requests.
- Why it wins here: **one vendor** (Supabase is already in the architecture), no second secret/service-account to rotate, joins directly with your content metadata, and zero new client SDK in the bundle.
- Free tier: a `page_views` row per path is bytes; even 100 k views/month is far inside 500 MB.

### Option B — Firebase Realtime Database (the articles' approach)

- Adds: a Firebase project, `firebase-admin`, 4 env vars, and a service-account private key that must be rotated and stored carefully (its mishandling is a classic leak vector).
- Wins: realtime, no-refresh counters (the fineshopdesign "feel"), zero load on Postgres, and a generous free tier (Spark: ~1 GB stored, ~10 GB/month download, ~100 concurrent connections for RTDB as of the published plan terms — verify current limits before committing).
- Costs: security rules become a first-class thing to get right (the `firebase-security-rules-auditor` skill exists for exactly this), the `\n`-in-private-key deployment gotcha, and "which database am I debugging?" complexity.

### Recommendation

**Ship Postgres first** — and v2.9.0 makes this an even easier call, because removing
PostHog leaves you with **no second vendor at all**; adding Firebase back would mean
two accounts to babysit for numbers you can count in SQL. It reuses the auth
infrastructure you'll already have, and the only thing you give up is live-updating
numbers — which a 60-second client poll (or a refresh on visibility change)
approximates perfectly for a portfolio. Keep the Firebase path parked; if you later
want true realtime, or Postgres-side write volume becomes a genuine concern, the
display component and the `path`-keyed data shape port over unchanged.

**Suggested data shape either way:** key by route path, not by Notion page id, so
`/about`, `/projects/foo`, and future `/tools/*` pages all count with one mechanism.

---

## 2. Invoice generator (admin-only)

The reference repo (`PMEngineerLK-NextJS`) already proves the concept; this is the
"what to reuse, what to change" pass.

### What to reuse

- The table family: `clients`, `invoices`, `invoice_items` — with `user_id` FKs and
  the cascade behaviour the reference repo uses.
- Sequential invoice numbers like `INV-YYYY-###`: keep a dedicated counter row and
  increment it inside the same transaction as the insert (`UPDATE … RETURNING`) —
  generating numbers client-side is how you end up with duplicates.
- PDF generation via `@react-pdf/renderer`. The reference repo carries
  **three** PDF paths (`@react-pdf/renderer`, `html2canvas`, `jspdf`) — pick **one**
  and delete the other two when you port: `react-pdf` renders real text (searchable,
  selectable, small files) from a React document definition and runs server-side in a
  route handler with the Node runtime. `html2canvas` + `jspdf` rasterizes via a headless
  browser-ish path: bigger bundles, blurry output, no text layer.

### What to change for v2

| Reference behaviour | v2 requirement |
| ------------------- | -------------- |
| Auth by cookie session in server actions | `requireAdminApi()` / `requireAdmin()` on every route and action — invoices are the most sensitive data in the DB |
| PDFs generated on the client | Generate server-side on demand (`GET /admin/invoices/[id]/pdf`) — nothing stored, nothing to leak |
| Free-tier storage | Don't store PDF blobs at all; if archival is ever needed, Supabase Storage (1 GB free) with signed URLs, never a public bucket |
| Ad-hoc guards | One access-control check per route handler; failures return 401/403 JSON, not redirects |

### Route & table sketch (later migration)

```
/admin/invoices                 list + filters (client, status, date range)
/admin/invoices/new             create (client picker, line items, tax, totals)
/admin/invoices/[id]            view / edit / mark paid / download PDF
/admin/clients                  client CRUD

clients        (id, user_id → user.id, name, email, phone, address, created_at, updated_at)
invoices       (id, user_id, client_id → clients.id, number unique, status, issue_date, due_date,
                currency, subtotal, tax_rate, total, notes, created_at, updated_at)
invoice_items  (id, invoice_id → invoices.id on delete cascade, description, quantity, unit_price, amount)
invoice_counters (scope text PK, next_number int, updated_at)     -- INV-YYYY-### sequence
```

**Free-tier footprint:** invoices for personal freelance work are kilobytes each; the
whole feature is comfortably inside the 500 MB tier.

---

## 3. Schema extensibility rules (so these stay cheap to add)

1. **`site_settings` is the feature-flag home.** Add columns (not new tables) for
   things like `page_views_enabled`, `invoices_enabled` when those features land.
2. **Keep the auth core tables untouched.** Feature tables reference `user.id`; they
   never modify it. This keeps better-auth schema re-generation (for plugins like
   `admin()` or `twoFactor()`) a clean diff.
3. **Timezones:** use `timestamptz` for anything user-facing (invoice dates, view
   timestamps). This site is authored from `Asia/Colombo` (`UTC+05:30`) — store UTC,
   render local.
4. **Slugs over IDs for counters** (page paths), **IDs over slugs for invoices**
   (numbers must never be reused or renamed).
5. **Every new table gets:** an index on its FK, a `created_at`, and — for admin-facing
   data — a documented SQL fallback in `docs/admin-guide.md`. Assume you'll be fixing
   things from the SQL editor at some point.

---

## 4. Suggested sequencing when you start these

1. **Page views** (smaller): one migration, one API route, one display component, one
   `docs/page-views.md`. Half a session. Can run in parallel with nothing else pending.
2. **Invoices** (larger): needs `/admin` from Phase 4, the counter table, three PDF
   decisions above, and a privacy note (client PII in your DB → update `SECURITY.md`
   and the privacy policy). Budget 2–3 sessions: data layer → CRUD UI → PDF polish.
