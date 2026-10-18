import type { Metadata } from "next";

import { AccountsTable } from "@/components/admin/AccountsTable";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { listAccounts } from "@/lib/admin/queries";
import { readNotice } from "@/lib/admin/messages";
import { requireAdmin } from "@/lib/auth/server";

/**
 * `/admin/users` — the account list.
 *
 * The page decides only what to show. Everything about whether an action is
 * *allowed* happens in `lib/admin/users.ts`, inside a transaction, because a
 * form post is a public HTTP request and the page's opinions about it are worth
 * nothing by the time it arrives.
 */

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAdmin("/admin/users");

  const params = await searchParams;
  const accounts = await listAccounts();

  // Only a code is read from the URL; the sentence is looked up. See
  // `lib/admin/messages.ts` for why that indirection exists.
  const notice = readNotice(params.notice, "notice") ?? readNotice(params.error, "error");

  return (
    <div>
      <AdminNotice notice={notice} />

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Accounts
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
            Promotion and removal both take effect on the account&rsquo;s next
            request — <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-ink">
              role
            </code>{" "}
            is read fresh on <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-ink">/admin</code>, not from
            the five-minute session cache.
          </p>
        </div>
      </div>

      <AccountsTable accounts={accounts} currentUserId={session.user.id} />
    </div>
  );
}
