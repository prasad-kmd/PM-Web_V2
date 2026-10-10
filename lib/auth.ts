import "server-only";

import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  account,
  authUserCapacity,
  rateLimit,
  session,
  user,
  verification,
} from "@/lib/db/schema";

export const MAX_REGISTERED_USERS = 50;

const globalForAuth = globalThis as typeof globalThis & {
  __pmWebAuth?: unknown;
};

type AuthInstance = ReturnType<typeof createAuthInstance>;

/**
 * Better Auth is initialized only when an auth request is actually served.
 * This keeps static builds and public, database-independent pages deployable
 * before secrets have been configured.
 */
export function getAuth(): AuthInstance {
  if (globalForAuth.__pmWebAuth) {
    return globalForAuth.__pmWebAuth as AuthInstance;
  }

  const auth = createAuthInstance();
  globalForAuth.__pmWebAuth = auth;
  return auth;
}

function createAuthInstance() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("BETTER_AUTH_SECRET must be configured in production.");
  }
  if (secret && secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  const configuredBaseUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const baseURL = new URL(configuredBaseUrl).origin;
  const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  return betterAuth({
    appName: "PM-Web",
    baseURL,
    ...(secret ? { secret } : {}),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: { enabled: false },
    socialProviders:
      githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {},
    account: {
      // OAuth state stays in a short-lived protected cookie instead of adding
      // a transient database row on each provider redirect.
      storeStateStrategy: "cookie",
      // Provider tokens are not used by the site, but encrypt them if retained.
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
        strategy: "jwt",
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
          input: false,
        },
        displayName: {
          type: "string",
          required: false,
          input: false,
        },
        bio: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (newUser) => {
            const [capacity] = await getDb()
              .select({
                registeredUsers: authUserCapacity.registeredUsers,
                maxUsers: authUserCapacity.maxUsers,
              })
              .from(authUserCapacity)
              .where(eq(authUserCapacity.singleton, true))
              .limit(1);

            // Fail closed if the migration/capacity row is missing.
            if (!capacity) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message:
                  "Account capacity is not initialized. Apply database migrations before enabling sign-in.",
              });
            }

            if (capacity.registeredUsers >= MAX_REGISTERED_USERS) {
              throw new APIError("FORBIDDEN", {
                message:
                  "Registration is closed because the site has reached its 50-account limit.",
              });
            }

            return { data: newUser };
          },
        },
      },
    },
    trustedOrigins: [baseURL],
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 50,
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}
