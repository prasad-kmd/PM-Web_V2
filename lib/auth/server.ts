import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth, type Session } from "@/lib/auth";
import { buildSignInHref, sanitizeCallbackUrl } from "@/lib/auth/callback-url";

/**
 * Server-side session helpers — the only sanctioned way to read auth state on
 * the server (doc 03 §3.4).
 *
 * Middleware (`proxy.ts`) is a convenience gate, not the security boundary: it
 * can be bypassed by anything that reaches a route handler directly. Every
 * protected page calls one of these as well.
 *
 * **Every redirect target is an explicit argument.** Taking it from `Referer`
 * or from a spoofable request header would reintroduce exactly the open-redirect
 * class this project already fixed once; a page knows its own path, so it passes
 * it. The value still goes through `sanitizeCallbackUrl` before use, so a
 * careless caller cannot become a vulnerability.
 */

/**
 * Both reads are wrapped in React's `cache()`, which memoises for the duration of
 * a single render pass.
 *
 * This matters once a layout and a page both need the session — `/admin` does,
 * because the layout renders the chrome and each page renders its own data. One
 * request should not mean three database round trips for the same row.
 *
 * The two are cached separately on purpose: they are different reads, and
 * collapsing them would silently make every caller pay the fresh-read price.
 */
const readCachedSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

const readFreshSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  }),
);

/** Session honouring the 5-minute cookie cache. Use on public pages. */
export async function getSession() {
  return readCachedSession();
}

/**
 * Session read straight from the database, bypassing the cookie cache.
 *
 * Use wherever accuracy beats a saved query — admin gating, and anything that
 * branches on `role`, so a database promotion takes effect immediately.
 */
export async function getFreshSession() {
  return readFreshSession();
}

/**
 * Requires a signed-in user. Redirects to `/sign-in` carrying the page to
 * return to.
 *
 * @param callbackPath the page's own path, e.g. `"/dashboard"`. Passed
 *   explicitly — never read from a header.
 */
export async function requireUser(callbackPath: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(buildSignInHref(callbackPath, "/dashboard"));
  return session;
}

/**
 * Requires `role === "admin"`. Reads the session fresh, so a promotion applied
 * with `UPDATE "user" SET role = 'admin'` works on the very next request.
 *
 * A signed-in non-admin goes to `/not-authorized` (not to `/sign-in` — they are
 * authenticated, just not permitted, and sending them back through GitHub would
 * be a confusing loop).
 *
 * @param callbackPath the page's own path, e.g. `"/admin/users"`.
 */
export async function requireAdmin(callbackPath: string): Promise<Session> {
  const session = await getFreshSession();
  if (!session) redirect(buildSignInHref(callbackPath, "/dashboard"));

  if (session.user.role !== "admin") {
    const from = sanitizeCallbackUrl(callbackPath, "/dashboard");
    redirect(`/not-authorized?from=${encodeURIComponent(from)}`);
  }

  return session;
}

/** Discriminated result so a route handler can pick its own status code. */
export type AdminApiGate =
  | { ok: true; session: Session }
  | { ok: false; response: Response };

/**
 * Admin gate for `/api/admin/**` route handlers.
 *
 * Returns JSON — never a redirect — because the caller is `fetch`, and a 302 to
 * an HTML page produces the classic "unexpected token '<'" parse error instead
 * of a usable status. The `code` field is stable for client branching; `error`
 * is for logs and for the reader.
 */
export async function requireAdminApi(): Promise<AdminApiGate> {
  const session = await getFreshSession();

  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { error: "Authentication required.", code: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      ok: false,
      response: Response.json(
        { error: "Administrator access required.", code: "FORBIDDEN" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session };
}
