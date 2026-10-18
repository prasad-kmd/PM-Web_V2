"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ComponentProps } from "react";

import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { AUTH_ROUTES } from "@/lib/nav";

/**
 * The one sanctioned way to send a reader to sign in.
 *
 * Roadmap item 4 — "after signing in, return to the page they were on" — failed
 * in the reference implementation because every call site wrote
 * `window.location.href = "/sign-in"` by hand and simply forgot the destination.
 * A rule of "remember to add `?callbackUrl=`" is a rule that gets broken; this
 * component cannot forget, because it reads the current location itself.
 *
 *   <SignInButton>Sign in with GitHub</SignInButton>
 *
 * Use it in every nav surface, every call to action, and anywhere else a
 * signed-out reader is invited to sign in. A raw `<Link href="/sign-in">` is the
 * bug this exists to prevent — the sanitising and the encoding both live inside.
 *
 * `callbackUrl` may be overridden for a deliberate destination (e.g. a page that
 * wants sign-in to land somewhere other than itself). It is still sanitised, so
 * an override cannot become an open redirect.
 */

type SignInButtonProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Override the destination. Defaults to the page the reader is on. */
  callbackUrl?: string;
};

export function SignInButton({
  callbackUrl,
  children,
  ...rest
}: SignInButtonProps) {
  // `useSearchParams()` requires a Suspense boundary above it during static
  // rendering. Rather than push that requirement onto every call site — where
  // forgetting it is a build error — the boundary lives here, inside the
  // component that needs it. The fallback is the same link without the
  // destination, so there is no layout shift while it resolves.
  return (
    <Suspense
      fallback={
        <Link href={AUTH_ROUTES.signIn} {...rest}>
          {children}
        </Link>
      }
    >
      <CurrentLocationSignInButton callbackUrl={callbackUrl} {...rest}>
        {children}
      </CurrentLocationSignInButton>
    </Suspense>
  );
}

function CurrentLocationSignInButton({
  callbackUrl: override,
  children,
  ...rest
}: SignInButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const here = search ? `${pathname}?${search}` : pathname;

  // Sanitised even when it came from `usePathname()`, and *especially* when it
  // came from the `callbackUrl` override — a caller must not be able to turn
  // this component into an open redirect.
  const destination = sanitizeCallbackUrl(override ?? here, "/");

  return (
    <Link
      href={{ pathname: AUTH_ROUTES.signIn, query: { callbackUrl: destination } }}
      {...rest}
    >
      {children}
    </Link>
  );
}
