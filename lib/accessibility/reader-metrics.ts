import type { AccessibilitySettings } from "@/contexts/AccessibilityContext";

/** Body-text values in CSS pixels. Heading and code sizes remain independent. */
export function getReaderMetrics(
  settings: Pick<
    AccessibilitySettings,
    "fontSize" | "lineHeight" | "wordSpacing" | "letterSpacing"
  >,
) {
  const fontSize = 16 * settings.fontSize;
  return {
    fontSize,
    lineHeight: fontSize * 1.7 * settings.lineHeight,
    wordSpacing: (settings.wordSpacing - 1) * 0.5 * fontSize,
    letterSpacing: (settings.letterSpacing - 1) * 0.1 * fontSize,
  };
}

export function formatPixels(value: number) {
  return `${Number(value.toFixed(2))} px`;
}
