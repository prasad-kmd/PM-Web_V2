import { commentConfig } from "./config";

/**
 * Server half of the Cloudflare Turnstile check, ported from
 * PMEngineerLK-NextJS (`lib/validation/validate.ts#verifyTurnstile`).
 */

type SiteverifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
};

/**
 * Exchanges a widget token for a verdict.
 *
 * Returns `false` whenever the secret is missing in production — an
 * unconfigured deployment must not silently accept every comment. In
 * development it falls back to Cloudflare's always-pass test key so local work
 * does not need a Turnstile account.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = commentConfig.turnstile.secretKey();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[comments] TURNSTILE_SECRET_KEY is not set — rejecting comment.",
      );
      return false;
    }
    console.warn(
      "[comments] TURNSTILE_SECRET_KEY is not set — using the Cloudflare test key.",
    );
    return true;
  }

  if (!token) return false;

  try {
    const response = await fetch(commentConfig.turnstile.verifyUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(
        `[comments] Turnstile siteverify responded ${response.status}.`,
      );
      return false;
    }

    const data = (await response.json()) as SiteverifyResponse;
    if (!data.success && data["error-codes"]?.length) {
      console.warn("[comments] Turnstile rejected token:", data["error-codes"]);
    }
    return Boolean(data.success);
  } catch (error) {
    console.error("[comments] Turnstile verification error:", error);
    return false;
  }
}
