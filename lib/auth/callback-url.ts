/**
 * `callbackUrl` sanitising — the single implementation for the whole app.
 *
 * Roadmap item 4 is "after signing in, return the reader to the page they were
 * on". That means a URL round-trips through a query parameter, through GitHub,
 * and back. Anywhere a URL is taken from a request and used for navigation is an
 * open-redirect sink (RULES.md §5.9, CodeQL `js/unvalidated-url-redirection`),
 * so every hop — the sign-in button, the sign-in page, and `proxy.ts` — must go
 * through this one function. It *is* the allowlist.
 *
 * Design notes:
 *
 * - **Never throws.** Anything it cannot prove safe becomes `fallback`. A
 *   caller should never have to handle an error from a URL sanitiser.
 * - **Percent-decoding is checked, not returned.** The framework has already
 *   decoded the query parameter once, so `%2F%2Fevil.example` arrives as
 *   `//evil.example` and is caught by the protocol-relative rule. A *second*
 *   decode is performed only to inspect for double-encoding — returning that
 *   second decode would corrupt a legitimate path containing a literal `%`
 *   (e.g. `/blog/50%25off`), so the original value is what gets returned.
 * - **Loop guard.** Sending a reader back to `/sign-in` after signing in would
 *   bounce them between the redirect guard and the form forever. `/sign-up` and
 *   `/api/auth/*` are refused for the same reason.
 */

/** Bound on the returned value; query strings have no legitimate reason to be longer. */
const MAX_LENGTH = 512;

/** Control characters (`\u0000`–`\u001f`, `\u007f`) can smuggle headers or split a value. */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/** Returns the decoded string, or `null` if it is not a valid percent-encoding. */
function tryDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** The structural half of the check, applied to both the raw and decoded forms. */
function isAllowedPath(value: string): boolean {
  // Must be a path on this origin. An absolute URL (`https://evil.example`), a
  // protocol-relative one (`//evil.example`) or a scheme-smuggling one
  // (`javascript:`) all fail here.
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;

  if (hasControlCharacter(value)) return false;

  // A backslash has no meaning in a path on this site; browsers may normalise it
  // to a separator, which is how `/\evil.example` becomes protocol-relative.
  if (value.includes("\\")) return false;

  // `foo://bar` cannot appear in a legitimate same-origin path.
  if (value.includes("://")) return false;

  const path = (value.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/";
  if (path === "/sign-in") return false;
  if (path === "/sign-up") return false;
  if (path.startsWith("/api/auth")) return false;

  return true;
}

/**
 * Returns an internal path safe to navigate to, or `fallback`.
 *
 * @example
 * sanitizeCallbackUrl("/about?tab=skills")     // "/about?tab=skills"
 * sanitizeCallbackUrl("https://evil.example")  // "/"
 * sanitizeCallbackUrl("//evil.example", "/x")  // "/x"
 * sanitizeCallbackUrl("%2F%2Fevil.example")    // "/"
 * sanitizeCallbackUrl("/sign-in")              // "/"  (loop guard)
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (typeof raw !== "string") return fallback;

  const original = raw.trim();
  if (original.length === 0) return fallback;

  const decoded = tryDecode(original);
  if (decoded === null) return fallback;

  // Both forms must be acceptable: the decoded form catches double-encoding,
  // the raw form catches anything that only looks encoded.
  if (!isAllowedPath(original) || !isAllowedPath(decoded)) return fallback;

  return original.slice(0, MAX_LENGTH);
}

/**
 * Builds the link to the sign-in page for a given destination.
 *
 * Use this instead of hand-writing `/sign-in?callbackUrl=...`; forgetting the
 * `encodeURIComponent` is exactly how the reference implementation lost its
 * destination. See doc 03 §3.3.1.
 */
export function buildSignInHref(callbackUrl: string, fallback = "/"): string {
  const safe = sanitizeCallbackUrl(callbackUrl, fallback);
  return `/sign-in?callbackUrl=${encodeURIComponent(safe)}`;
}
