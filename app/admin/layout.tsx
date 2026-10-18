import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/server";
import { AUTH_ROUTES } from "@/lib/nav";

/**
 * The `/admin` shell: one guard for the whole subtree, one header, one nav.
 *
 * Every route under here renders through this layout, so the guard runs on every
 * server request to any of them. The individual pages call `requireAdmin()` as
 * well — not for extra safety in the normal case, but so that a page's
 * protection does not depend on which layout happens to be in scope. Adding a
 * route group, or moving a page, should not be able to quietly remove a gate.
 *
 * That redundancy is free: `lib/auth/server.ts` memoises the session read with
 * React's `cache()`, so the layout and the page share one database query.
 *
 * The route group the roadmap sketched (`app/admin/(panel)/…`) was dropped. It
 * would wrap a single group with a single layout — the same behaviour with an
 * extra directory between the reader and the file.
 */

export const metadata: Metadata = {
  title: "Admin",
  description: "Site administration.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // A signed-out visitor is sent to `/sign-in` carrying this path; a signed-in
  // non-admin goes to `/not-authorized`. In practice `proxy.ts` answers both
  // cases a moment earlier — this is the copy a direct request cannot skip.
  await requireAdmin(AUTH_ROUTES.admin);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:py-14">
      <header className="mb-8 flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Site administration
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Admin
          </h1>
        </div>
        <AdminNav />
      </header>

      {children}
    </div>
  );
}
