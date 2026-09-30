import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { fontClasses, fontVariables } from "@/lib/fonts";
import { SiteShell } from "@/components/site/SiteShell";
import { CustomContextMenu } from "@/components/custom-context-menu";
import { Toaster } from "sonner";
import {
  ACCENT_COLORS,
  ACCENT_STORAGE_KEY,
  getAccentCSSVariables,
} from "@/lib/accent-colors";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://prasadm.vercel.app",
  ),
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  title: {
    default: "PrasadM - Mechatronics Engineering Undergraduate",
    template: "%s - PrasadM",
  },
  description:
    "Working archive of a mechanical + mechatronics engineer: robot builds, mechanism drawings, firmware notes, tutorials and field lessons.",
};

/**
 * Runs before first paint so the stored / system theme and selected accent are
 * applied without a flash of the default palette.
 */
const ACCENT_BOOT_VALUES = Object.fromEntries(
  ACCENT_COLORS.map((color) => [color.id, getAccentCSSVariables(color)]),
);

const THEME_BOOT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem("pm-theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    var accents = ${JSON.stringify(ACCENT_BOOT_VALUES)};
    var accent = accents[localStorage.getItem("${ACCENT_STORAGE_KEY}")];
    if (accent) {
      Object.keys(accent).forEach(function (property) {
        root.style.setProperty(property, accent[property]);
      });
    }
    if (location.pathname === "/") root.dataset.snap = "home";
    else if (location.pathname === "/about") root.dataset.snap = "about";
  } catch (error) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      id="page-scroller"
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${fontVariables} ${fontClasses} h-full antialiased`}
    >
      <head>
        <Script id="pm-theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <CustomContextMenu>
          <SiteShell>{children}</SiteShell>
        </CustomContextMenu>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
