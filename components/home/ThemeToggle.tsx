"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  getDocumentTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Dark / light switch. Lives in the footer bottom bar; the boot script in
 * app/layout.tsx applies the stored preference before first paint.
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    getDocumentTheme,
    () => "light",
  );

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex items-center gap-2.5 rounded-full border border-border/60 bg-muted/40 px-4 py-2 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {theme === "dark" ? (
        <Sun className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <Moon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
      )}
      <span className="text-xs font-medium text-muted-foreground">
        {theme === "dark" ? "Dark" : "Light"} mode
      </span>
    </button>
  );
}
