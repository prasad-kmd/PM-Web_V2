import { Shield, User as UserIcon } from "lucide-react";
import Image from "next/image";

import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Button } from "@/components/ui/button";
import { deleteAccount, setRole } from "@/app/admin/actions";
import type { AccountRow } from "@/lib/admin/queries";

/**
 * `/admin/users` — every account, with the two things an operator actually does.
 *
 * Adapted from React Bits Pro `app-ui/data-table-*`: the header row, the row
 * actions, the empty state. Three things about the blocks were not taken:
 *
 * 1. **No client-side sorting, filtering or pagination.** With a seat limit in
 *    the single digits, all three would be code that never runs. The table is
 *    ordered by join date on the server and rendered whole.
 * 2. **No fake data.** The blocks ship a literal array of people; this reads the
 *    database.
 * 3. **The row actions are `<form>`s, not `onClick` handlers.** Each is a real
 *    POST to a server action, so the account list is operable with JavaScript
 *    off — and every action re-checks `requireAdmin()` on the server, because
 *    being *shown* a button is not authorisation.
 *
 * A server component. Nothing here holds state; the only client code on the page
 * is the confirmation on the delete button.
 */

/** Fixed locale and zone, so the table renders identically for everyone. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: Date | null): string {
  return value ? DATE_FORMAT.format(value) : "—";
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  const Icon = isAdmin ? Shield : UserIcon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-soft">
      <Icon className="size-3" aria-hidden />
      {isAdmin ? "Administrator" : "Member"}
    </span>
  );
}

export function AccountsTable({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[];
  /** Marks the operator's own row — it is the one deletion that signs you out. */
  currentUserId: string;
}) {
  if (accounts.length === 0) {
    return (
      <p className="rounded-2xl border border-border/70 bg-card/60 p-8 text-center text-sm text-ink-soft">
        No accounts yet. The first person to sign in creates one, and the seat
        gate closes registration behind them.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/60">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <caption className="sr-only">
          Accounts, ordered by the date they were created.
        </caption>
        <thead>
          <tr className="border-b border-border/70 text-left">
            <th scope="col" className="px-4 py-3 font-medium text-ink-soft">
              Account
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-soft">
              Role
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-soft">
              Joined
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-soft">
              Last sign-in
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-ink-soft">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const isSelf = account.id === currentUserId;
            const nextRole = account.role === "admin" ? "user" : "admin";

            return (
              <tr
                key={account.id}
                className="border-b border-border/40 last:border-0"
              >
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="flex items-center gap-3">
                    {account.image ? (
                      <Image
                        src={account.image}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-ink-soft"
                        aria-hidden
                      >
                        {account.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="grid leading-tight">
                      <span className="font-medium text-ink">
                        {account.name}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-ink-soft">
                            (you)
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {account.email}
                      </span>
                    </span>
                  </span>
                </th>

                <td className="px-4 py-3">
                  <RoleBadge role={account.role} />
                </td>

                <td className="px-4 py-3 text-ink-soft">
                  {formatDate(account.createdAt)}
                </td>

                <td className="px-4 py-3 text-ink-soft">
                  <span className="grid leading-tight">
                    <span>{formatDate(account.lastSessionAt)}</span>
                    <span className="text-xs">
                      {account.sessionCount}{" "}
                      {account.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {/* The role change is a real form post. Hidden fields carry
                        the row; the server decides everything else. */}
                    <form action={setRole}>
                      <input type="hidden" name="userId" value={account.id} />
                      <input type="hidden" name="role" value={nextRole} />
                      <Button type="submit" variant="outline" size="sm">
                        {nextRole === "admin"
                          ? "Promote to admin"
                          : "Demote to member"}
                      </Button>
                    </form>

                    <form action={deleteAccount}>
                      <input type="hidden" name="userId" value={account.id} />
                      <ConfirmSubmit
                        confirm={
                          isSelf
                            ? "Remove your own account?"
                            : `Remove ${account.name}?`
                        }
                        confirmDescription={
                          isSelf
                            ? "You lose access immediately. Another administrator would have to add you back."
                            : "Their sessions are deleted with the account. This cannot be undone."
                        }
                        confirmAction="Remove"
                      >
                        Remove
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
