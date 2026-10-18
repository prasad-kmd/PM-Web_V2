/**
 * `?error=` → human copy.
 *
 * better-auth sends a reader back to the sign-in page with `?error=<code>` when
 * a sign-in fails (the redirect target comes from `errorCallbackURL`, set on the
 * client call in `SignInCard`). The codes are a small fixed vocabulary; the
 * copy lives here so the sign-in card, the sign-up card and `/not-authorized`
 * all say the same thing.
 *
 * **Unmapped codes are never echoed.** A link to
 * `/sign-in?error=Your+account+is+locked%2C+call+1-800-…` would otherwise render
 * attacker-authored text on our own page, wearing our own styling — a
 * ready-made phishing surface. Only codes matching the shape of a real
 * better-auth code are shown at all, and only as a short token.
 */

export type AuthErrorCopy = {
  /** One short line, rendered in bold. */
  title: string;
  /** The next step, or what happened. */
  detail: string;
};

const MESSAGES: Record<string, AuthErrorCopy> = {
  access_denied: {
    title: "Sign-in cancelled",
    detail:
      "Nothing happened — you closed the GitHub screen, or the account does not have access to the app. Try again whenever you are ready.",
  },
  REGISTRATION_CLOSED: {
    title: "Registration is closed",
    detail:
      "This site has a fixed number of accounts and they are all taken. If you already have one, sign in with the GitHub account you registered with.",
  },
  state_not_found: {
    title: "The sign-in took too long",
    detail:
      "The GitHub screen was left open for more than ten minutes, so the request expired. Start again — it only takes a moment.",
  },
  state_mismatch: {
    title: "The sign-in could not be verified",
    detail:
      "Something interfered with the request between GitHub and here. Try again; if it keeps happening, check that cookies are enabled for this site.",
  },
  invalid_code: {
    title: "That sign-in link was already used",
    detail: "Start again from the button below — nothing is broken.",
  },
  redirect_uri_mismatch: {
    title: "The GitHub app is misconfigured",
    detail:
      "The registered callback URL does not match this site. This one is for the site owner, not you: check the Authorization callback URL on the GitHub OAuth app (docs/auth-setup.md §1).",
  },
  unable_to_get_user_info: {
    title: "GitHub did not return a profile",
    detail:
      "Your account details could not be read. If you restricted access to your e-mail address, allow it — or sign in with an account that has a public e-mail.",
  },
  account_not_linked: {
    title: "This account is already linked elsewhere",
    detail:
      "That GitHub account is attached to a different profile on this site, and automatic linking is off for safety.",
  },
  network_error: {
    title: "The request did not reach the server",
    detail: "Check your connection and try again. Nothing was changed.",
  },
};

/** The fallback for a code that is real but has no copy written for it yet. */
const UNKNOWN: AuthErrorCopy = {
  title: "Sign-in did not complete",
  detail:
    "Something went wrong at GitHub's end or on the way back. Try again — if it keeps happening, the site owner can find the code in the server log.",
};

/** Bounds what may be echoed: a code-shaped token, never a sentence. */
const CODE_SHAPE = /^[A-Za-z0-9_]{1,40}$/;

/**
 * Describes an `?error=` value.
 *
 * @returns `null` when there is no error to show, so the caller can render the
 *   error slot conditionally without a second check.
 */
export function describeAuthError(
  code: string | null | undefined,
): AuthErrorCopy | null {
  if (!code) return null;

  const known = MESSAGES[code];
  if (known) return known;

  if (CODE_SHAPE.test(code)) {
    return { ...UNKNOWN, detail: `${UNKNOWN.detail} (Code: ${code})` };
  }

  // Not code-shaped: do not render it, not even as a token.
  return UNKNOWN;
}
