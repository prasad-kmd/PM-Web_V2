"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

const RADIUS = 18;
const STROKE_WIDTH = 2.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Reference: PMEngineerLK-NextJS/components/scroll-to-top.tsx.
 * Keep its size, ring, shadow and scale/slide interactions. Only mobile dock
 * clearance, theme tokens and accessibility behavior are adapted to this site.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const progress =
          range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
        setVisible(window.scrollY > 100);
        if (ringRef.current) {
          ringRef.current.style.strokeDashoffset = String(
            CIRCUMFERENCE * (1 - progress),
          );
        }
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)_+_5.5rem)] z-40 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:right-8 lg:bottom-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0)"
          : "scale(0.8) translateY(10px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <button
        type="button"
        aria-label="Scroll to top"
        tabIndex={visible ? 0 : -1}
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
        }
        className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg transition-transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <svg
          viewBox="0 0 44 44"
          aria-hidden="true"
          className="pointer-events-none absolute h-full w-full -rotate-90 transform"
        >
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            ref={ringRef}
            cx="22"
            cy="22"
            r={RADIUS}
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            strokeLinecap="round"
            className="text-primary transition-[stroke-dashoffset] duration-100 ease-linear motion-reduce:transition-none"
          />
        </svg>
        <ArrowUp
          aria-hidden="true"
          className="h-5 w-5 text-primary transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
      </button>
    </div>
  );
}
