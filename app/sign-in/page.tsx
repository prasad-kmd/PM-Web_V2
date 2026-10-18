import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthRedirectGuard } from "@/components/auth/AuthRedirectGuard";
import { SignInCard } from "@/components/auth/SignInCard";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { siteConfig } from "@/lib/config";
import { AUTH_ROUTES, DEFAULT_SIGNED_IN_PATH } from "@/lib/nav";

/**
 * `/sign-in` — the adapted React Bits Pro `blocks/auth/auth-2` split layout:
 * a branded panel on the left, the provider column on the right.
 *
 * What changed from the block, and why:
 *
 * - **The Unsplash placeholder is gone.** It was a hot-linked third-party image
 *   on an auth page — an external dependency at the worst moment, and a request
 *   to a host the site does not control. Replaced with `Glassy-sky.webp`, which
 *   is already a site asset used by the homepage section backdrops.
 * - **Nothing animates a canvas here.** `aurora-blur` was the other candidate
 *   and it is WebGL via `@react-three/fiber`; a sign-in page is exactly where a
 *   reader wants the page to be instant, and where an accessibility pass should
 *   not have to reason about a shader. The block's Framer entrances survive,
 *   gated on `useReducedMotion()` inside the card.
 * - **The split collapses below `lg`.** On a phone there is one column: the
 *   form. Nobody signs in to look at a photograph.
 *
 * `searchParams` is a Promise in Next 16 and has to be awaited. Both values are
 * treated as untrusted: `callbackUrl` goes through the sanitiser, and `error`
 * is only ever rendered through `describeAuthError`, which refuses to echo
 * anything that is not shaped like a real code.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PrasadM with GitHub.",
  // Never indexed: there is nothing here for a search engine, and a sign-in
  // page in an index looks like a phishing result.
  robots: { index: false, follow: false },
};

/** Reads the first value of a query parameter, which may legally be an array. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const callbackUrl = sanitizeCallbackUrl(
    first(params.callbackUrl),
    DEFAULT_SIGNED_IN_PATH,
  );
  const errorCode = first(params.error) ?? null;

  return (
    <div className="flex min-h-[80svh] flex-1 items-center justify-center px-4 py-12 sm:px-8 lg:py-16">
      {/* Handles the client-side "already signed in" cases the proxy cannot see
          — back button, second tab, restored session. */}
      <AuthRedirectGuard callbackUrl={callbackUrl} />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-[0_0_60px_-20px_color-mix(in_srgb,var(--pm-ink)_30%,transparent)] backdrop-blur-xl lg:grid-cols-2">
        {/* Branded panel. Decorative, so it is hidden from assistive tech
            entirely — everything in it is repeated by the form column or the
            site chrome. */}
        <div className="relative hidden min-h-[34rem] overflow-hidden lg:block">
          <Image
            src="/img/Glassy-sky.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          {/* Scrim in site tokens rather than a fixed colour, so the panel keeps
              its contrast in both themes and under every accent. */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-background/90"
            aria-hidden
          />

          <div className="relative flex h-full flex-col justify-between p-10">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary font-display text-base font-semibold text-primary-foreground">
                P
              </span>
              <span className="grid leading-tight">
                <span className="font-display text-lg font-medium tracking-tight text-ink">
                  {siteConfig.name}
                </span>
                <span className="text-xs text-ink-soft">
                  {siteConfig.revision}
                </span>
              </span>
            </Link>

            <div>
              <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
                A working archive of
                <br />
                mechanical &amp; mechatronics
                <br />
                engineering.
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
                Sign in to comment under your own name, keep bookmarks across
                devices, and reach the tools.
              </p>
            </div>
          </div>
        </div>

        {/* Form column. */}
        <div className="flex items-center justify-center p-8 sm:p-10 lg:p-14">
          <SignInCard
            callbackUrl={callbackUrl}
            errorCode={errorCode}
            heading="Sign in"
            intro="One account, one provider. No passwords to remember, and no e-mail address to hand over."
            footer={
              <p>
                No account yet?{" "}
                <Link
                  href={AUTH_ROUTES.signUp}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Create one
                </Link>{" "}
                — this site keeps a single seat, so it may already be taken.
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
