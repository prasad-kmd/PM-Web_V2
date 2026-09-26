"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  src: string;
  alt: string;
  tag: string;
  title: string;
  desc: string;
}

const CYCLE_MS = 5000;

/**
 * Focus-area carousel for the hero: an auto-advancing image card whose
 * switch is timed by the slim progress rail pinned to its left edge.
 * Hovering the card pauses both the rail and the advance.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const slide = slides[active];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Engineering focus areas"
      className="group/carousel relative h-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress rail — one segment per slide, filling to time the switch */}
      <div className="absolute inset-y-0 left-0 z-30 flex w-1 flex-col gap-[3px]">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1} of ${slides.length}: ${item.title}`}
            aria-current={index === active}
            className="relative flex-1 cursor-pointer bg-ink/15 transition-colors duration-200 first:rounded-t-sm last:rounded-b-sm hover:bg-primary/40 focus-visible:bg-primary/40 focus-visible:outline-none"
          >
            {index === active && (
              <span
                key={`${active}-${paused ? "p" : "r"}`}
                onAnimationEnd={(event) => {
                  if (event.animationName === "vbar") advance();
                }}
                className={cn(
                  "absolute inset-x-0 top-0 bg-primary",
                  paused && "[animation-play-state:paused]",
                )}
                style={{ animation: `vbar ${CYCLE_MS}ms linear forwards` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slides */}
      {slides.map((item, index) => (
        <div
          key={item.src}
          aria-hidden={index !== active}
          className={cn(
            "absolute inset-0 transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            index === active ? "scale-100 opacity-100" : "scale-[1.05] opacity-0",
          )}
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Bottom wash + slide copy */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent pt-20">
        <div className="flex items-end justify-between gap-6 p-6 pl-7 md:p-7">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                {slide.tag}
              </p>
              <h2 className="mt-1.5 font-display text-xl font-semibold leading-tight tracking-tight text-white md:text-2xl">
                {slide.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 max-w-md font-body text-xs leading-relaxed text-white/75 md:text-sm">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
          <p className="shrink-0 text-xs font-medium tabular-nums text-white/80">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
