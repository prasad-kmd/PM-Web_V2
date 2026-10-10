import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";

export const metadata: Metadata = {
  title: "Access denied",
  description: "You do not have permission to view this page.",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex min-h-[62svh] w-full max-w-4xl items-center justify-center px-4 py-14 sm:px-8">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 text-destructive">
          <ShieldX className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Restricted area
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          Admin access required
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account does not have the administrator role. You can keep
          browsing public pages or return to your member dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
