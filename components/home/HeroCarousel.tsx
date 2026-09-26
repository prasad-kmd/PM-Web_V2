"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * 02E Top Bar + Dots — Fixed + Theme Aware
 * Fixes:
 * - Hover pause no longer resets (stable key, animation-play-state)
 * - Black/white-to-transparent gradients under text for legibility
 * - Theme aware: uses border, card, primary tokens, adapts to light/dark
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const advance = useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActive((c) => (c + 1) % slides.length);
      if (e.key === "ArrowLeft") setActive((c) => (c - 1 + slides.length) % slides.length);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const slide = slides[active];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Engineering focus areas"
      className="group/carousel relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      {/* Slides */}
      {slides.map((item, index) => (
        <div
          key={item.src}
          aria-hidden={index !== active}
          className={cn(
            "absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            index === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
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

      {/* Theme-aware top progress bar */}
      <div className="absolute left-0 right-0 top-0 z-30 h-1 bg-border/80 backdrop-blur-sm">
        <div
          ref={progressRef}
          // FIX: stable key = active only, pause via play-state, not remount
          key={active}
          onAnimationEnd={(e) => {
            if (e.animationName === "hbar" && !paused) advance();
          }}
          className="h-full origin-left bg-primary"
          style={{
            animation: `hbar ${CYCLE_MS}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>

      {/* Legibility gradients — black-to-transparent under text */}
      {/* Top gradient for tag + title */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 via-black/25 to-transparent dark:from-black/70 dark:via-black/30"
      />
      {/* Bottom gradient for desc + dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent dark:from-black/85 dark:via-black/45"
      />
      {/* Extra soft scrim for middle to ensure image doesn't compete */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/[0.08] via-transparent to-black/[0.12] dark:from-black/20 dark:to-black/20"
      />

      {/* Top content — theme aware pill + title */}
      <div className="absolute left-0 right-0 top-0 z-20 p-5 pl-5 pt-6 md:p-6 md:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-medium tracking-wide text-ink shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/60 dark:text-white">
                <span className={cn("h-1.5 w-1.5 rounded-full", paused ? "bg-amber-500" : "bg-emerald-500 animate-pulse")} aria-hidden />
                {slide.tag}
              </span>
              <span className="hidden md:inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/80 backdrop-blur-md dark:bg-white/10">
                0{active + 1} / 0{slides.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.h2
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3 max-w-[420px] font-display text-[22px] font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.8)] md:text-[26px]"
              >
                {slide.title}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Theme-aware counter pill — visible on mobile */}
          <div className="md:hidden shrink-0 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur-md">
            0{active + 1}/{slides.length}
          </div>
        </div>
      </div>

      {/* Bottom content — desc + dots */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-6">
        <div className="flex items-end justify-between gap-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[380px] text-[13px] leading-[1.6] text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] md:text-[14px]"
            >
              {slide.desc}
            </motion.p>
          </AnimatePresence>

          {/* Theme-aware dots — bottom right, video player style */}
          <div
            role="tablist"
            aria-label="Carousel slides"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10"
          >
            {slides.map((item, index) => (
              <button
                key={item.title}
                role="tab"
                aria-selected={index === active}
                aria-label={`Go to ${item.title}`}
                onClick={() => setActive(index)}
                className={cn(
                  "relative h-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
                  index === active
                    ? "w-8 bg-white"
                    : "w-5 bg-white/30 hover:bg-white/50",
                )}
              >
                {index === active && (
                  <span className="sr-only">Current: {item.title}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile progress hint */}
        <div className="mt-4 flex items-center gap-2 md:hidden">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-white/60"
              style={{ width: `${((active + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hbar {
          from { width: 0% }
          to { width: 100% }
        }
        @media (prefers-reduced-motion: reduce) {
          .group\\/carousel * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
