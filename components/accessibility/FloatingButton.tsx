"use client";

import { Accessibility } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating trigger for the reading options dialog. It only renders on content
 * detail routes (see `AccessibilityPanel`) and sits above the mobile dock.
 *
 * The element is a real <button>: the dialog trigger passes its own aria and
 * event props straight through, so keyboard and screen-reader users get the
 * usual dialog semantics.
 */
export function FloatingButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Reading options"
      {...props}
      className={cn(
        "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)_+_9rem)] z-40 lg:right-8 lg:bottom-24 inline-flex min-h-11 border border-border bg-card shadow-sm items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-primary uppercase transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Accessibility aria-hidden="true" className="size-4" />
      A11Y
    </button>
  );
}
