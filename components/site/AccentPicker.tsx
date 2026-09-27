"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SidebarMenuButton } from "@/components/animate-ui/components/radix/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ACCENT_COLORS } from "@/lib/accent-colors";
import { useAccentColor } from "@/hooks/use-accent-color";

type AccentPickerProps = {
  placement: "floating" | "sidebar";
  side: "top" | "bottom";
};

export function AccentPicker({ placement, side }: AccentPickerProps) {
  const { accentColor, updateAccentColor } = useAccentColor();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const pickerPanel = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          role="dialog"
          aria-label="Choose an accent color"
          initial={{ opacity: 0, y: side === "bottom" ? 8 : -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: side === "bottom" ? 8 : -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className={cn(
            "absolute z-[70] min-w-56 rounded-2xl border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-2xl",
            side === "bottom"
              ? "top-full right-0 mt-3 origin-top-right"
              : "bottom-full left-0 mb-3 origin-bottom-left",
            placement === "sidebar" && "w-56",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                Accent color
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Choose a Studio Clean highlight
              </p>
            </div>
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full ring-2 ring-background ring-offset-1 ring-offset-border"
              style={{ backgroundColor: "var(--pm-accent)" }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {ACCENT_COLORS.map((color) => {
              const active = accentColor.id === color.id;
              return (
                <Tooltip key={color.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateAccentColor(color.id)}
                      aria-label={`${color.label} accent${active ? ", selected" : ""}`}
                      aria-pressed={active}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl outline-none transition duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover active:scale-95",
                        active && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover",
                      )}
                      style={{
                        backgroundColor: `hsl(${color.light.hue} ${color.light.saturation}% ${color.light.lightness}%)`,
                      }}
                    >
                      {active ? (
                        <Check
                          className="size-4"
                          strokeWidth={2.5}
                          style={{ color: color.light.foreground }}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={7} className="z-[80]">
                    {color.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative", placement === "sidebar" ? "w-full" : "w-auto")}
    >
      {placement === "sidebar" ? (
        <SidebarMenuButton
          type="button"
          tooltip="Accent color"
          aria-label={`Accent color: ${accentColor.label}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => setIsOpen((open) => !open)}
          className={cn(isOpen && "bg-sidebar-accent text-sidebar-accent-foreground")}
        >
          <span className="relative inline-flex">
            <Palette className="size-4" strokeWidth={1.8} aria-hidden />
            <span
              aria-hidden
              className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-sidebar bg-primary"
              style={{ backgroundColor: "var(--pm-accent)" }}
            />
          </span>
          <span>Accent color</span>
        </SidebarMenuButton>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={`Accent color: ${accentColor.label}`}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isOpen
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-soft hover:bg-muted hover:text-ink",
              )}
            >
              <Palette className="size-[18px]" strokeWidth={1.8} aria-hidden />
              <span
                aria-hidden
                className="absolute right-2 top-2 size-2 rounded-full ring-1 ring-background"
                style={{ backgroundColor: "var(--pm-accent)" }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={9}>
            Accent color
          </TooltipContent>
        </Tooltip>
      )}
      {pickerPanel}
    </div>
  );
}
