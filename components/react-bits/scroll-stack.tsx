"use client";

/** Vendored from the supplied React Bits Pro scroll-stack/tw component. */

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "@/components/react-bits/scroll-stack.module.css";

export type ScrollStackVariant =
  "stack" | "deck" | "fade" | "flip" | "zoom" | "reveal";

export interface ScrollStackItem {
  /** Small kicker printed above the heading */
  eyebrow?: string;
  /** Card heading */
  title?: string;
  /** Supporting line under the heading */
  body?: string;
  /** Background image URL */
  image?: string;
  /** Colour used for the kicker and the matching progress tick */
  accent?: string;
}

export interface ScrollStackProps {
  /** Optional heading pinned within the same stage as the cards */
  header?: ReactNode;
  /** A plain chronological list on compact screens or when motion is reduced */
  staticLayout?: boolean;
  /** Label describing the actual content */
  ariaLabel?: string;
  /** Cards rendered by the built-in layout */
  items?: ScrollStackItem[];
  /** Custom cards, one per child, replacing the built-in layout */
  children?: ReactNode;
  /** Which stacking animation to run */
  variant?: ScrollStackVariant;
  /** Viewport heights of scrolling assigned to each card */
  scrollLength?: number;
  /** Pixels a covered card slides up so its edge peeks out */
  peek?: number;
  /** How much a covered card shrinks per step from 0 to 1 */
  scaleStep?: number;
  /** Maximum blur in pixels applied to covered cards */
  blur?: number;
  /** How far covered cards darken from 0 to 1 */
  dim?: number;
  /** Scroll follow damping from 0 for instant to 1 for very loose */
  smooth?: number;
  /** How many covered cards stay mounted behind the active one */
  depth?: number;
  /** Maximum card width in pixels */
  cardWidth?: number;
  /** Card height as a fraction of the viewport */
  cardHeight?: number;
  /** Corner radius of the cards in pixels */
  borderRadius?: number;
  /** Perspective depth in pixels used by the turning variants */
  perspective?: number;
  /** Show the segmented progress rail */
  showProgress?: boolean;
  /** Show the numeric counter */
  showCounter?: boolean;
  /** Fired whenever the frontmost card changes */
  onIndexChange?: (index: number) => void;
  /** Extra classes for the outer section */
  className?: string;
}

const DEFAULT_ITEMS: ScrollStackItem[] = [];

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const glide = (t: number) => t * t * (3 - 2 * t);

interface Shot {
  transform: string;
  opacity: number;
  filter: string;
  clip: string;
}

interface Recipe {
  peek: number;
  scaleStep: number;
  blur: number;
  dim: number;
  radius: number;
  enter: number;
}

const shade = (v: number, dim: number, blur: number) => {
  const parts: string[] = [];
  if (blur > 0.01) parts.push(`blur(${(v * blur).toFixed(2)}px)`);
  if (dim > 0.001) parts.push(`brightness(${(1 - v * dim).toFixed(3)})`);
  return parts.length ? parts.join(" ") : "none";
};

