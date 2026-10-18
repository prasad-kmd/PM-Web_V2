import type { Metadata } from "next";
import Link from "next/link";

import { AuthRedirectGuard } from "@/components/auth/AuthRedirectGuard";
import { RegistrationClosed } from "@/components/auth/RegistrationClosed";
import { SignInCard } from "@/components/auth/SignInCard";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { readSeatState, type SeatState } from "@/lib/auth/registration";
import { AUTH_ROUTES, DEFAULT_SIGNED_IN_PATH } from "@/lib/nav";

/**
 * `/sign-up` — one page, three states, decided on the server.
 *
 * The seat check happens here rather than on the client so there is never a
 * flash of the wrong state. A reader with no seats left must not see a
 * "Create your account" button for a third of a second and then watch it turn
 * into an apology — that reads as a broken site, and it is exactly the kind of
 * thing that makes people try again harder.
 *
 * State is read through `readSeatState()`, which is read-only and tolerates a
 * missing `site_settings` row (a freshly migrated database has none). The row is
 * created by the first genuine sign-up attempt, so this page never writes.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Create your account",
  description: "Registration for this site.",
  robots: { index: false, follow: false },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The seat check, with its failure mode chosen on purpose.
 *
 * If the database cannot be reached, we cannot know whether a seat is free. The
 * page then shows "can't be checked" rather than guessing in either direction:
 * claiming "closed" would be a lie that stops a legitimate reader, and claiming
 * "open" would show a button that is about to fail. Only the *unknown* case gets
 * the third state — an actual refusal from the gate stays a refusal.
 */
async function readSeatStateSafely(): Promise<
  { ok: true; state: SeatState } | { ok: false }
> {
  try {
    return { ok: true, state: await readSeatState() };
  } catch {
    return { ok: false };
  }
}

export default async function SignUpPage({
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

  const seat = await readSeatStateSafely();

  return (
    <div className="flex min-h-[80svh] flex-1 items-center justify-center px-4 py-12 sm:px-8 lg:py-16">
      <AuthRedirectGuard callbackUrl={callbackUrl} />

      {!seat.ok ? (
        <RegistrationClosed variant="unavailable" />
      ) : seat.state.open ? (
        <SignInCard
          callbackUrl={callbackUrl}
          errorCode={errorCode}
          heading="Create your account"
          intro="Signing up is one GitHub authorisation and nothing else — no password, no e-mail to verify. Your GitHub name, avatar and verified address are used as your identity here."
          footer={
            <>
              <p>
                Already registered?{" "}
                <Link
                  href={AUTH_ROUTES.signIn}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <p className="mt-3 text-xs">
                {/* Honest about the gate before the reader hits it, rather than
                    after. `used`/`maxUsers` come from the same row the gate
                    itself reads. */}
                {seat.state.used} of {seat.state.maxUsers}{" "}
                {seat.state.maxUsers === 1 ? "account" : "accounts"} in use. Once
                the limit is reached, registration closes permanently.
              </p>
            </>
          }
        />
      ) : (
        <RegistrationClosed variant="closed" />
      )}
    </div>
  );
}
