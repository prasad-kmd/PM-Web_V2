import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { safeReturnTo } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PM-Web account with GitHub.",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    error?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <main className="mx-auto flex min-h-[68svh] w-full max-w-6xl items-center justify-center px-4 py-14 sm:px-8">
      <h1 className="sr-only">Sign in to PM-Web</h1>
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_-48px_color-mix(in_srgb,var(--pm-ink)_42%,transparent)] md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[34rem] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-24 size-[28rem] rounded-full border border-current/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-4 size-[20rem] rounded-full border border-current/15"
          />
          <div className="relative">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/70">
              PM-Web · Member access
            </p>
            <p className="mt-10 max-w-sm font-display text-4xl font-semibold leading-tight tracking-tight">
              A home for your engineering notes and saved work.
            </p>
          </div>
          <p className="relative max-w-sm text-sm leading-6 text-primary-foreground/75">
            Public pages remain open to everyone. An account is only needed for
            member features such as a personal dashboard and signed-in comments.
          </p>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
          <Link
            href={returnTo}
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to the page
          </Link>

          <div className="mb-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Member sign-in
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Continue with GitHub. New members are registered automatically;
              there is no email or password sign-in.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-foreground"
            >
              GitHub sign-in did not complete. If you are a new member, the site
              may have reached its 50-account limit. Existing members can still
              sign in.
            </div>
          ) : null}

          <GitHubSignInButton returnTo={returnTo} enabled={githubEnabled} />

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/35 p-4">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              OAuth is handled by GitHub. Your account avatar comes from your
              GitHub profile; this site does not accept profile image uploads.
            </p>
          </div>

          <p className="mt-7 text-xs leading-5 text-muted-foreground">
            You can continue reading public pages or use guest comments without
            signing in.
          </p>
        </div>
      </section>
    </main>
  );
}
