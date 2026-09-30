import { headers } from "next/headers";

/**
 * Best-effort client IP extraction.
 *
 * Vercel sets `x-vercel-forwarded-for` / `x-forwarded-for`; Cloudflare sets
 * `cf-connecting-ip`. Falls back to `unknown`, which still yields a usable
 * (if shared) rate-limit bucket.
 */
export async function getClientIp(): Promise<string> {
  const list = await headers();
  const candidates = [
    list.get("x-vercel-forwarded-for"),
    list.get("cf-connecting-ip"),
    list.get("x-real-ip"),
    list.get("x-forwarded-for"),
  ];

  for (const value of candidates) {
    const first = value?.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/** Lower-cased Origin/Referer host, used to reject cross-site POSTs. */
export async function getOriginHost(): Promise<string | null> {
  const list = await headers();
  const origin = list.get("origin") ?? list.get("referer");
  if (!origin) return null;
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}
