import localFont from "next/font/local";

/**
 * Every typeface shipped in /public/fonts is registered here via next/font —
 * no external font requests, ever. Paths are relative to this file (lib/).
 */

export const amoria = localFont({
  src: "../public/fonts/AMORIARegular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-amoria",
});

export const anthropicSerifDisplay = localFont({
  src: [
    {
      path: "../public/fonts/AnthropicSerif/AnthropicSerifDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/AnthropicSerif/AnthropicSerifDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-anthropic-serif-display",
});

export const anthropicSerifText = localFont({
  src: "../public/fonts/AnthropicSerif/AnthropicSerifText-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-anthropic-serif-text",
});

export const googleSans = localFont({
  src: "../public/fonts/GoogleSans-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-google-sans",
});

export const inter24pt = localFont({
  src: "../public/fonts/Inter24pt-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-inter24",
});

export const jetbrainsMono = localFont({
  src: "../public/fonts/JetBrainsMono-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const montserrat = localFont({
  src: "../public/fonts/Montserrat-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-montserrat",
});

export const mozillaHeadline = localFont({
  src: "../public/fonts/MozillaHeadline-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-mozilla-headline",
});

export const msMadi = localFont({
  src: "../public/fonts/MsMadi-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-ms-madi",
});

export const notoSansDisplay = localFont({
  src: "../public/fonts/NotoSansDisplay-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-noto-sans-display",
});

export const qtypeComp = localFont({
  src: [
    { path: "../public/fonts/Qtype/QTypeCompBook.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Qtype/QTypeCompMedium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-qtype-comp",
});

export const qtypeCond = localFont({
  src: [
    { path: "../public/fonts/Qtype/QTypeCondBook.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Qtype/QTypeCondMedium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-qtype-cond",
});

export const qtypeExtd = localFont({
  src: [
    { path: "../public/fonts/Qtype/QTypeExtdBook.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Qtype/QTypeExtdMedium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-qtype-extd",
});

export const qtypeSeExt = localFont({
  src: [
    { path: "../public/fonts/Qtype/QTypeSeExtBook.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Qtype/QTypeSeExtMedium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-qtype-se-ext",
});

export const qtypeSquare = localFont({
  src: [
    { path: "../public/fonts/Qtype/QTypeSquareBook.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Qtype/QTypeSquareMedium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-qtype-square",
});

export const notoSerifSinhala = localFont({
  src: "../public/fonts/Sinhala/NotoSerifSinhala-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-noto-serif-sinhala",
});

export const unAbhaya = localFont({
  src: "../public/fonts/Sinhala/UN-Abhaya.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-un-abhaya",
});

export const unArundathee = localFont({
  src: "../public/fonts/Sinhala/UN-Arundathee.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-un-arundathee",
});

export const unBindumathi = localFont({
  src: "../public/fonts/Sinhala/UN-Bindumathi.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-un-bindumathi",
});

export const siraman = localFont({
  src: "../public/fonts/Siraman-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-siraman",
});

/** Class bundle that mounts every font CSS variable on <html>. */
export const fontVariables = [
  amoria.variable,
  anthropicSerifDisplay.variable,
  anthropicSerifText.variable,
  googleSans.variable,
  inter24pt.variable,
  jetbrainsMono.variable,
  montserrat.variable,
  mozillaHeadline.variable,
  msMadi.variable,
  notoSansDisplay.variable,
  qtypeComp.variable,
  qtypeCond.variable,
  qtypeExtd.variable,
  qtypeSeExt.variable,
  qtypeSquare.variable,
  notoSerifSinhala.variable,
  unAbhaya.variable,
  unArundathee.variable,
  unBindumathi.variable,
  siraman.variable,
].join(" ");

/** Class bundle that applies the site's core typefaces to <html>. */
export const fontClasses = [
  googleSans.className,
  jetbrainsMono.className,
  notoSerifSinhala.className,
].join(" ");
