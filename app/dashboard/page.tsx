import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { eq } from "drizzle-orm";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "Manage your PM-Web member profile.",
  robots: { index: false, follow: false },
};

function githubAvatarUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "avatars.githubusercontent.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?returnTo=${encodeURIComponent("/dashboard")}`);
  }

  // Read the profile from Postgres rather than trusting a potentially cached
  // session copy; manual role/profile edits should be reflected on refresh.
  const [profile] = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      displayName: user.displayName,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!profile) {
    redirect(`/sign-in?returnTo=${encodeURIComponent("/dashboard")}`);
  }

  const visibleName = profile.displayName?.trim() || profile.name;
  const avatar = githubAvatarUrl(profile.image);
  const memberSince = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(profile.createdAt);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Member workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage the public details attached to your member account. Public
            pages and guest comments remain available without signing in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile.role === "admin" ? (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Admin dashboard
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <ProfileSettingsForm
          initialDisplayName={profile.displayName ?? ""}
          initialBio={profile.bio ?? ""}
          fallbackName={profile.name}
        />

        <aside className="grid gap-5">
          <section
            aria-labelledby="account-summary-heading"
            className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
          >
            <div className="border-b border-border/70 bg-muted/30 px-4 py-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Account
              </p>
              <h2
                id="account-summary-heading"
                className="mt-1 text-base font-semibold text-foreground"
              >
                Account details
              </h2>
            </div>
            <div className="grid gap-4 p-4">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={`${visibleName}'s GitHub profile`}
                    width={56}
                    height={56}
                    sizes="56px"
                    className="size-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-display text-lg font-semibold text-foreground"
                  >
                    {initials(visibleName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {visibleName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    GitHub account
                  </p>
                </div>
              </div>

              <div className="grid gap-1 border-t border-border/70 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Account email
                </p>
                <p className="break-all text-sm text-foreground">
                  {profile.email}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Provided by GitHub; email sign-in and email changes are not
                  enabled.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <span className="text-xs text-muted-foreground">Role</span>
                <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {profile.role === "admin" ? "Administrator" : "Member"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Member since
                </span>
                <span className="text-xs font-medium text-foreground">
                  {memberSince}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/25 p-4">
            <p className="text-sm font-semibold text-foreground">
              Profile image
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your image is read from GitHub. Uploads and arbitrary image URLs
              are intentionally unavailable.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
