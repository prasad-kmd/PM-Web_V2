import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * better-auth's HTTP surface: `/api/auth/*`.
 *
 * Every auth operation is a route on this one handler — the GitHub sign-in
 * redirect, the `/api/auth/callback/github` return leg, sign-out, and the
 * `get-session` endpoint that `proxy.ts` calls (it deliberately does not import
 * the database client, so it can run on either runtime).
 *
 * `toNextJsHandler` forwards the request untouched and returns better-auth's
 * own `Response`, which is what lets the Set-Cookie headers from `nextCookies()`
 * pass through.
 *
 * Runtime is Node.js (the default for route handlers) because `postgres.js`
 * requires it — not Edge, so do not add `export const runtime = "edge"`.
 */
export const { GET, POST } = toNextJsHandler(auth);
