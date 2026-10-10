# Admin dashboard

The admin dashboard is at `/admin`. It is intentionally read-only in this milestone: it shows registered-account counts, the 50-account capacity counter, and a limited directory of user IDs, names, roles, and GitHub-provided emails. It does not provide a role-editing control or expose OAuth tokens, sessions, or account credentials.

## Grant admin access

Create an ordinary account with GitHub OAuth first, then use the Supabase SQL Editor to verify and promote the intended row:

```sql
select id, name, email, role, created_at
from public."user"
order by created_at;

update public."user"
set role = 'admin', updated_at = now()
where id = 'PASTE_THE_VERIFIED_USER_ID_HERE';
```

Use the exact lowercase value `admin`. The schema permits only `user` and `admin`, and Better Auth prevents clients from submitting a role as profile input.

## Authorization behavior

- A signed-out visitor opening `/admin` is redirected to GitHub sign-in with `/admin` as the return path.
- A signed-in non-admin is redirected to `/access-denied`.
- The `requireAdmin()` server helper gets the session identity, then reads the current role directly from Postgres. It does not trust the role inside the short-lived JWT cookie cache; a database promotion takes effect on the next admin request.
- The dashboard link in `/dashboard` is only a convenience. Hiding or showing the link is not the security boundary.
- Every future admin API route or server action must call `requireAdmin()` independently. Do not rely on client-side role checks or add an unrestricted role-edit endpoint.

The 50-account cap includes the admin account. Public pages and guest comments remain usable without an account.
