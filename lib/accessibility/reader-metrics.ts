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

/** Inverse of the display/CSS metrics; keep existing saved multipliers compatible. */
export function pixelsToReaderSetting(
  key: "fontSize" | "lineHeight" | "wordSpacing" | "letterSpacing",
  pixels: number,
  bodySize: number,
): number {
  switch (key) {
    case "fontSize":
      return pixels / 16;
    case "lineHeight":
      return pixels / (bodySize * 1.7);
    case "wordSpacing":
      return 1 + pixels / (bodySize * 0.5);
    case "letterSpacing":
      return 1 + pixels / (bodySize * 0.1);
  }
}
