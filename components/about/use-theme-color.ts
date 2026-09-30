"use client";

import { useEffect, useState } from "react";
import { ACCENT_CHANGE_EVENT } from "@/lib/accent-colors";

/** rgb()/hsl()/any CSS colour -> #rrggbb, resolved by the browser itself. */
function toHex(value: string, fallback: string): string {
  if (typeof window === "undefined" || !value) return fallback;
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = value.trim();
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const match = resolved.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return fallback;
  const [r, g, b] = match.slice(0, 3).map((n) => Math.round(Number(n)));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Reads CSS custom properties off <html> as concrete hex strings so WebGL
 * components (which cannot parse `var(--token)`) stay theme and accent aware.
 * Re-reads on theme class flips and on the accent-change event.
 */
export function useThemeColors(
  tokens: Record<string, string>,
): Record<string, string> {
  const [colors, setColors] = useState<Record<string, string>>(tokens);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const styles = getComputedStyle(root);
      const next: Record<string, string> = {};
      for (const [token, fallback] of Object.entries(tokens)) {
        next[token] = toHex(styles.getPropertyValue(token), fallback);
      }
      setColors((prev) => {
        const same = Object.keys(next).every((k) => prev[k] === next[k]);
        return same ? prev : next;
      });
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    window.addEventListener(ACCENT_CHANGE_EVENT, read);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", read);

    return () => {
      observer.disconnect();
      window.removeEventListener(ACCENT_CHANGE_EVENT, read);
      media.removeEventListener("change", read);
    };
    // tokens is a literal map declared at module scope by every caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return colors;
}

/** True once the viewport is >= 768px (desktop chapter/snap behaviour). */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return desktop;
}
