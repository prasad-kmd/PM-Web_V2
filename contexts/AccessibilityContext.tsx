"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Reading preferences for long-form Notion content.
 *
 * Values are stored in localStorage as a single object and consumed by
 * `components/accessibility/ContentArea`, which turns them into CSS custom
 * properties on the content container. Nothing here depends on the theme or
 * the accent palette, so the settings survive both.
 */

export type ReaderFontOption = {
  /** Stable id persisted to localStorage. */
  name: string;
  /** CSS custom property registered in lib/fonts.ts, applied to `--reader-font`. */
  variable: string;
  /** Human readable name shown in the reading options panel. */
  label: string;
};

export const READER_FONTS: ReaderFontOption[] = [
  {
    name: "noto-sans-display",
    variable: "var(--font-noto-sans-display)",
    label: "Noto Sans Display",
  },
  {
    name: "google-sans",
    variable: "var(--font-google-sans)",
    label: "Google Sans",
  },
  { name: "inter", variable: "var(--font-inter24)", label: "Inter 24pt" },
  {
    name: "serif",
    variable: "var(--font-anthropic-serif-text)",
    label: "Anthropic Serif",
  },
  {
    name: "mono",
    variable: "var(--font-jetbrains-mono)",
    label: "JetBrains Mono",
  },
  {
    name: "sinhala",
    variable: "var(--font-noto-serif-sinhala)",
    label: "Noto Serif Sinhala",
  },
  {
    name: "montserrat",
    variable: "var(--font-montserrat)",
    label: "Montserrat",
  },
  { name: "amoria", variable: "var(--font-amoria)", label: "Amoria" },
];

export type AccessibilitySettings = {
  /** Multiplier applied to the reader type scale (1 = the site default). */
  fontSize: number;
  /** Id from READER_FONTS. */
  fontFamily: string;
  /** Multiplier applied to the reader line height (1 = the site default). */
  lineHeight: number;
  /** Multiplier that maps onto a small extra word gap. */
  wordSpacing: number;
  /** Multiplier that maps onto a small extra letter gap. */
  letterSpacing: number;
  /** Swaps the content card onto a high-contrast palette. */
  isHighContrast: boolean;
  /** Dialog open state — never persisted. */
  isPanelOpen: boolean;
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontSize: 1,
  fontFamily: "google-sans",
  lineHeight: 1,
  wordSpacing: 1,
  letterSpacing: 1,
  isHighContrast: false,
  isPanelOpen: false,
};

export const ACCESSIBILITY_STORAGE_KEY = "pm-accessibility-preferences";

type AccessibilityContextValue = AccessibilitySettings & {
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => void;
  resetAllSettings: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}

/** Reads stored preferences, ignoring anything that is not a known value. */
function readStoredSettings(): Partial<AccessibilitySettings> {
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return {};

    const stored = parsed as Record<string, unknown>;
    const settings: Partial<AccessibilitySettings> = {};

    if (
      typeof stored.fontSize === "number" &&
      Number.isFinite(stored.fontSize)
    ) {
      settings.fontSize = stored.fontSize;
    }
    if (
      typeof stored.lineHeight === "number" &&
      Number.isFinite(stored.lineHeight)
    ) {
      settings.lineHeight = stored.lineHeight;
    }
    if (
      typeof stored.wordSpacing === "number" &&
      Number.isFinite(stored.wordSpacing)
    ) {
      settings.wordSpacing = stored.wordSpacing;
    }
    if (
      typeof stored.letterSpacing === "number" &&
      Number.isFinite(stored.letterSpacing)
    ) {
      settings.letterSpacing = stored.letterSpacing;
    }

    // Migrate the old implicit default; preserve explicitly selected fonts.
    const fontFamily =
      stored.fontFamily === "default" ? "google-sans" : stored.fontFamily;
    if (
      typeof fontFamily === "string" &&
      READER_FONTS.some((font) => font.name === fontFamily)
    ) {
      settings.fontFamily = fontFamily;
    }
    if (typeof stored.isHighContrast === "boolean") {
      settings.isHighContrast = stored.isHighContrast;
    }

    return settings;
  } catch {
    return {};
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSettings();
    startTransition(() => {
      setSettings((previous) => ({ ...previous, ...stored }));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const persisted: Partial<AccessibilitySettings> = { ...settings };
    delete persisted.isPanelOpen;
    // Keep synchronous storage writes off the slider's pointer-move hot path.
    const persist = () => {
      try {
        window.localStorage.setItem(
          ACCESSIBILITY_STORAGE_KEY,
          JSON.stringify(persisted),
        );
      } catch {
        // Preferences still work for this session when storage is unavailable.
      }
    };
    const timer = window.setTimeout(persist, 180);
    window.addEventListener("pagehide", persist);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", persist);
    };
  }, [settings, hydrated]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => {
    setSettings((previous) =>
      Object.is(previous[key], value)
        ? previous
        : { ...previous, [key]: value },
    );
  };

  const resetAllSettings = () => {
    setSettings((previous) => ({
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      // The panel stays open so the reset is visible.
      isPanelOpen: previous.isPanelOpen,
    }));
  };

  return (
    <AccessibilityContext.Provider
      value={{ ...settings, updateSetting, resetAllSettings }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
