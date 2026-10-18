import { UserRoundX, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { AUTH_ROUTES } from "@/lib/nav";

/**
 * The "no seats left" state for `/sign-up`, and the "cannot tell" state for when
 * the seat check itself fails.
 *
 * Adapted from React Bits Pro `blocks/waitlist/waitlist-2` — composition and
 * spacing, not the form. The block's e-mail capture is deliberately absent: this
 * site has no e-mail sign-in and no mailing list, so an input that collected an
 * address would be collecting something it could never use. A dead form is worse
 * than no form.
 *
 * A server component: there is no state here, and shipping it as a client
 * component would mean hydrating a page whose whole message is a static fact.
 */

type RegistrationClosedProps = {
  variant: "closed" | "unavailable";
};

const COPY = {
  closed: {
    title: "Registration is closed",
    body: "This site keeps a single account, and it has been claimed. That is by design — it is a personal archive, not a platform.",
    aside: "Already registered?",
  },
  unavailable: {
    title: "Registration can't be checked right now",
    body: "The database did not answer, so this page will not guess. Rather than tell you the wrong thing, it is telling you it does not know.",
    aside: "If you already have an account, signing in still works:",
  },
} as const;

export function RegistrationClosed({ variant }: RegistrationClosedProps) {
  const copy = COPY[variant];
  const Icon = variant === "closed" ? UserRoundX : ShieldAlert;

  return (
    <div className="w-full max-w-md text-center">
      <span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/60 text-ink-soft"
        aria-hidden
      >
        <Icon className="size-6" strokeWidth={1.7} />
      </span>

      {/* `role="status"` rather than `alert`: this is the page's whole message,
          present on first paint, not something that interrupts the reader. */}
      <div role="status">
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{copy.body}</p>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        {copy.aside}{" "}
        <Link
          href={AUTH_ROUTES.signIn}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Go to sign in
        </Link>
      </p>

      <p className="mt-6 text-xs text-ink-soft">
        <Link
          href="/"
          className="underline-offset-4 hover:underline"
        >
          Back to the site
        </Link>
      </p>
    </div>
  );
}
