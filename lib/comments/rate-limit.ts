/**
 * In-memory sliding-window rate limiter.
 *
 * Ported from PMEngineerLK-NextJS (`lib/rate-limit.ts`) and extended: the
 * reference keyed buckets by authenticated user id, but PM-Web_V2 has no
 * accounts, so callers key on the client IP and the submitted email instead.
 *
 * ⚠️  Scope: the map lives in the serverless instance, so limits are
 * per-instance and reset on cold start. That is deliberate — it keeps the
 * feature dependency-free. Cloudflare Turnstile plus the honeypot field are
 * the real bot gate. If you deploy on a platform with many concurrent
 * instances and need hard limits, swap `record()` for an Upstash/KV call; the
 * `RateLimitResult` shape is designed to be swappable.
 */

export type RateLimitConfig = {
  /** Max hits allowed inside `window`. */
  limit: number;
  /** Window length in milliseconds. */
  window: number;
};

export type RateLimitResult = {
  limited: boolean;
  /** Milliseconds until the oldest hit leaves the window. */
  retryAfterMs: number;
  remaining: number;
};

/** Buckets keyed by `bucket:identifier`. */
const hits = new Map<string, number[]>();

/** Drops fully-expired buckets so the map cannot grow without bound. */
function sweep(now: number, maxAgeMs: number): void {
  if (hits.size < 512) return;
  for (const [key, timestamps] of hits) {
    if (timestamps.every((ts) => now - ts >= maxAgeMs)) hits.delete(key);
  }
}

/**
 * Records a hit for `key` against `config` and reports whether the caller is
 * now over the limit. A hit is recorded even when the call is rejected, so
 * hammering the endpoint keeps extending the penalty.
 */
export function recordHit(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  sweep(now, config.window);

  const id = `${bucket}:${key}`;
  const windowStart = now - config.window;
  const recent = (hits.get(id) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= config.limit) {
    const oldest = recent[0] ?? now;
    return {
      limited: true,
      retryAfterMs: Math.max(0, oldest + config.window - now),
      remaining: 0,
    };
  }

  recent.push(now);
  hits.set(id, recent);
  return {
    limited: false,
    retryAfterMs: 0,
    remaining: Math.max(0, config.limit - recent.length),
  };
}

/**
 * Reads the current limit state for `key` without recording a hit.
 * Used to surface "you can post again in ~30s" in the UI.
 */
export function peek(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.window;
  const recent = (hits.get(`${bucket}:${key}`) ?? []).filter(
    (ts) => ts > windowStart,
  );
  if (recent.length >= config.limit) {
    const oldest = recent[0] ?? now;
    return {
      limited: true,
      retryAfterMs: Math.max(0, oldest + config.window - now),
      remaining: 0,
    };
  }
  return {
    limited: false,
    retryAfterMs: 0,
    remaining: config.limit - recent.length,
  };
}

/** Test/ops helper — clears every bucket. */
export function resetRateLimits(): void {
  hits.clear();
}
