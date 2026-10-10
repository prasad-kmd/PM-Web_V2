const INTERNAL_ORIGIN = "https://pm-web-internal.invalid";

/**
 * Accept only same-site relative paths for OAuth callbacks. This blocks
 * absolute/protocol-relative redirects and auth-loop destinations while
 * preserving an initiating page's query string and fragment.
 */
export function accountGatewayHref(pathname: string): string {
  const returnTo = safeReturnTo(pathname);
  return `/account?returnTo=${encodeURIComponent(returnTo)}`;
}

export function safeReturnTo(
  value: string | string[] | undefined,
  fallback = "/",
): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  try {
    const destination = new URL(candidate, INTERNAL_ORIGIN);
    if (destination.origin !== INTERNAL_ORIGIN) return fallback;
    if (
      destination.pathname === "/sign-in" ||
      destination.pathname.startsWith("/api/auth")
    ) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
