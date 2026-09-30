import { commentConfig } from "./config";
import type { CommenterIdentity, SocialPlatform } from "./types";

/**
 * Resolves a profile image for a guest commenter.
 *
 * PM-Web_V2 has no accounts, so the only signal available is the optional
 * social handle the visitor typed. Each platform is probed server-side and the
 * resulting image URL is stored alongside the comment in Notion, which lets the
 * site render real avatars without ever proxying a user's image itself.
 *
 * Resolution is best-effort and always fails open to `null` (the UI then draws
 * a deterministic initials avatar):
 *
 *   github    `https://github.com/{user}.png` 302-redirects to the canonical
 *             `avatars.githubusercontent.com/u/{id}` — a stable, short URL.
 *             A 404 means the account does not exist.
 *   twitter   `api.fxtwitter.com/{handle}` returns public profile JSON,
 *             including `avatar_url`. Accounts still on Twitter's stock
 *             placeholder are treated as "no avatar".
 *   linkedin  LinkedIn blocks anonymous profile lookups, so this goes through
 *             unavatar.io with `fallback=false`. It resolves for profiles
 *             unavatar has seen and 404s otherwise — expect misses here.
 */

/** Probe order: first platform that yields an image wins. */
export const AVATAR_PLATFORMS: SocialPlatform[] = [
  "github",
  "linkedin",
  "twitter",
];

/** Hosts that are allowed to appear in a stored avatar URL. */
const ALLOWED_AVATAR_HOSTS = new Set([
  "avatars.githubusercontent.com",
  "pbs.twimg.com",
  "abs.twimg.com",
  "media.licdn.com",
  "unavatar.io",
]);

/** Twitter's stock silhouette — not a real profile photo. */
const TWITTER_PLACEHOLDER = "default_profile_images";

/** Characters accepted in a handle; anything else is rejected up front. */
const HANDLE_RE = /^[A-Za-z0-9_.-]{1,64}$/;

export function normalizeHandle(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^@+/, "");
  return HANDLE_RE.test(trimmed) ? trimmed : null;
}

function withTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(commentConfig.avatarTimeoutMs),
    headers: { "user-agent": "PM-Web_V2/2.7 (+https://prasadk.xyz)" },
    ...init,
  });
}

/** Only https URLs on hosts we are willing to render. */
function safeAvatarUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED_AVATAR_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function resolveGithub(handle: string): Promise<string | null> {
  const res = await withTimeout(
    `https://github.com/${encodeURIComponent(handle)}.png`,
  );
  if (res.status !== 301 && res.status !== 302) return null;

  const location = res.headers.get("location");
  if (!location) return null;

  // Drop the `?v=4` cache-buster so the stored URL stays short and stable.
  const canonical = location.split("?")[0];
  return safeAvatarUrl(canonical);
}

async function resolveTwitter(handle: string): Promise<string | null> {
  const res = await withTimeout(
    `https://api.fxtwitter.com/${encodeURIComponent(handle)}`,
    { redirect: "follow" },
  );
  if (!res.ok) return null;

  const payload = (await res.json().catch(() => null)) as {
    user?: { avatar_url?: string };
  } | null;

  const url = payload?.user?.avatar_url;
  if (!url || url.includes(TWITTER_PLACEHOLDER)) return null;
  return safeAvatarUrl(url);
}

async function resolveLinkedin(handle: string): Promise<string | null> {
  const res = await withTimeout(
    `https://unavatar.io/linkedin/${encodeURIComponent(handle)}?fallback=false`,
    { redirect: "follow" },
  );
  if (!res.ok) return null;
  // unavatar proxies the image itself, so the request URL is the avatar URL.
  return safeAvatarUrl(
    `https://unavatar.io/linkedin/${encodeURIComponent(handle)}`,
  );
}

const RESOLVERS: Record<
  SocialPlatform,
  (handle: string) => Promise<string | null>
> = {
  github: resolveGithub,
  linkedin: resolveLinkedin,
  twitter: resolveTwitter,
};

export type AvatarResolution = {
  avatar: string | null;
  source: SocialPlatform | null;
  handle: string | null;
};

/**
 * Probes every platform the visitor supplied, in priority order, and returns
 * the first image that resolves. Runs the lookups concurrently so a slow
 * platform only costs its own timeout.
 */
export async function resolveCommenterAvatar(
  identity: CommenterIdentity,
): Promise<AvatarResolution> {
  const candidates = AVATAR_PLATFORMS.map((platform) => ({
    platform,
    handle: normalizeHandle(identity[platform]),
  })).filter((entry): entry is { platform: SocialPlatform; handle: string } =>
    Boolean(entry.handle),
  );

  if (candidates.length === 0) {
    return { avatar: null, source: null, handle: null };
  }

  const results = await Promise.allSettled(
    candidates.map((entry) => RESOLVERS[entry.platform](entry.handle)),
  );

  for (const [index, result] of results.entries()) {
    const candidate = candidates[index];
    if (!candidate) continue;
    if (result.status === "fulfilled" && result.value) {
      return {
        avatar: result.value,
        source: candidate.platform,
        handle: candidate.handle,
      };
    }
    if (result.status === "rejected") {
      console.warn(
        `[comments] avatar lookup failed for ${candidate.platform}:${candidate.handle}:`,
        result.reason,
      );
    }
  }

  // Handles were supplied but nothing resolved — still remember the first
  // handle so the UI can link to the profile even without an image.
  const first = candidates[0];
  return { avatar: null, source: null, handle: first?.handle ?? null };
}
