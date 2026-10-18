import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/lib/auth";

/**
 * Browser-side auth client.
 *
 * `inferAdditionalFields` is a **type-only** plugin: it teaches the client that
 * `session.user.role` exists, which is what lets `components/auth/UserMenu.tsx`
 * show the Admin link without a cast. Nothing from `@/lib/auth` reaches the
 * browser bundle — the import above is `import type`, so it is erased at
 * compile time.
 *
 * `baseURL` is intentionally omitted. The client defaults to the current origin,
 * which is correct for a local-only site and keeps this module free of
 * environment plumbing (roadmap Phase 2, step 7).
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, useSession } = authClient;
