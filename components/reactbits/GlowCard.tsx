"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Interior light colour. Defaults to a faint brand-accent wash. */
  glowColor?: string;
}

/**
 * GlowCard — cursor-tracking interior light for a card.
 *
 * A soft radial gradient follows the pointer across the card, painted
 * ABOVE the card background but UNDER the content: the layer has no
 * z-index, so children that are positioned (e.g. a `relative` card body)
 * always render above it and text stays fully readable. Intensity is
 * deliberately faint (~12% accent). Position flows through motion values,
 * so the cursor tracking never re-renders the card; only enter/leave
 * toggle a state to fade the light. Hover-driven — touch devices see a
 * plain card.
 *
 * Pair with BorderGlow: BorderGlow owns the card shell (border, glow,
 * shadow) and this lays the interior light beneath the content.
 */
export default function GlowCard({
  children,
  className,
  glowColor,
}: GlowCardProps) {
  const mouseX = useMotionValue(-320);
  const mouseY = useMotionValue(-320);
  const [visible, setVisible] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const color =
    glowColor ?? "color-mix(in srgb, var(--pm-hazard) 12%, transparent)";
  const backgroundImage = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 70%)`;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn("relative", className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0, backgroundImage }}
      />
      {children}
    </div>
  );
}