const pose = (
  variant: ScrollStackVariant,
  offset: number,
  index: number,
  cfg: Recipe,
): Shot => {
  const full = `inset(0 0 0 0 round ${cfg.radius}px)`;
  const lean = index % 2 === 0 ? 1 : -1;

  if (offset < 0) {
    const u = clamp(offset + 1, 0, 1);
    const e = glide(u);
    switch (variant) {
      case "fade":
        return {
          transform: `translate3d(0,0,0) scale(${(1.06 - 0.06 * e).toFixed(4)})`,
          opacity: e,
          filter: "none",
          clip: full,
        };
      case "flip":
        return {
          transform: `translate3d(0,${((1 - e) * 26).toFixed(2)}%,0) rotateX(${((1 - e) * -72).toFixed(2)}deg)`,
          opacity: clamp(e * 1.6, 0, 1),
          filter: "none",
          clip: full,
        };
      case "zoom":
        return {
          transform: `translate3d(0,0,0) scale(${(0.52 + 0.48 * e).toFixed(4)})`,
          opacity: clamp(e * 1.4, 0, 1),
          filter:
            cfg.blur > 0.01
              ? `blur(${((1 - e) * cfg.blur).toFixed(2)}px)`
              : "none",
          clip: full,
        };
      case "reveal":
        return {
          transform: "translate3d(0,0,0)",
          opacity: 1,
          filter: "none",
          clip: `inset(${((1 - u) * 100).toFixed(2)}% 0 0 0 round ${cfg.radius}px)`,
        };
      case "deck":
        return {
          transform: `translate3d(0,${((1 - u) * (cfg.enter + 6)).toFixed(2)}%,0) rotate(${((1 - e) * 4 * lean).toFixed(2)}deg)`,
          opacity: 1,
          filter: "none",
          clip: full,
        };
      default:
        return {
          transform: `translate3d(0,${((1 - u) * cfg.enter).toFixed(2)}%,0)`,
          opacity: 1,
          filter: "none",
          clip: full,
        };
    }
  }

  const v = offset;
  const e = glide(clamp(v, 0, 1));
  switch (variant) {
    case "fade":
      return {
        transform: `translate3d(0,0,0) scale(${(1 - e * 0.06).toFixed(4)})`,
        opacity: 1 - e,
        filter: shade(e, cfg.dim, cfg.blur),
        clip: full,
      };
    case "flip":
      return {
        transform: `translate3d(0,${(-e * 26).toFixed(2)}%,0) rotateX(${(e * 72).toFixed(2)}deg)`,
        opacity: 1 - e,
        filter: shade(e, cfg.dim, 0),
        clip: full,
      };
    case "zoom":
      return {
        transform: `translate3d(0,0,0) scale(${(1 + e * 0.42).toFixed(4)})`,
        opacity: 1 - e,
        filter:
          cfg.blur > 0.01
            ? `blur(${(e * cfg.blur * 1.4).toFixed(2)}px)`
            : "none",
        clip: full,
      };
    case "reveal":
      return {
        transform: `translate3d(0,${(-v * cfg.peek * 0.5).toFixed(2)}px,0) scale(${(1 - v * cfg.scaleStep * 0.7).toFixed(4)})`,
        opacity: 1,
        filter: shade(v, cfg.dim, cfg.blur),
        clip: full,
      };
    case "deck":
      return {
        transform: `translate3d(0,${(-v * cfg.peek * 0.75).toFixed(2)}px,0) rotate(${(v * 4.5 * lean).toFixed(2)}deg) scale(${(1 - v * cfg.scaleStep * 0.85).toFixed(4)})`,
        opacity: 1,
        filter: shade(v, cfg.dim, cfg.blur),
        clip: full,
      };
    default:
      return {
        transform: `translate3d(0,${(-v * cfg.peek).toFixed(2)}px,0) scale(${(1 - v * cfg.scaleStep).toFixed(4)})`,
        opacity: 1,
        filter: shade(v, cfg.dim, cfg.blur),
        clip: full,
      };
  }
};

