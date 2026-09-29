"use client";

import type { ReactNode } from "react";
import { ContentArea } from "@/components/accessibility/ContentArea";

/**
 * Long-form content card. Typography, spacing and contrast come from the
 * reading options dialog (`components/accessibility/AccessibilityPanel`),
 * which writes CSS custom properties onto this container through `ContentArea`.
 */
export function ReaderExperience({ children }: { children: ReactNode }) {
  return (
    <ContentArea className="notion-content reader-content mt-7 min-w-0 rounded-xl border border-border bg-card p-5 md:p-8">
      {children}
    </ContentArea>
  );
}
