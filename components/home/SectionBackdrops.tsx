"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Viewport-pinned photo backdrops for sections 02–05.
 *
 * `background-attachment: fixed` is unreliable on mobile browsers (iOS Safari
 * silently falls back to scrolling the image), so the backdrops live here as
 * fixed, viewport-sized layers instead. An IntersectionObserver tracks which
 * chapter owns the viewport and cross-fades its backdrop in — the photograph
 * never moves while sections scroll past it, on any device.
 */
const BACKDROPS = [
  {
    section: "about",
    image: "/img/bg-about.jpg",
  },
  {
    section: "showcase",
    image: "/img/bg-content.jpg",
  },
  {
    section: "tools",
    image: "/img/bg-tools.jpg",
  },
  {
    section: "mission",
    image: "/img/bg-mission.jpg",
  },
] as const;

/** Sections that own the viewport but show no photograph. */
const BARE_SECTIONS = ["hero", "footer"] as const;

const MIN_RATIO = 0.3;

export default function SectionBackdrops() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = [...BACKDROPS.map((b) => b.section), ...BARE_SECTIONS];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let owner: string | null = null;
        let best = MIN_RATIO;
        for (const [id, ratio] of ratios) {
          if (ratio > best) {
            best = ratio;
            owner = id;
          }
        }
        setActive(owner);
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {BACKDROPS.map((backdrop) => (
        <div
          key={backdrop.section}
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out dark:brightness-[0.55] dark:saturate-[0.85]",
            active === backdrop.section ? "opacity-100" : "opacity-0",
          )}
          style={{ backgroundImage: `url(${backdrop.image})` }}
        />
      ))}
    </div>
  );
}
