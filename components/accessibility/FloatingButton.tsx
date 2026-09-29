"use client";

import { Accessibility } from "lucide-react";
import type { ComponentProps } from "react";
import GlareHover from "@/components/reactbits/GlareHover";
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
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)_+_5.5rem)] z-40 lg:right-8 lg:bottom-8">
      <GlareHover
        width="auto"
        height="auto"
        background="var(--pm-card)"
        borderColor="var(--pm-border)"
        borderRadius="0.75rem"
        glareAngle={-30}
        glareOpacity={0.28}
        glareSize={220}
        className="border shadow-lg shadow-black/5"
      >
        <button
          type="button"
          {...props}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-primary uppercase transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            className,
          )}
        >
          <Accessibility aria-hidden="true" className="size-4" />
          A11Y
        </button>
      </GlareHover>
    </div>
  );
}
