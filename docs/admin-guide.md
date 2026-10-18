# Admin guide

Everything `/admin` does, what it refuses to do, and the SQL for when you would
rather not open a web page at all.

The pages are the convenient version of the rules. The database is the source of
truth, and every action below has an SQL equivalent you can run from the Supabase
SQL editor or `psql`.

---

## 1. Becoming an administrator

There is no button for this, deliberately. **Promotion is a database action** —
that is what makes it impossible for a request to grant it to itself.

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

Then **reload `/admin`**. It opens on that request, not five minutes later: the
admin path reads the session with the cookie cache bypassed.

`"user"` needs the quotes. It is a reserved word in Postgres.

To check who can administer the site:

```sql
SELECT id, name, email, role FROM "user" WHERE role = 'admin';
```

**The last administrator cannot be demoted or deleted.** Both are refused with an
explanation, because either one locks you out of the page that would let you undo
it. Promote somebody else first.

---

## 2. The screens

| Screen | What it is for |
| ------ | -------------- |
| `/admin` | Overview: how many accounts, how many seats are used, whether registration is open *and why*, and when anyone last signed in. |
| `/admin/users` | Every account with its role, join date and last sign-in. Promote, demote, remove. |
| `/admin/settings` | The seat limit and the registration toggle. |

### `/admin`

The "Registration" card always says *which* of the two reasons applies — the
toggle being off, or the seat limit being reached. "Closed" on its own is a bug
report waiting to happen, because the two have different fixes.

### `/admin/users`

Adapted from the Pro `data-table-*` blocks, minus the client-side sorting,
filtering and pagination — with a seat limit in the single digits, all three would
be code that never runs.

**Every row action is a real form post.** The page is fully operable with
JavaScript disabled; only the delete confirmation needs it.

- **Promote / demote** — sets `role`. Refused when it would empty the role.
- **Remove** — deletes the account. Sessions and linked OAuth accounts cascade
  from the foreign keys, so the seat is freed immediately.

**What removal does not do instantly.** A signed-in reader holds a five-minute
signed cookie cache, so their *existing* session can still satisfy a page that
honours the cache for up to five minutes. Their access to `/admin` ends at once,
because that path bypasses the cache. This is worth knowing before you remove
someone and then wonder why they are still browsing.

### `/admin/settings`

Two fields, one row.

| Field | Column | Notes |
| ----- | ------ | ----- |
| Accounts allowed | `max_users` | Whole number, 1–1000. |
| Registration open | `signup_enabled` | A hard stop, independent of the limit. |

Saving records **who** changed it in `site_settings.updated_by` and revalidates
`/sign-up`, so the open/closed state a reader sees cannot go stale behind a
change.

---

## 3. Seat semantics — the part that surprises people

**Only creation is gated. Access never is.**

`max_users` is compared against the number of rows in `user`, and only when a
*new* account is about to be created. An account that already exists always signs
in again. So:

- **Lowering the limit below the current number of accounts is allowed, and does
  exactly what you want.** Set it to 1 on a site with 2 accounts and registration
  closes; both people keep signing in. Nothing is deleted.
- **You cannot lock yourself out with a mistyped number.** The worst a wrong
  `max_users` can do is close registration.
- **The count is read under a row lock, in the same transaction that decides.**
  Two simultaneous first-sign-ins cannot both be admitted — the second waits,
  re-counts and is refused.

`signup_enabled = false` closes registration regardless of the numbers. That is
the switch to reach for when you want "no new accounts" without pretending the
limit changed.

---

## 4. The SQL equivalents

For when the web page is not the tool you want.

```sql
-- The current configuration. A freshly migrated database has no row yet, and the
-- gate behaves as if max_users = 1, signup_enabled = true until one exists.
SELECT * FROM site_settings;

-- Open registration up to three accounts.
INSERT INTO site_settings (id, max_users, signup_enabled)
VALUES ('primary', 3, true)
ON CONFLICT (id) DO UPDATE
  SET max_users = 3, signup_enabled = true, updated_at = now();

-- Close registration without touching the limit.
UPDATE site_settings
   SET signup_enabled = false, updated_at = now()
 WHERE id = 'primary';

-- Promote / demote.
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
UPDATE "user" SET role = 'user'  WHERE email = 'someone@example.com';

-- Free a seat by removing an account (sessions and OAuth links cascade).
DELETE FROM "user" WHERE email = 'someone@example.com';

-- Last resort: wipe all auth data. Registration re-opens automatically, because
-- the seat count drops to zero. site_settings survives on purpose.
TRUNCATE "user", session, account, verification CASCADE;
```

After any of these, the change is live immediately on `/admin*`. Give ordinary
pages up to five minutes, or sign out and back in.

---

## 5. Why this is hand-written, not better-auth's `admin()` plugin

The plan originally called for the plugin. It was not used, and the reasons are
worth keeping because this is the kind of decision that gets re-litigated:

1. **It needs a migration.** The plugin adds `user.banned`, `user.ban_reason`,
   `user.ban_expires` and `session.impersonated_by`. This approach adds no columns
   — `site_settings.updated_by` already existed for the audit trail.
2. **Banning is meaningless on this site.** Accounts are not self-service; every
   one of them was invited. Removal is the operation that actually happens, and it
   is already here.
3. **It ships impersonation.** One account acting as another is a capability
   nobody asked for on a single-owner site, and one that would have to be reasoned
   about in every future security review.
4. **One mechanism per table.** The seat gate already reads `site_settings`
   through Drizzle directly; two ways to touch the same row would be worse than
   one.

**Reconsider the plugin when** you want banning, impersonation, or a user base
large enough that hand-written queries stop being obviously correct.

---

## 6. Where the rules actually live

| Concern | File |
| ------- | ---- |
| Seat limit + toggle: validation and the write | `lib/admin/settings.ts` |
| Role changes and removal, including the last-admin guard | `lib/admin/users.ts` |
| Reads behind `/admin` | `lib/admin/queries.ts` |
| The HTTP surface: guard, parse, delegate, revalidate | `app/admin/actions.ts` |
| The sentences shown after an action | `lib/admin/messages.ts` |

The split between `lib/admin/**` and `app/admin/actions.ts` is deliberate. A
`"use server"` module can only run inside a request context, so its functions
cannot be called from a test harness. Keeping the rules in plain functions is what
lets `verification/admin-actions.test.mjs` assert the behaviour — including that
the last-admin guard refuses — rather than grepping the action file for the right
words.

**One guard, on every action.** `requireAdmin()` is the first line of every
exported action in `app/admin/actions.ts`. A server action is a public HTTP
endpoint: being *shown* a button authorises nothing, and `proxy.ts` is a
convenience rather than a boundary.

---

## 7. Verification

```bash
node verification/nav.test.mjs                  # structure, no database needed
node verification/admin-actions.test.mjs        # the invariants, against a live database
```

The second one needs `DATABASE_URL` and a migrated schema. It asserts, among
other things, that the last administrator cannot be demoted or deleted, that the
limit rejects zero and non-numbers, that lowering the limit below the account
count does **not** delete anybody, and that removal frees the seat.
