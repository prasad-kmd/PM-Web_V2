import { Clock, KeyRound, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getAdminOverview } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/server";
import { AUTH_ROUTES } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * `/admin` — the overview.
 *
 * Adapted from React Bits Pro `app-ui/dashboard-1`: a row of compact facts above
 * the detail. The block's revenue chart, range selector, sparklines and fake
 * deltas are gone — there is nothing here to trend, and a chart drawn from two
 * data points would be decoration pretending to be information.
 *
 * What each card answers, in the order an operator asks:
 *
 *   1. How many accounts are there, and how many can administer the site?
 *   2. How many seats are used, out of how many?
 *   3. Is registration open — and if not, *why* not?
 *   4. When did anyone last sign in?
 *
 * Card 3 is the one that needs care. "Registration: closed" alone is a bug
 * report waiting to happen; the two reasons it can be closed are different
 * problems with different fixes, so the card always says which one applies.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const CARD =
  "rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm";

function Card({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(CARD, className)} aria-label={label}>
      <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </h2>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{hint}</p>
    </section>
  );
}

export default async function AdminOverviewPage() {
  // The layout already validated this; the page re-reads it for the greeting, and
  // the read is memoised, so it costs nothing.
  const session = await requireAdmin(AUTH_ROUTES.admin);
  const overview = await getAdminOverview();

  const { seats, totalUsers, totalAdmins, lastSignIn, settingsUpdated } = overview;

  const remaining = Math.max(0, seats.maxUsers - seats.used);
  const seatsExhausted = remaining === 0;

  return (
    <div className="space-y-8">
      <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
        Signed in as{" "}
        <span className="font-medium text-ink">
          {session.user.email ?? session.user.name}
        </span>
        . Everything on these pages is also reachable by SQL —{" "}
        <Link
          href="/admin/settings"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          the settings page
        </Link>{" "}
        is the version you will actually want.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon={Users}
          label="Accounts"
          value={String(totalUsers)}
          hint={
            totalAdmins === totalUsers
              ? "Every account is an administrator."
              : `${totalAdmins} of them can administer the site.`
          }
        />

        <Card
          icon={KeyRound}
          label="Seats"
          value={`${seats.used} / ${seats.maxUsers}`}
          hint={
            seatsExhausted
              ? "Full. Raise the limit on the settings page to allow another account."
              : `${remaining} seat${remaining === 1 ? "" : "s"} left before registration closes.`
          }
        />

        <Card
          icon={ShieldCheck}
          label="Registration"
          value={seats.open ? "Open" : "Closed"}
          hint={
            seats.open
              ? "A new GitHub account can still create one."
              : !seats.signupEnabled
                ? "Closed deliberately — the toggle on the settings page is off."
                : "Closed by the seat limit, not by the toggle."
          }
        />

        <Card
          icon={Clock}
          label="Last sign-in"
          value={lastSignIn ? DATE_FORMAT.format(lastSignIn.at) : "Never"}
          hint={
            lastSignIn
              ? `${lastSignIn.name} · ${lastSignIn.email}`
              : "Nobody has signed in on this database yet."
          }
        />
      </div>

      <section className={CARD} aria-labelledby="settings-changed-heading">
        <h2
          id="settings-changed-heading"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          Seat configuration
        </h2>
        {settingsUpdated ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Last changed {DATE_FORMAT.format(settingsUpdated.at)}
            {settingsUpdated.by ? (
              <>
                {" "}
                by{" "}
                <span className="font-medium text-ink">{settingsUpdated.by}</span>
              </>
            ) : (
              " — before this page recorded who made changes"
            )}
            .
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Nothing has changed the seat configuration on this database yet, so
            the defaults apply: one account, registration open until it is taken.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Change the seat limit
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Manage accounts
          </Link>
        </div>
      </section>
    </div>
  );
}
