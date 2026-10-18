/**
 * Environment access — the single place the server reads configuration.
 *
 * Two rules, both from RULES.md §5.8 and the v2.9.0 plan (doc 01 §4):
 *
 *   1. **No fallback secrets.** A missing `BETTER_AUTH_SECRET` must stop the
 *      process with an explanation, never silently fall back to a default that
 *      would be identical on every clone.
 *   2. **Fail loudly, and all at once.** Validation reports every missing
 *      variable in one message, so a fresh clone is one edit away from working
 *      rather than one variable per attempt.
 *
 * Values are read through functions rather than frozen at module load where
 * possible, so importing this file never has a side effect beyond the explicit
 * checks in `serverEnv()`.
 */

/** Missing keys are reported in this order. */
const REQUIRED_SERVER_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

/** better-auth signs session tokens with this; a short secret is a weak secret. */
const MIN_SECRET_LENGTH = 32;

/** Trims and treats an empty string as absent — `KEY=` in `.env.local` is a common slip. */
function read(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function missingEnvError(missing: readonly string[]): Error {
  const heading =
    missing.length === 1
      ? `Missing required environment variable: ${missing[0]}`
      : `Missing required environment variables: ${missing.join(", ")}`;

  return new Error(
    [
      heading,
      "",
      "  1. cp .env.local.example .env.local",
      "  2. Fill in the values — the comments in that file say where each comes from",
      "",
      "Auth:     docs/auth-setup.md",
      "Database: docs/database-setup.md",
    ].join("\n"),
  );
}

/** Which of the required variables are absent or blank. Empty means "good to go". */
export function missingRequiredEnv(): readonly string[] {
  return REQUIRED_SERVER_KEYS.filter((key) => read(key) === undefined);
}

/** Throws if anything in {@link REQUIRED_SERVER_KEYS} is missing. */
export function assertServerEnv(): void {
  const missing = missingRequiredEnv();
  if (missing.length > 0) throw missingEnvError(missing);
}

/**
 * The required server configuration, validated.
 *
 * Call this at the top of the module that needs it (see `lib/auth.ts`) rather
 * than at import of this file, so a partial `.env.local` produces one clear
 * error naming every missing key.
 */
export function serverEnv() {
  assertServerEnv();

  // Re-read after the check above. `read()` cannot return undefined here, and
  // each value is narrowed individually rather than asserted with `!`.
  const databaseUrl = read("DATABASE_URL");
  const betterAuthSecret = read("BETTER_AUTH_SECRET");
  const betterAuthUrl = read("BETTER_AUTH_URL");

  if (!databaseUrl || !betterAuthSecret || !betterAuthUrl) {
    // Unreachable: `assertServerEnv()` above throws first. Kept so the types
    // narrow without a non-null assertion.
    throw missingEnvError(REQUIRED_SERVER_KEYS.filter((key) => read(key) === undefined));
  }

  if (betterAuthSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      [
        `BETTER_AUTH_SECRET is ${betterAuthSecret.length} characters; at least ${MIN_SECRET_LENGTH} are required.`,
        "",
        "Generate one with:   openssl rand -base64 32",
        "",
        "Never reuse a secret from another project — it signs session tokens.",
      ].join("\n"),
    );
  }

  if (betterAuthUrl.endsWith("/")) {
    throw new Error(
      `BETTER_AUTH_URL must not end with a slash (got "${betterAuthUrl}"). Use "${betterAuthUrl.replace(/\/+$/, "")}".`,
    );
  }

  return { databaseUrl, betterAuthSecret, betterAuthUrl } as const;
}

/**
 * GitHub is the only OAuth provider, and it is **all-or-nothing**.
 *
 * - Neither variable set → the provider is simply not registered. The site
 *   still builds and every public page works; only sign-in is unavailable.
 * - Both set → the provider is registered.
 * - Exactly one set → a typo. Throw, rather than starting up with a sign-in
 *   button whose only possible outcome is a provider error.
 *
 * The reference implementation instead built a provider with placeholder
 * credentials (`clientId: process.env.GITHUB_CLIENT_ID || "github_id"`) and an
 * `enabled` flag, which turns a configuration mistake into a confusing failure
 * at the end of the OAuth round trip. This is the fix.
 *
 * Deliberately a **function**: this module is imported by page-metadata helpers
 * as well as by `lib/auth.ts`, and a module-level throw would mean a mistyped
 * OAuth variable broke every page that reads the site URL. Only the auth module
 * asks the question, so only the auth module can fail on it.
 */
export function githubOAuthConfig() {
  const clientId = read("GITHUB_CLIENT_ID");
  const clientSecret = read("GITHUB_CLIENT_SECRET");

  if (!clientId && !clientSecret) return { configured: false } as const;

  if (!clientId !== !clientSecret) {
    const missing = clientId ? "GITHUB_CLIENT_SECRET" : "GITHUB_CLIENT_ID";
    throw new Error(
      [
        `GitHub OAuth is half-configured: ${missing} is not set.`,
        "",
        "Set both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or neither.",
        "Neither set means the provider is not registered and sign-in is hidden.",
        "",
        "Setup: docs/auth-setup.md",
      ].join("\n"),
    );
  }

  // Narrowed by the branch above: both are defined here.
  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth configuration is incomplete. See docs/auth-setup.md");
  }

  return { configured: true, clientId, clientSecret } as const;
}

/**
 * Origins allowed to start an auth flow (better-auth's CSRF boundary).
 *
 * Default is exactly the two known origins, deduplicated and stripped of any
 * trailing slash. A LAN address such as `http://192.168.1.20:3000` is
 * deliberately **not** included: reaching the dev server from another device is
 * refused by design, because the GitHub OAuth callback is registered against
 * `localhost`.
 *
 * To test from a phone, set `AUTH_TRUSTED_ORIGINS` to the tunnel or LAN origin
 * **and** update the OAuth app's callback URL to match. Remove it afterwards:
 *
 *   AUTH_TRUSTED_ORIGINS=https://random-words.trycloudflare.com
 */
export function trustedOrigins(): string[] {
  const origins = new Set<string>();

  const add = (value: string | undefined): void => {
    if (!value) return;
    origins.add(value.replace(/\/+$/, ""));
  };

  add(read("BETTER_AUTH_URL"));
  add(read("NEXT_PUBLIC_SITE_URL"));

  for (const extra of (read("AUTH_TRUSTED_ORIGINS") ?? "").split(",")) {
    add(extra.trim());
  }

  return [...origins];
}

/** Absolute site origin, used for metadata and canonical URLs. Local-first. */
export const SITE_URL = (
  read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
).replace(/\/+$/, "");
