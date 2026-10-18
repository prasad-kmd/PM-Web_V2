import { NextResponse, type NextRequest } from "next/server";

import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import {
  AUTH_ROUTES,
  DEFAULT_SIGNED_IN_PATH,
  PROTECTED_ROUTES,
} from "@/lib/nav";

/**
 * Request gate — `proxy.ts`, not `middleware.ts` (Next 16 renamed the
 * convention; `middleware.ts` is ignored with no warning, which is a silent
 * way to lose a security control, hence RULES.md §1.1).
 *
 * **This is a convenience layer, not the security boundary.** Anything that
 * reaches a route handler or a server component directly bypasses it entirely,
 * so every protected page also calls `requireUser` / `requireAdmin` from
 * `lib/auth/server.ts`. Removing this file would cost redirects, not safety —
 * which is the property that makes it safe to keep simple.
 *
 * ## Why the session is read over HTTP
 *
 * Calling `auth.api.getSession()` here would import the Drizzle client and
 * `postgres.js` into the edge bundle. Fetching `/api/auth/get-session` keeps
 * this file runtime-agnostic: no database driver in the edge path, and the
 * session semantics (cookie cache, role) stay owned by one place.
 *
 * ## Failure behaviour
 *
 * If that fetch fails, this treats the reader as signed out. That is deliberate:
 * a person who cannot be *proved* to have a session is not given access to
 * `/dashboard` or `/admin`. The cost is that an auth endpoint outage looks like
 * being signed out; the alternative is letting an unverifiable session through.
 */

/** The shape of the bits of `get-session` this file reads. */
type SessionPayload = { user?: { role?: string } | null } | null;

/**
 * Reads the session for this request.
 *
 * @param fresh when `true`, bypasses better-auth's 5-minute cookie cache. Used
 *   for `/admin*` so that promoting or demoting someone with
 *   `UPDATE "user" SET role = …` takes effect on the next request rather than
 *   up to five minutes later (finding F6).
 */
async function readSession(
  request: NextRequest,
  fresh: boolean,
): Promise<SessionPayload> {
  const url = new URL("/api/auth/get-session", request.nextUrl.origin);
  if (fresh) url.searchParams.set("disableCookieCache", "true");

  const cookie = request.headers.get("cookie");

  try {
    const response = await fetch(url, {
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as SessionPayload;
  } catch {
    return null;
  }
}

/** True when `pathname` is the route itself or something nested under it. */
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isSignInPage = pathname === AUTH_ROUTES.signIn;
  const isSignUpPage = pathname === AUTH_ROUTES.signUp;
  const guarded = PROTECTED_ROUTES.find((route) =>
    matchesRoute(pathname, route.path),
  );

  // Public page. Cheaper than any auth read, and the matcher already keeps
  // ordinary traffic out — this is the second half of the same decision.
  if (!guarded && !isSignInPage && !isSignUpPage) return NextResponse.next();

  const session = await readSession(request, guarded?.scope === "admin");

  // Already signed in, asking for the form again — a back button, a second tab,
  // or a bookmark from before the sign-in. Send them where they were going.
  if (session && (isSignInPage || isSignUpPage)) {
    const target = sanitizeCallbackUrl(
      request.nextUrl.searchParams.get("callbackUrl"),
      DEFAULT_SIGNED_IN_PATH,
    );
    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  }

  if (!guarded) return NextResponse.next();

  // Signed out, hitting a protected page: send them to sign in, carrying the
  // page they wanted so item 4 holds for a typed URL as well as a click.
  if (!session) {
    const url = new URL(AUTH_ROUTES.signIn, request.nextUrl.origin);
    url.searchParams.set(
      "callbackUrl",
      sanitizeCallbackUrl(`${pathname}${search}`, DEFAULT_SIGNED_IN_PATH),
    );
    return NextResponse.redirect(url);
  }

  // Signed in but not permitted → `/not-authorized`, never `/sign-in`: they are
  // authenticated, so a second trip through GitHub would be a confusing loop.
  if (guarded.scope === "admin" && session.user?.role !== "admin") {
    const url = new URL(AUTH_ROUTES.notAuthorized, request.nextUrl.origin);
    url.searchParams.set(
      "from",
      sanitizeCallbackUrl(pathname, DEFAULT_SIGNED_IN_PATH),
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Explicit, and deliberately so. A broad negative matcher (`(?!_next|api|…)`)
 * silently swallows any new public route added later; this list can only ever
 * affect the routes named in it.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/sign-in", "/sign-up"],
};
