"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Viewport-pinned ambient backdrops for the chapter sections (02–05).
 *
 * `background-attachment: fixed` is unreliable on mobile browsers (iOS Safari
 * silently falls back to scrolling the image), so the backdrops live here as
 * fixed, viewport-sized layers instead. An IntersectionObserver tracks which
 * chapter owns the viewport and cross-fades its backdrop in — the photograph
 * never moves while sections scroll past it, on any device.
 *
 * Each layer carries its own soft substrate scrim (.backdrop-scrim, defined
 * in globals.css) so ink stays legible while the photograph reads as ambient
 * colour rather than a printed plate. NOTE: filenames are capitalized on
 * disk — the previous lowercase paths 404'd on case-sensitive hosts.
 */
const BACKDROPS = [
  {
    section: "about",
    image: "/img/Vivid.webp",
  },
  {
    section: "showcase",
    image: "/img/Glassy-sky.webp",
  },
  {
    section: "tools",
    image: "/img/Teal.webp",
  },
  {
    section: "mission",
    image: "/img/Sapphire.webp",
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
            "absolute inset-0 transition-opacity duration-700 ease-out",
            active === backdrop.section ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className="absolute inset-0 bg-cover bg-center dark:brightness-[0.55]"
            style={{ backgroundImage: `url(${backdrop.image})` }}
          />
          <div className="backdrop-scrim absolute inset-0" />
        </div>
      ))}
    </div>
  );
}
