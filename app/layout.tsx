import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { fontClasses, fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "PrasadM — Mechanical + Mechatronics Engineer",
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
  } catch (error) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariables} ${fontClasses} h-full antialiased`}
    >
      <head>
        <Script id="pm-theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
