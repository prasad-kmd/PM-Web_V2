import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { assertRegistrationOpen } from "@/lib/auth/registration";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import { githubOAuthConfig, serverEnv, trustedOrigins } from "@/lib/env";

/**
 * better-auth configuration — the whole auth surface.
 *
 * Design decisions live in `docs/planning/03-auth-architecture.md`; the short
 * version:
 *
 * - **Database sessions, 5-minute cookie cache.** Not JWT. `/admin*` reads with
 *   `disableCookieCache` so a `role` change made in the database takes effect
 *   immediately there, and within five minutes everywhere else (doc 03 §3.2).
 *   Note that `session.strategy: "jwt"` — used by the reference repo — is not a
 *   valid option in better-auth 1.7.7 and did nothing; sessions are stored in
 *   the `session` table regardless.
 * - **One provider.** GitHub only, registered only when both credentials are
 *   present (§`lib/env.ts`). No e-mail sign-in: there is no budget for e-mail
 *   verification, and an unverified e-mail provider would be worse than none.
 * - **The seat gate** lives in `databaseHooks.user.create.before` and runs on
 *   creation only, so existing accounts are never affected.
 * - **`nextCookies()` last.** The plugin must be the final entry in `plugins`
 *   for Set-Cookie headers to survive Next.js's server-action/cookie plumbing.
 */

// Validated at import: a missing or too-short secret stops the process here with
// a message naming what to do, rather than at the first sign-in attempt.
const env = serverEnv();

// Resolved once: throws here if exactly one of the two GitHub variables is set.
const github = githubOAuthConfig();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,

  /**
   * CSRF boundary. Defaults to `BETTER_AUTH_URL` + `NEXT_PUBLIC_SITE_URL`
   * (both `http://localhost:3000` here). A LAN origin is refused unless it is
   * added to `AUTH_TRUSTED_ORIGINS` explicitly — see `lib/env.ts`.
   */
  trustedOrigins: trustedOrigins(),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the row at most once a day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — see the note above
    },
  },

  socialProviders: github.configured
    ? {
        github: {
          clientId: github.clientId,
          clientSecret: github.clientSecret,
        },
      }
    : {},

  user: {
    additionalFields: {
      /**
       * `input: false` is load-bearing, not tidiness — see doc 03 §3.13.1.
       *
       * better-auth's default is that the client may set additional fields, and
       * `parseInputData()` copies a client-supplied value straight into the
       * insert. Without `input: false`, a sign-up request carrying
       * `{"role": "admin"}` would be written verbatim — so whoever reached the
       * sign-up endpoint first could claim the single seat *as an admin*.
       *
       * With it, such a request is rejected with `FIELD_NOT_ALLOWED`, which
       * makes the attempt visible instead of silently ignored.
       *
       * Promotion is a deliberate database action:
       *   UPDATE "user" SET role = 'admin' WHERE email = '…';
       */
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      /**
       * Only providers that verify the address may be linked to an existing
       * account. With GitHub as the sole provider this cannot trigger yet; it is
       * written down now so that adding a second provider is a conscious choice
       * rather than an inherited default.
       */
      trustedProviders: ["github"],
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },

  databaseHooks: {
    user: {
      create: {
        // The seat gate. Throws APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED" })
        // when full, which the OAuth callback turns into a redirect back to the
        // sign-in card with `?error=REGISTRATION_CLOSED`.
        before: (incomingUser) => assertRegistrationOpen(incomingUser),
      },
    },
  },

  // Must stay last: it wires better-auth's cookies into Next.js's cookie store.
  plugins: [nextCookies()],
});

/** Session shape as exposed to the app, including the `role` additional field. */
export type Session = typeof auth.$Infer.Session;