export const ScrollStack = ({
  items = DEFAULT_ITEMS,
  children,
  header,
  staticLayout = false,
  ariaLabel = "Scrolling card stack",
  variant = "stack",
  scrollLength = 1,
  peek = 26,
  scaleStep = 0.07,
  blur = 4,
  dim = 0.28,
  smooth = 0.16,
  depth = 3,
  cardWidth = 880,
  cardHeight = 0.68,
  borderRadius = 22,
  perspective = 1400,
  showProgress = true,
  showCounter = true,
  onIndexChange,
  className,
}: ScrollStackProps) => {
  const custom = useMemo(
    () => Children.toArray(children).filter((node) => isValidElement(node)),
    [children],
  );
  const cards = custom.length > 0 ? custom : items;
  const count = cards.length;

  const rootRef = useRef<HTMLElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(0);
  const beat = useRef(0);
  const spin = useRef(0);
  const live = useRef(false);
  const seen = useRef(-1);
  const report = useRef(onIndexChange);

  const [lead, setLead] = useState(0);
  const calm = staticLayout;

  useEffect(() => {
    report.current = onIndexChange;
  }, [onIndexChange]);

  const recipe = useMemo<Recipe>(
    () => ({
      peek: Math.max(0, peek),
      scaleStep: clamp(scaleStep, 0, 0.4),
      blur: calm ? 0 : Math.max(0, blur),
      dim: clamp(dim, 0, 1),
      radius: Math.max(0, borderRadius),
      enter: ((1 + 1 / clamp(cardHeight, 0.2, 0.95)) / 2) * 100 + 3,
    }),
    [peek, scaleStep, blur, dim, borderRadius, calm, cardHeight],
  );

  const paint = useCallback(
    (progress: number) => {
      const keep = Math.max(1, Math.round(depth));
      for (let i = 0; i < count; i += 1) {
        const slot = slotRefs.current[i];
        if (!slot) continue;
        const offset = progress - i;
        if (offset < -1.0005 || offset > keep) {
          if (slot.style.visibility !== "hidden") {
            slot.style.visibility = "hidden";
          }
          continue;
        }
        if (slot.style.visibility === "hidden") slot.style.visibility = "";
        const shot = pose(variant, offset, i, recipe);
        slot.style.transform = shot.transform;
        slot.style.opacity = shot.opacity.toFixed(4);
        slot.style.filter = shot.filter;
        slot.style.clipPath = shot.clip;
      }
      if (railRef.current && count > 1) {
        const ratio = clamp(progress / (count - 1), 0, 1);
        railRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      const front = clamp(Math.round(progress), 0, count - 1);
      if (front !== seen.current) {
        seen.current = front;
        setLead(front);
        report.current?.(front);
      }
    },
    [count, depth, recipe, variant],
  );

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root || count < 1) return 0;
    const view = root.ownerDocument.defaultView;
    const tall = view ? view.innerHeight : 0;
    const box = root.getBoundingClientRect();
    const span = box.height - tall;
    if (span <= 0) return 0;
    return clamp(-box.top / span, 0, 1) * (count - 1);
  }, [count]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || staticLayout) return;
    const doc = root.ownerDocument;
    const view = doc.defaultView;
    if (!view) return;

    const ease = calm ? 0 : clamp(smooth, 0, 0.95);

    const step = (stamp: number) => {
      const last = beat.current || stamp;
      const delta = Math.min(0.05, Math.max(0, (stamp - last) / 1000));
      beat.current = stamp;

      const target = measure();
      const from = shown.current;
      const pull = ease > 0 ? 1 - Math.pow(1 - ease, delta * 60) : 1;
      const next = from + (target - from) * pull;
      shown.current = next;
      paint(next);

      if (Math.abs(target - next) > 0.0004) {
        spin.current = view.requestAnimationFrame(step);
      } else {
        shown.current = target;
        paint(target);
        live.current = false;
      }
    };

    const wake = () => {
      if (live.current) return;
      live.current = true;
      beat.current = 0;
      spin.current = view.requestAnimationFrame(step);
    };

    shown.current = measure();
    paint(shown.current);

    view.addEventListener("scroll", wake, { passive: true });
    doc.addEventListener("scroll", wake, { passive: true, capture: true });
    view.addEventListener("resize", wake);

    const watch = new ResizeObserver(wake);
    watch.observe(root);

    return () => {
      view.cancelAnimationFrame(spin.current);
      live.current = false;
      view.removeEventListener("scroll", wake);
      doc.removeEventListener("scroll", wake, { capture: true });
      view.removeEventListener("resize", wake);
      watch.disconnect();
    };
  }, [measure, paint, smooth, calm, staticLayout]);

  useEffect(() => {
    if (!staticLayout) return;
    for (const slot of slotRefs.current) {
      if (!slot) continue;
      for (const property of [
        "transform",
        "opacity",
        "filter",
        "clip-path",
        "visibility",
      ]) {
        slot.style.removeProperty(property);
      }
    }
  }, [staticLayout]);

  const reach = Math.max(0.2, scrollLength);
  const runway = 100 + Math.max(0, count - 1) * reach * 100;

  return (
    <section
      ref={rootRef}
      aria-label={ariaLabel}
      data-static={staticLayout}
      className={cn(styles.root, className)}
      style={{ height: staticLayout ? undefined : `${runway}dvh` }}
    >
      <div
        className={styles.stage}
        style={{
          perspective: staticLayout
            ? undefined
            : `${Math.max(200, perspective)}px`,
        }}
      >
        {header && <div className={styles.header}>{header}</div>}
        <div
          className={styles.slots}
          style={{
            maxWidth: `${Math.max(200, cardWidth)}px`,
            height: staticLayout
              ? undefined
              : `${clamp(cardHeight, 0.2, 0.95) * 100}dvh`,
          }}
        >
          {cards.map((card, index) => (
            <div
              key={isValidElement(card) ? (card.key ?? index) : `item-${index}`}
              ref={(node) => {
                slotRefs.current[index] = node;
              }}
              className={styles.slot}
              style={{ zIndex: index }}
            >
              {custom.length > 0 ? (
                (card as ReactNode)
              ) : (
                <Face item={card as ScrollStackItem} radius={recipe.radius} />
              )}
            </div>
          ))}
        </div>
        {(showProgress || showCounter) && count > 1 && !staticLayout && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-4 px-6 sm:bottom-8">
            {showProgress && (
              <span className="relative h-px w-28 overflow-hidden bg-current/20 sm:w-44">
                <span
                  ref={railRef}
                  className="absolute inset-0 origin-left bg-current"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            )}
            {showCounter && (
              <span className="text-[11px] font-medium tabular-nums tracking-widest opacity-60">
                {String(lead + 1).padStart(2, "0")} /{" "}
                {String(count).padStart(2, "0")}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

function Face({ item, radius }: { item: ScrollStackItem; radius: number }) {
  return (
    <article
      className="relative flex h-full w-full flex-col justify-end overflow-hidden border border-border bg-card p-6"
      style={{ borderRadius: radius }}
    >
      {item.image && (
        <Image
          src={item.image}
          alt={item.title ?? ""}
          fill
          sizes="(min-width: 1024px) 880px, 90vw"
          className="object-cover"
        />
      )}
      <div className="relative">
        {item.eyebrow && (
          <p
            className="text-xs text-primary"
            style={item.accent ? { color: item.accent } : undefined}
          >
            {item.eyebrow}
          </p>
        )}
        {item.title && (
          <h3 className="mt-3 font-display text-3xl font-medium text-ink">
            {item.title}
          </h3>
        )}
        {item.body && <p className="mt-3 text-sm text-ink-soft">{item.body}</p>}
      </div>
    </article>
  );
}

export default ScrollStack;
