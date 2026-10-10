# GitHub OAuth setup

This project currently offers GitHub as its only sign-in provider. Email/password sign-in, magic links, and Google OAuth are not enabled. A first GitHub sign-in creates a normal `user` account unless the 50-account cap has been reached.

## Create one OAuth App per environment

GitHub OAuth Apps have a single callback URL, so use separate OAuth Apps for local development and production:

1. Open **GitHub → Settings → Developer settings → OAuth Apps**.
2. Choose **New OAuth App**.
3. Enter the app name and matching homepage origin.
4. Set the callback URL exactly:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://your-domain.example/api/auth/callback/github`
5. Copy the client ID and generate a client secret.

Configure these server-only values in `.env.local` and your hosting environment:

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Also configure `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and `DATABASE_URL` as described in [Authentication setup](./authentication-setup.md).

Better Auth requests the GitHub `read:user` and `user:email` scopes to read the GitHub profile and a verified primary email. The email is required profile metadata for the auth user record; it does not enable email-based authentication or email delivery.

## Callback and return paths

The OAuth callback is `/api/auth/callback/github`. Sign-in can include an internal `returnTo` path; the sign-in page validates it and rejects external/protocol-relative URLs before passing it to Better Auth. If no path is supplied, the user returns to `/`.

Do not add wildcard callback URLs or accept arbitrary `callbackURL` values from an untrusted client. For custom local domains, use the exact same origin in the OAuth App homepage, callback URL, and `BETTER_AUTH_URL`.

## Common errors

- **Callback URL mismatch:** use the OAuth App created for that environment and compare the exact scheme, hostname, port, and callback path.
- **App credentials missing:** the sign-in screen reports that GitHub OAuth is not configured until both server variables are available.
- **New account refused:** the app allows no more than 50 registered accounts. Existing users can still sign in at capacity.
