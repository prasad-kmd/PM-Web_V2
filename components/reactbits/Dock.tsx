"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "motion/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Adapted from ReactBits Dock (Dock-TS-TW) for Next.js navigation.
 * The original proximity-scaled dock interaction is retained, while links,
 * actions, responsive sizing and theme-aware surfaces match this project.
 */
export type DockItemData = {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  expanded?: boolean;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
  label?: string;
};

type DockItemProps = {
  item: DockItemData;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  item,
  mouseX,
  spring,
  distance,
  baseItemSize,
  magnification,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const xOffset = useTransform(mouseX, (x) => {
    const left = ref.current?.getBoundingClientRect().left ?? 0;
    return x - left - baseItemSize / 2;
  });
  const targetSize = useTransform(
    xOffset,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );
  const size = useSpring(targetSize, spring);
  const controlClass = cn(
    "flex size-full items-center justify-center rounded-[inherit] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    item.active
      ? "bg-primary text-primary-foreground"
      : "text-ink-soft hover:bg-muted hover:text-ink",
  );

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/90 shadow-sm",
        item.active && "border-primary/40",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          {item.href ? (
            <Link
              href={item.href}
              className={controlClass}
              aria-label={item.label}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon}
            </Link>
          ) : (
            <button
              type="button"
              onClick={item.onClick}
              className={controlClass}
              aria-label={item.label}
              aria-expanded={item.expanded}
            >
              {item.icon}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={10}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

export default function Dock({
  items,
  className,
  distance = 112,
  baseItemSize = 42,
  magnification = 52,
  spring = { mass: 0.12, stiffness: 180, damping: 15 },
  label = "Primary navigation",
}: DockProps) {
  const mouseX = useMotionValue(-1000);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
      <nav
        aria-label={label}
        onMouseMove={(event) => mouseX.set(event.clientX)}
        onMouseLeave={() => mouseX.set(-1000)}
        className={cn(
          "pointer-events-auto flex max-w-full items-end gap-1 rounded-[1.35rem] border border-border/80 bg-background/85 px-2 py-2 shadow-[0_12px_38px_-12px_color-mix(in_srgb,var(--pm-ink)_28%,transparent)] backdrop-blur-2xl",
          className,
        )}
      >
        {items.map((item) => (
          <DockItem
            key={item.label}
            item={item}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          />
        ))}
      </nav>
    </div>
  );
}
