# Signed-in member comments

Signed-in comments are intentionally a separate channel from guest comments. Guest comments continue to use Notion's native comment API and remain open to everyone; member comments are stored in the site's Postgres database and are tied to a Better Auth user record.

## Visitor experience

The article discussion panel has separate **Guest comments** and **Member comments** feeds. Visitors can read either feed without an account. Posting to the member feed requires GitHub OAuth. Each member comment shows the account's current display name (or GitHub name) and GitHub avatar when its URL is valid. A signed-in member can delete only their own comments; the API and SQL predicate both enforce ownership. Admin status does not grant permission to delete another member's comments.

Member text is rendered as plain text, limited to 1,000 characters, checked against the existing profanity matcher, and rate-limited by account and client IP. Guest-comment validation, Turnstile, identity cookies, and Notion storage are unchanged.

## Database setup

Apply the new migration after phases 1 and 2:

```bash
pnpm db:migrate
```

`drizzle/0002_member-comments.sql` creates `public.member_comment`, adds the page/time and owner indexes, constrains page IDs and body length, cascades a member's comments if their user row is deleted, and enables row-level security. It intentionally creates no browser-facing RLS policies. All access is through the server-side application database connection; do not expose a database key to the browser.

## API

```text
GET    /api/member-comments?pageId=…&cursor=…   public, paginated feed
POST   /api/member-comments                     authenticated create
DELETE /api/member-comments?id=…                authenticated owner-only delete
```

Mutations require same-origin requests. The server derives author ID, name, and avatar from the current session and database profile; clients cannot submit an author identity or role. The feed response includes `isOwner` only for the current session, which is a UI hint—the DELETE endpoint independently includes both comment ID and authenticated user ID in its delete condition.

## Operational notes

- The member feed is requested only after a visitor opens the discussion panel, so public page renders do not trigger an auth/session lookup for comments.
- GET reads are public; profile email and internal user IDs are not returned.
- In-memory rate limits are per server instance and reset on cold start, like the guest comment limiter. OAuth registration remains capped at 50 total accounts.
- Member comments are not published to Notion and do not appear in the guest feed.
