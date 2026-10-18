import { CircleAlert, CircleCheck } from "lucide-react";

import type { Notice } from "@/lib/admin/messages";
import { cn } from "@/lib/utils";

/**
 * The result of the action that just ran, shown above the table it affected.
 *
 * The text comes from `lib/admin/messages.ts`, keyed by a code from a closed set
 * — never from the query string itself. See that module for why.
 *
 * `role="alert"` on the failure branch only: an alert interrupts, and a
 * successful save does not need to. The success branch is `role="status"`, which
 * is announced politely and when the reader is ready for it. Getting this the
 * wrong way round is the usual way a form becomes exhausting with a screen
 * reader.
 */
export function AdminNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;

  const Icon = notice.ok ? CircleCheck : CircleAlert;

  return (
    <div
      role={notice.ok ? "status" : "alert"}
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        notice.ok
          ? "border-border bg-muted/50 text-ink"
          : "border-destructive/40 bg-destructive/10 text-ink",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          notice.ok ? "text-ink-soft" : "text-destructive",
        )}
        aria-hidden
      />
      <p className="leading-relaxed">{notice.text}</p>
    </div>
  );
}
