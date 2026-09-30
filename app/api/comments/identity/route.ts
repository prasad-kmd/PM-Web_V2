import { NextResponse } from "next/server";
import { identityClearCookie } from "@/lib/comments/identity-cookie";

/**
 * DELETE /api/comments/identity
 *
 * Clears the guest commenter cookie. The client can also clear it directly
 * (`clearIdentityCookie`), but exposing a route keeps the expiry semantics in
 * one place and works if the cookie was ever set with different attributes.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function DELETE(): NextResponse {
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": identityClearCookie() } },
  );
}
