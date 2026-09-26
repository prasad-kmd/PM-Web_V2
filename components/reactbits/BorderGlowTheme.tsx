"use client";
import { useSyncExternalStore } from "react";
import BorderGlow from "./BorderGlow";
import { getDocumentTheme, subscribeTheme } from "@/lib/theme";
import type { ReactNode } from "react";

interface BorderGlowThemeProps {
  children: ReactNode;
  className?: string;
  borderRadius?: number;
  glowIntensity?: number;
  edgeSensitivity?: number;
  animated?: boolean;
  variant?: "violet" | "blue" | "zinc";
}

export default function BorderGlowTheme({
  children,
  className = "",
  borderRadius = 16,
  glowIntensity = 1.0,
  edgeSensitivity = 32,
  animated = false,
  variant = "violet",
}: BorderGlowThemeProps) {
  const theme = useSyncExternalStore(subscribeTheme, getDocumentTheme, () => "light" as const);
  const isDark = theme === "dark";

  const palettes = {
    violet: {
      colors: isDark ? ["#8b5cf6", "#a78bfa", "#c4b5fd"] : ["#6e56cf", "#8b5cf6", "#a78bfa"],
      glowColor: isDark ? "265 80 70" : "255 65 55",
    },
    blue: {
      colors: isDark ? ["#60a5fa", "#93c5fd", "#bfdbfe"] : ["#3a7bd5", "#60a5fa", "#93c5fd"],
      glowColor: isDark ? "210 80 70" : "212 70 60",
    },
    zinc: {
      colors: isDark ? ["#52525b", "#71717a", "#a1a1aa"] : ["#71717a", "#a1a1aa", "#d4d4d8"],
      glowColor: isDark ? "240 5 60" : "240 5 50",
    },
  };

  const p = palettes[variant];

  return (
    <BorderGlow
      className={className}
      colors={p.colors}
      glowColor={p.glowColor}
      borderRadius={borderRadius}
      glowRadius={32}
      glowIntensity={glowIntensity}
      edgeSensitivity={edgeSensitivity}
      coneSpread={22}
      animated={animated}
      fillOpacity={0.45}
    >
      {children}
    </BorderGlow>
  );
}
