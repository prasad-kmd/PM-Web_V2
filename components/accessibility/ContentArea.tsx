"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  applyAccessibilityStyles,
  clearAccessibilityStyles,
} from "@/lib/accessibility/apply-styles";
import { cn } from "@/lib/utils";

/**
 * Wraps long-form content and mirrors the reading preferences onto it as CSS
 * custom properties (see `app/globals.css` for the `.reader-content` rules).
 */
export function ContentArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = useAccessibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    applyAccessibilityStyles(container, settings);
  }, [settings]);

  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (container) clearAccessibilityStyles(container);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("accessibility-content-area", className)}
    >
      {children}
    </div>
  );
}
