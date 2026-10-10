# User dashboard and profile

The member dashboard is available at `/dashboard`. The account icon in the floating navbar, mobile dock, and sidebar opens a small account gateway: signed-in users go to their dashboard; signed-out users go to GitHub sign-in and return to the page that initiated it.

## Profile fields

Members can set:

- **Display name** (up to 40 characters). An empty value falls back to the name returned by GitHub.
- **Short bio** (up to 160 characters).

The profile image is read from the GitHub OAuth account. Uploads, image URLs, email changes, and role changes are not part of the member profile form. Profile edits are sent to `PATCH /api/profile`, which requires a current session, same-origin request, validated fields, and updates only the signed-in account's `display_name` and `bio` columns.

The added columns are applied by the `0001_user-profile.sql` Drizzle migration:

```bash
pnpm db:migrate
```

The underlying account role is read from Postgres on dashboard render rather than trusted from the short-lived session cache. Changing a profile does not change OAuth credentials or grant privileges.

## Navigation and public access

The account icon points to `/account?returnTo=...`. Session lookup happens only when that link is opened—not on every public page view. Signed-in visitors are sent to `/dashboard`; signed-out visitors go to `/sign-in` with the original local page as the callback destination.

The dashboard is private, but public content and guest comments stay open. Signed-in member comments are available in a separate feed on content pages; they are stored in Postgres, never mixed with the existing guest comments in Notion. Signed-in members can delete only their own member comments. See [Member comments](./member-comments.md) for the data model and API behavior.
