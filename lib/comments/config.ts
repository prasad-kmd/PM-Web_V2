import type { RateLimitConfig } from "./rate-limit";

/**
 * Environment + tuning for the comments subsystem.
 *
 * PM-Web_V2 reads configuration straight from `process.env` (see
 * `lib/notion-cms.ts`), so this module follows the same convention instead of
 * introducing a schema-validated env object.
 *
 * Required in production:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   public site key, shipped to the browser
 *   TURNSTILE_SECRET_KEY             private key, server only
 *
 * Optional:
 *   COMMENTS_ENABLED            "false" disables posting (reads still work)
 *   COMMENTS_STORE_EMAIL        "false" stores a hash of the email instead of
 *                               the address itself in Notion (default: store it)
 *   COMMENTS_RATE_LIMIT         comments per window (default 3)
 *   COMMENTS_RATE_WINDOW_MS     window length in ms (default 60_000)
 *   COMMENTS_DAILY_LIMIT        comments per IP per 24h (default 12)
 *   COMMENTS_AVATAR_TIMEOUT_MS  per-platform avatar lookup budget (default 3000)
 */

/** Cloudflare's published "always passes" keys, used in development. */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return fallback;
  return raw !== "false" && raw !== "0" && raw !== "no";
}

function int(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name]?.trim() ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const commentConfig = {
  /** Kill switch for the whole posting path. */
  enabled: bool("COMMENTS_ENABLED", true),

  turnstile: {
    /** Public key baked into the client bundle. */
    siteKey:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
      (process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SITE_KEY),
    secretKey: (): string =>
      process.env.TURNSTILE_SECRET_KEY?.trim() ||
      (process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SECRET_KEY),
    verifyUrl: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  },

  /** Keep the raw address in Notion so the site owner can reply. */
  storeEmail: bool("COMMENTS_STORE_EMAIL", true),

  /** Short burst window: stops a script from flooding one page. */
  burst: {
    limit: int("COMMENTS_RATE_LIMIT", 3),
    window: int("COMMENTS_RATE_WINDOW_MS", 60_000),
  } satisfies RateLimitConfig,

  /** Long window: caps how much one IP can post in a day. */
  daily: {
    limit: int("COMMENTS_DAILY_LIMIT", 12),
    window: 24 * 60 * 60 * 1000,
  } satisfies RateLimitConfig,

  /** Outbound budget for each avatar lookup, so a slow CDN can't stall a POST. */
  avatarTimeoutMs: int("COMMENTS_AVATAR_TIMEOUT_MS", 3000),
} as const;

/** Body length limits shared by the client counter and the server validator. */
export const COMMENT_MIN_LENGTH = 3;
export const COMMENT_MAX_LENGTH = 1000;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;
