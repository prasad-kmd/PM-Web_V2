"use client";

import { Github, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { signIn } from "@/lib/auth-client";
import { describeAuthError } from "@/lib/auth/error-messages";
import { AUTH_ROUTES, DEFAULT_SIGNED_IN_PATH } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The sign-in card — the adapted `auth-2` block's right-hand column.
 *
 * Adapted from React Bits Pro `blocks/auth/auth-2`:
 *
 * | The block | Here |
 * | --------- | ---- |
 * | Apple + Google buttons | Removed. Google would need app verification and e-mail sign-in was ruled out (no budget for verification), so GitHub is the only provider. |
 * | E-mail + password form | Removed for the same reason. |
 * | `console.log` demo handlers | Removed — a real `authClient.signIn.social()` call. |
 * | `neutral-*` palette | Repo tokens (`card`, `ink`, `border`, `primary`), so it follows the accent picker and both themes. |
 * | — | Added the `role="alert"` error slot the block did not have. |
 * | Framer `motion.*` | Kept, but every animation is gated on `useReducedMotion()`. |
 *
 * `callbackUrl` arrives already sanitised from the page. It is not re-read from
 * `window` here on purpose: the value that was checked is the value that gets
 * used.
 */

type SignInCardProps = {
  /** Where to land after a successful sign-in. Sanitised by the caller. */
  callbackUrl: string;
  /** The `?error=` code from a failed callback, if the page passed one. */
  errorCode?: string | null;
  heading: string;
  intro?: string;
  /** Rendered under the button — the seat-gate note, or a link to sign up. */
  footer?: React.ReactNode;
};

export function SignInCard({
  callbackUrl,
  errorCode,
  heading,
  intro,
  footer,
}: SignInCardProps) {
  const [isPending, setIsPending] = useState(false);
  /** Errors raised by this attempt, as opposed to `errorCode` from the redirect. */
  const [localError, setLocalError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;

  // A callback that just failed outranks a stale local message.
  const problem = describeAuthError(errorCode) ?? describeAuthError(localError);

  const rise = (delay: number) =>
    prefersReducedMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: "easeOut" as const },
        };

  async function startGitHubSignIn() {
    setIsPending(true);
    setLocalError(null);

    try {
      const { error } = await signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
        // A first-time visitor has no history to return to, so they get the
        // dashboard with a greeting. A returning one goes back to `callbackUrl`.
        newUserCallbackURL: `${DEFAULT_SIGNED_IN_PATH}?welcome=1`,
        // Load-bearing: without it a failure lands on the dead-end
        // `/api/auth/error` page instead of back here with a sentence a reader
        // can act on (measured — doc 03 §3.14.2).
        errorCallbackURL: AUTH_ROUTES.signIn,
      });

      if (error) {
        setLocalError(error.code ?? "unknown_error");
        setIsPending(false);
      }
      // On success the browser is already navigating to GitHub. `isPending`
      // stays true so the button does not flicker back to its idle state.
    } catch {
      setLocalError("network_error");
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <motion.h1
        {...rise(0)}
        className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
      >
        {heading}
      </motion.h1>

      {intro ? (
        <motion.p
          {...rise(0.05)}
          className="mt-3 text-sm leading-relaxed text-ink-soft"
        >
          {intro}
        </motion.p>
      ) : null}

      {/*
        `role="alert"` + `aria-live` so a screen reader announces a failure that
        appears after the reader has already moved on. Reserved in the layout
        (see the min-height) so the card does not jump when it fills.
      */}
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "mt-6 rounded-xl border px-4 py-3 text-sm transition-colors",
          problem
            ? "border-destructive/40 bg-destructive/10 text-ink"
            : "border-transparent",
        )}
      >
        {problem ? (
          <>
            <p className="font-medium">{problem.title}</p>
            <p className="mt-1 leading-relaxed text-ink-soft">{problem.detail}</p>
          </>
        ) : null}
      </div>

      <motion.div {...rise(0.1)} className="mt-6">
        <button
          type="button"
          onClick={startGitHubSignIn}
          disabled={isPending}
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3",
            "font-medium text-ink transition-colors duration-200",
            "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Github className="size-5" aria-hidden />
          )}
          {isPending ? "Taking you to GitHub…" : "Continue with GitHub"}
        </button>
      </motion.div>

      {footer ? (
        <motion.div {...rise(0.15)} className="mt-6 text-sm text-ink-soft">
          {footer}
        </motion.div>
      ) : null}
    </div>
  );
}
