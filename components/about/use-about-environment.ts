"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Phones, and any display too short for the pinned chapter layouts. */
const COMPACT_QUERY = "(max-width: 767px), (max-height: 639px)";

function subscribeMedia(query: string, notify: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

export function useAboutReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => subscribeMedia(REDUCED_MOTION_QUERY, notify),
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

export function useAboutCompactViewport(): boolean {
  return useSyncExternalStore(
    (notify) => subscribeMedia(COMPACT_QUERY, notify),
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}

export function useAboutDocumentVisible(): boolean {
  return useSyncExternalStore(
    (notify) => {
      document.addEventListener("visibilitychange", notify);
      return () => document.removeEventListener("visibilitychange", notify);
    },
    () => !document.hidden,
    () => false,
  );
}

/**
 * Discrete on-screen state (not a per-frame scroll value) so heavy chapters
 * only animate while they own the viewport.
 */
export function useAboutInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: "80px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/** Convenience: animation is allowed only when nothing asks us to stop. */
export function useAboutMotionAllowed(): {
  allowed: boolean;
  reduced: boolean;
} {
  const reduced = useAboutReducedMotion();
  const documentVisible = useAboutDocumentVisible();
  return { reduced, allowed: !reduced && documentVisible };
}
