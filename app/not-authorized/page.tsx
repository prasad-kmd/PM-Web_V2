import { ArrowLeft, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { AUTH_ROUTES } from "@/lib/nav";

/**
 * `/not-authorized` — a signed-in reader who is not an admin.
 *
 * Adapted from React Bits Pro `blocks/404/404-3`: the numeral is drawn twice, a
 * blurred copy behind a sharp one, each clipped by an opposing gradient mask so
 * the glyph dissolves at both ends. The block's framer entrance is dropped in
 * favour of a CSS fade gated on `motion-safe:`, which keeps this a server
 * component — a 403 page has nothing to hydrate.
 *
 * The numeral is `aria-hidden` and the heading carries the meaning, so a screen
 * reader gets "You don't have access to that page" rather than "four zero three".
 *
 * **This page is reached by both paths, and they differ:**
 *
 * - a signed-in non-admin → arrives here with `?from=`, and the copy names the
 *   page they tried to open;
 * - anyone else who types the URL → no `from`, and the copy stays general.
 *
 * It never offers "sign in again". The reader *is* signed in; sending them back
 * through GitHub would be a loop that teaches them nothing.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Not authorised",
  description: "You do not have access to that page.",
  robots: { index: false, follow: false },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NotAuthorizedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Sanitised, then only ever shown as escaped text. `null` when the value was
  // missing or unsafe, which is also the signal to use the general copy.
  const from = first(params.from)
    ? sanitizeCallbackUrl(first(params.from), "/")
    : null;

  return (
    <div className="flex min-h-[80svh] flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
      <div className="relative select-none">
        <span
          aria-hidden
          className="block text-[110px] font-bold leading-none tracking-tight text-ink motion-safe:animate-[pm-fade-in_0.8s_ease-out] sm:text-[190px]"
          style={{
            filter: "blur(14px)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 60%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)",
          }}
        >
          403
        </span>
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[110px] font-bold leading-none tracking-tight text-ink motion-safe:animate-[pm-fade-in_0.6s_ease-out] sm:text-[190px]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 65%)",
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 65%)",
          }}
        >
          403
        </span>
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        You don&rsquo;t have access to that page.
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
        {from ? (
          <>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-ink">
              {from}
            </code>{" "}
            is restricted to the site owner. You are signed in — your account
            just is not an administrator.
          </>
        ) : (
          <>That area is restricted to the site owner. If you were sent a link
            to it, ask them for one you can actually open.</>
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={AUTH_ROUTES.dashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Your dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the site
        </Link>
      </div>
    </div>
  );
}
