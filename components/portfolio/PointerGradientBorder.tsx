"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./pointer-gradient-border.module.css";

/** The supplied AI Mode palette, clipped to the outline of the portfolio card. */
export default function PointerGradientBorder({ children }: { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const angleRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    // Conic gradients start at 12 o'clock; the colorful part of the supplied
    // gradient is centered around its 50% mark (opposite the start angle).
    const x = event.clientX - left - width / 2;
    const y = event.clientY - top - height / 2;
    // React Bits BorderGlow's edge-proximity calculation, adapted for this
    // palette: more bloom near the perimeter, without dimming the fine stroke.
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const proximity = Math.min(
      1,
      Math.max(Math.abs(x) / halfWidth, Math.abs(y) / halfHeight),
    );
    card.style.setProperty("--glow-strength", String(0.55 + proximity * 0.45));
    const next = Math.atan2(y, x) * (180 / Math.PI) - 90;
    if (!card.dataset.hovered) {
      card.dataset.introDone = "true";
      angleRef.current = next;
      card.style.setProperty("--pointer-angle", `${next}deg`);
    }
    const current = angleRef.current;
    targetRef.current = current + ((((next - current + 180) % 360) + 360) % 360 - 180);
    card.dataset.hovered = "true";
    if (frameRef.current !== null) return;
    const animate = () => {
      angleRef.current += (targetRef.current - angleRef.current) * 0.22;
      card.style.setProperty("--pointer-angle", `${angleRef.current}deg`);
      if (Math.abs(targetRef.current - angleRef.current) > 0.15) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
  }

  function leave() {
    const card = cardRef.current;
    if (card) delete card.dataset.hovered;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onPointerEnter={move}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.border} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
