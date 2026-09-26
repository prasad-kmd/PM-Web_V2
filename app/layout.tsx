import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { fontClasses, fontVariables } from "@/lib/fonts";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: {
    default: "PrasadM — Mechanical + Mechatronics Engineer",
    template: "%s — PrasadM",
  },
  description:
    "Working archive of a mechanical + mechatronics engineer: robot builds, mechanism drawings, firmware notes, tutorials and field lessons.",
};

/**
 * Runs before first paint so the stored / system theme is applied with no
 * flash of the wrong substrate. Mirrors lib/theme.ts getInitialTheme().
 */
const THEME_BOOT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem("pm-theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    if (location.pathname !== "/") document.documentElement.dataset.snap = "off";
  } catch (error) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
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
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
