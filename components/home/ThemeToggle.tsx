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
      className="google-sans flex items-center gap-3 rounded-full border border-border/50 bg-muted/30 px-4 py-2 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <Moon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
      )}
      <span className="font-mono text-[10px] font-medium uppercase tracking-tighter text-muted-foreground">
        {theme === "dark" ? "Dark" : "Light"} Mode
      </span>
    </button>
  );
}
