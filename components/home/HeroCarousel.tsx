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
 * Right-hand column of the hero: an auto-advancing image carousel whose
 * switch is timed by the vertical loading bar pinned to the left edge.
 * Hovering the column pauses both the bar and the advance.
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
      className="group/carousel relative h-[46dvh] md:h-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Vertical timely loading bar — left edge of the right column */}
      <div className="absolute inset-y-0 left-0 z-30 flex w-[6px] flex-col gap-[3px] bg-ink/10">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1} of ${slides.length}: ${item.title}`}
            aria-current={index === active}
            className="relative flex-1 cursor-pointer overflow-hidden transition-colors hover:bg-hazard/40 focus-visible:bg-hazard/40 focus-visible:outline-none"
          >
            {index === active && (
              <span
                key={`${active}-${paused ? "p" : "r"}`}
                onAnimationEnd={(event) => {
                  if (event.animationName === "vbar") advance();
                }}
                className={cn(
                  "absolute inset-x-0 top-0 bg-hazard",
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
            index === active ? "scale-100 opacity-100" : "scale-[1.07] opacity-0",
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent pt-24">
        <div className="flex items-end justify-between gap-6 p-6 pl-8 md:p-8 md:pl-10">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/70">
                {slide.tag}
              </p>
              <h2 className="mt-2 font-display text-xl uppercase leading-none tracking-tight text-paper md:text-3xl">
                {slide.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-md font-body text-xs leading-relaxed text-paper/75 md:text-sm">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
          <p className="shrink-0 font-mono text-xs tracking-[0.2em] text-paper/80">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Corner crosshairs */}
      <span aria-hidden className="absolute right-4 top-4 z-20 font-mono text-sm text-paper/70">
        +
      </span>
      <span aria-hidden className="absolute bottom-4 right-4 z-10 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-paper/50 md:block">
        {paused ? "HOLD" : "LIVE"}
      </span>
    </div>
  );
}
