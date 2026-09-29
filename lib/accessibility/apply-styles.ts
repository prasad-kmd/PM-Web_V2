import {
  READER_FONTS,
  type AccessibilitySettings,
} from "@/contexts/AccessibilityContext";

/**
 * Turns reading preferences into CSS custom properties on the content
 * container. The values are deliberately unitless multipliers so the styles in
 * `app/globals.css` stay in charge of the actual type scale.
 */

const CONTENT_VARIABLES = [
  "--a11y-font-size",
  "--a11y-font-family",
  "--a11y-leading",
  "--a11y-word-spacing",
  "--a11y-letter-spacing",
] as const;

export function applyAccessibilityStyles(
  container: HTMLElement,
  settings: AccessibilitySettings,
) {
  const font =
    READER_FONTS.find((option) => option.name === settings.fontFamily) ??
    READER_FONTS[0];

  container.style.setProperty("--a11y-font-size", `${settings.fontSize}`);
  container.style.setProperty("--a11y-font-family", font.variable);
  container.style.setProperty("--a11y-leading", `${settings.lineHeight}`);
  container.style.setProperty(
    "--a11y-word-spacing",
    `${((settings.wordSpacing - 1) * 0.5).toFixed(3)}em`,
  );
  container.style.setProperty(
    "--a11y-letter-spacing",
    `${((settings.letterSpacing - 1) * 0.1).toFixed(3)}em`,
  );

  container.classList.toggle("a11y-high-contrast", settings.isHighContrast);
}

export function clearAccessibilityStyles(container: HTMLElement) {
  for (const property of CONTENT_VARIABLES) {
    container.style.removeProperty(property);
  }
  container.classList.remove("a11y-high-contrast");
}
