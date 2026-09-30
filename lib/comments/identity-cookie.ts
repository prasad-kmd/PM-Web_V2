import type { CommenterIdentity } from "./types";

/**
 * Cookie persistence for the guest commenter identity.
 *
 * Requirement: once a visitor has typed their details they should be able to
 * comment again without retyping, and be able to edit those details to comment
 * as someone else.
 *
 * The cookie is deliberately **not** HttpOnly — the comment form has to read it
 * on the client to prefill. That means it must never be treated as trusted
 * input: the server re-validates name/email/handles on every POST and treats
 * the cookie purely as a convenience cache.
 *
 *   name   pm_commenter
 *   value  URL-encoded JSON {n,e,g,l,t,v}
 *   life   180 days
 */

export const IDENTITY_COOKIE = "pm_commenter";

/** Bumped when the stored shape changes so stale cookies are discarded. */
const SCHEMA_VERSION = 1;

const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type StoredIdentity = {
  v: number;
  n: string;
  e: string;
  g?: string;
  l?: string;
  t?: string;
};

function toStored(identity: CommenterIdentity): StoredIdentity {
  return {
    v: SCHEMA_VERSION,
    n: identity.name,
    e: identity.email,
    ...(identity.github ? { g: identity.github } : {}),
    ...(identity.linkedin ? { l: identity.linkedin } : {}),
    ...(identity.twitter ? { t: identity.twitter } : {}),
  };
}

function fromStored(raw: string | null | undefined): CommenterIdentity | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as StoredIdentity;
    if (parsed?.v !== SCHEMA_VERSION) return null;
    if (typeof parsed.n !== "string" || typeof parsed.e !== "string")
      return null;
    if (!parsed.n.trim() || !parsed.e.includes("@")) return null;

    return {
      name: parsed.n,
      email: parsed.e,
      ...(parsed.g ? { github: parsed.g } : {}),
      ...(parsed.l ? { linkedin: parsed.l } : {}),
      ...(parsed.t ? { twitter: parsed.t } : {}),
    };
  } catch {
    return null;
  }
}

export function serializeIdentity(identity: CommenterIdentity): string {
  return encodeURIComponent(JSON.stringify(toStored(identity)));
}

export function parseIdentity(
  raw: string | null | undefined,
): CommenterIdentity | null {
  return fromStored(raw);
}

// ── Server side ───────────────────────────────────────────────────────────────

function baseAttributes(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/** `Set-Cookie` header value that stores the identity. */
export function identitySetCookie(identity: CommenterIdentity): string {
  return `${IDENTITY_COOKIE}=${serializeIdentity(identity)}; ${baseAttributes()}`;
}

/** `Set-Cookie` header value that expires the identity. */
export function identityClearCookie(): string {
  return `${IDENTITY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ── Client side ───────────────────────────────────────────────────────────────

function readRaw(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${IDENTITY_COOKIE}=`));
  return match ? match.slice(IDENTITY_COOKIE.length + 1) : null;
}

/** Reads the stored identity from the browser. Safe to call during render. */
export function readIdentityCookie(): CommenterIdentity | null {
  return fromStored(readRaw());
}

/** Stores the identity in the browser. */
export function writeIdentityCookie(identity: CommenterIdentity): void {
  if (typeof document === "undefined") return;
  document.cookie = `${IDENTITY_COOKIE}=${serializeIdentity(identity)}; ${baseAttributes()}`;
}

/** Forgets the stored identity. */
export function clearIdentityCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = identityClearCookie();
}
