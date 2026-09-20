import type { Metadata } from "next";
import "./globals.css";
import { fontClasses, fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "PrasadM — Mechanical + Mechatronics Engineer",
  description:
    "Working archive of a mechanical + mechatronics engineer: robot builds, mechanism drawings, firmware notes, tutorials and field lessons.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} ${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
