export type AccentModeValues = {
  hue: number;
  saturation: number;
  lightness: number;
  foreground: string;
};

export type AccentColor = {
  id: string;
  label: string;
  light: AccentModeValues;
  dark: AccentModeValues;
};

/** Must name an entry in ACCENT_COLORS. The first entry is the default. */
export const DEFAULT_ACCENT_ID = "violet";

export const ACCENT_STORAGE_KEY = "pm-accent-color";
export const ACCENT_CHANGE_EVENT = "pm-accent-color-change";

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "violet",
    label: "Violet",
    light: { hue: 252, saturation: 56, lightness: 57, foreground: "#fafafa" },
    dark: { hue: 258, saturation: 90, lightness: 66, foreground: "#fafafa" },
  },
  {
    id: "blue",
    label: "Blue",
    light: { hue: 221, saturation: 83, lightness: 53, foreground: "#fafafa" },
    dark: { hue: 213, saturation: 94, lightness: 68, foreground: "#18181b" },
  },
  {
    id: "teal",
    label: "Teal",
    light: { hue: 181, saturation: 100, lightness: 28, foreground: "#fafafa" },
    dark: { hue: 170, saturation: 76, lightness: 64, foreground: "#18181b" },
  },
  {
    id: "green",
    label: "Green",
    light: { hue: 142, saturation: 72, lightness: 30, foreground: "#fafafa" },
    dark: { hue: 142, saturation: 71, lightness: 62, foreground: "#18181b" },
  },
  {
    id: "amber",
    label: "Amber",
    light: { hue: 24, saturation: 90, lightness: 40, foreground: "#fafafa" },
    dark: { hue: 32, saturation: 98, lightness: 68, foreground: "#18181b" },
  },
  {
    id: "rose",
    label: "Rose",
    light: { hue: 342, saturation: 70, lightness: 42, foreground: "#fafafa" },
    dark: { hue: 350, saturation: 89, lightness: 70, foreground: "#18181b" },
  },
  {
    id: "indigo",
    label: "Indigo",
    light: { hue: 245, saturation: 75, lightness: 54, foreground: "#fafafa" },
    dark: { hue: 230, saturation: 89, lightness: 74, foreground: "#18181b" },
  },
  {
    id: "cyan",
    label: "Cyan",
    light: { hue: 190, saturation: 90, lightness: 33, foreground: "#fafafa" },
    dark: { hue: 188, saturation: 86, lightness: 61, foreground: "#18181b" },
  },
];

export function getAccentCSSVariables(color: AccentColor) {
  return {
    "--pm-accent-light-hue": String(color.light.hue),
    "--pm-accent-light-saturation": `${color.light.saturation}%`,
    "--pm-accent-light-lightness": `${color.light.lightness}%`,
    "--pm-accent-light-foreground": color.light.foreground,
    "--pm-accent-dark-hue": String(color.dark.hue),
    "--pm-accent-dark-saturation": `${color.dark.saturation}%`,
    "--pm-accent-dark-lightness": `${color.dark.lightness}%`,
    "--pm-accent-dark-foreground": color.dark.foreground,
  } as const;
}

export function getAccentColor(id: string | null | undefined): AccentColor {
  return ACCENT_COLORS.find((color) => color.id === id) ?? ACCENT_COLORS[0];
}
