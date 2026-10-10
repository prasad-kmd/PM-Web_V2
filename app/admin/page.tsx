import type { Metadata } from "next";
import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";
import { getDb } from "@/lib/db";
import { authUserCapacity, user } from "@/lib/db/schema";
import { MAX_REGISTERED_USERS } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Private PM-Web administration dashboard.",
  robots: { index: false, follow: false },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [capacity] = await getDb()
    .select({
      registeredUsers: authUserCapacity.registeredUsers,
      maxUsers: authUserCapacity.maxUsers,
    })
    .from(authUserCapacity)
    .limit(1);

  if (!capacity) {
    throw new Error("Auth capacity is missing. Apply the database migrations.");
  }

  const [{ actualUsers }] = await getDb()
    .select({ actualUsers: count() })
    .from(user);

  const members = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(MAX_REGISTERED_USERS);

  const capacityPercent = Math.min(
    100,
    Math.round((actualUsers / capacity.maxUsers) * 100),
  );
  const counterMismatch = actualUsers !== capacity.registeredUsers;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Member dashboard
          </Link>
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Private administration
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Admin dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            A read-only overview of registered members and the account cap.
            Administrative access is verified against the database on every
            request.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Administrator
        </span>
      </header>

      <section
        aria-label="Account capacity"
        className="grid gap-4 sm:grid-cols-2"
      >
        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Registered accounts
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
                {actualUsers}
                <span className="ml-1.5 text-base font-medium text-muted-foreground">
                  / {capacity.maxUsers}
                </span>
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-label="Registered account capacity"
            aria-valuemin={0}
            aria-valuemax={capacity.maxUsers}
            aria-valuenow={actualUsers}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {capacity.maxUsers - actualUsers} registration slot
            {capacity.maxUsers - actualUsers === 1 ? "" : "s"} available
          </p>
        </article>

        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Role management
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Promote accounts in the database
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This dashboard does not change roles. Follow the reviewed SQL in the
            admin dashboard guide to assign the `admin` role. That avoids
            exposing a privilege-escalation control in the UI.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Reference: <code>docs/admin-dashboard.md</code> in the repository.
          </p>
        </article>
      </section>

      {counterMismatch ? (
        <p
          role="status"
          className="mt-5 rounded-xl border border-amber-500/35 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-foreground"
        >
          The capacity counter ({capacity.registeredUsers}) does not match the
          user table ({actualUsers}). Review the database triggers before
          changing the account limit.
        </p>
      ) : null}

      <section
        aria-labelledby="member-list-heading"
        className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 bg-muted/30 px-4 py-4 sm:px-5">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Member directory
            </p>
            <h2
              id="member-list-heading"
              className="mt-1 text-lg font-semibold text-foreground"
            >
              Registered accounts
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Newest accounts first · {members.length} shown
          </p>
        </div>

        <div className="divide-y divide-border/70">
          {members.map((member) => (
            <article
              key={member.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {member.displayName?.trim() || member.name}
                </p>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <div className="min-w-0">
                <p className="break-all text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  User ID · {member.id}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {formatDate(member.createdAt)}
                </p>
              </div>
              <span className="w-fit rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
                {member.role === "admin" ? "Administrator" : "Member"}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
