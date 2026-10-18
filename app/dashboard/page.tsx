import { BookmarkIcon, MessageSquare, Shield, Wrench, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/auth/server";
import { AUTH_ROUTES } from "@/lib/nav";

/**
 * `/dashboard` — the signed-in landing page.
 *
 * Structure borrowed from React Bits Pro `app-ui/dashboard/dashboard-1`: a page
 * header, a row of compact fact cards, then a content grid. The block's revenue
 * metrics, sparklines and fake ranges are all gone — there is no business here to
 * measure. The cards carry facts that are actually true (account, role, join
 * date) and the grid links to what exists.
 *
 * Rendered inside the existing `SiteShell`, which is applied once in
 * `app/layout.tsx`. The block ships its own sidebar and app shell; nesting a
 * second one would give the site two navigation rails and two things competing
 * for the same screen edges.
 *
 * `requireUser` is the real gate. `proxy.ts` also redirects, but it is a
 * convenience: anything reaching this component directly must still be refused,
 * so the check happens here as well.
 */

/** `?welcome=1` is set by `newUserCallbackURL` — a first sign-in. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your account on PrasadM.",
  robots: { index: false, follow: false },
};

/**
 * Fixed locale and time zone: the server's locale is not the reader's, and a
 * date that renders differently on each side of hydration is a mismatch warning
 * for no benefit.
 */
const JOINED_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const CARD_CLASS =
  "rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireUser("/dashboard");

  const params = await searchParams;
  const isWelcome = params.welcome === "1";

  const { user } = session;
  const isAdmin = user.role === "admin";
  const displayName = user.name?.trim() || "there";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8 lg:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {isWelcome ? `Welcome, ${displayName}.` : `Hello, ${displayName}.`}
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
            {isWelcome
              ? "Your account is set up. It is the only one on this site, which is why registration closed behind you."
              : "Your account, and the parts of the site that are yours."}
          </p>
        </div>

        <SignOutButton className="w-auto rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-muted w-full justify-center sm:w-auto" />
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <section className={CARD_CLASS} aria-labelledby="account-heading">
          <h2 id="account-heading" className="sr-only">
            Account
          </h2>
          <div className="flex items-center gap-3">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <span
                className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                aria-hidden
              >
                {displayName[0]?.toUpperCase() ?? "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{displayName}</p>
              {user.email ? (
                <p className="truncate text-xs text-ink-soft">{user.email}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className={CARD_CLASS} aria-labelledby="role-heading">
          <h2
            id="role-heading"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-soft"
          >
            <Shield className="size-3.5" aria-hidden />
            Role
          </h2>
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
            {isAdmin ? "Administrator" : "Member"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            {isAdmin ? (
              <>
                Set in the database.{" "}
                <Link
                  href={AUTH_ROUTES.admin}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open the admin area
                </Link>
                .
              </>
            ) : (
              "Promotion to administrator is a deliberate database change, not something this page can grant."
            )}
          </p>
        </section>

        <section className={CARD_CLASS} aria-labelledby="joined-heading">
          <h2
            id="joined-heading"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-soft"
          >
            <CalendarDays className="size-3.5" aria-hidden />
            Signed in
          </h2>
          {/* Session start, not account creation: the session is what this page
              was handed, and guessing at a join date from it would be wrong. */}
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
            {JOINED_FORMAT.format(new Date(session.session.createdAt))}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Session started. Signing out ends it on this device only.
          </p>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          What being signed in gives you
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/bookmarks"
            className={`${CARD_CLASS} group transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
          >
            <BookmarkIcon className="size-5 text-ink-soft" aria-hidden />
            <p className="mt-3 font-medium text-ink">Your bookmarks</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Kept on this device and now tied to your account, so they survive
              a cleared browser.
            </p>
          </Link>

          <div className={CARD_CLASS}>
            <MessageSquare className="size-5 text-ink-soft" aria-hidden />
            <p className="mt-3 font-medium text-ink">Comments under your name</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Signed-in comments arrive prefilled and carry an Owner badge, so it
              is clear which remarks are yours.
            </p>
          </div>

          <div className={`${CARD_CLASS} sm:col-span-2`}>
            <Wrench className="size-5 text-ink-soft" aria-hidden />
            <p className="mt-3 font-medium text-ink">Tools — still coming</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              The invoice generator and the rest are not built yet.{" "}
              <Link
                href="/tools"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                See what is planned
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
