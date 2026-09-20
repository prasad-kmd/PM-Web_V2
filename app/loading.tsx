"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-web";
import { cn } from "@/lib/utils";
import {
  getDocumentTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

/**
 * PM Loading Screen - uses @lottiefiles/dotlottie-web with self-hosted WASM
 *
 * Why dotlottie-web instead of dotlottie-react?
 * - dotlottie-react is a wrapper around dotlottie-web, same CSP requirements
 * - Using web directly gives control over WASM URL via setWasmUrl()
 * - Self-hosting WASM (/dotlottie-player.wasm) avoids CDN CORS/CSP issues:
 *   next.config.mjs connect-src has no cdn.jsdelivr.net/unpkg.com, so a CDN
 *   WASM fetch would be blocked -> animation never appeared.
 *
 * Theme support:
 * - public/lottie ships a black and a white pulse mark; the loader reads the
 *   active theme (applied pre-paint by the boot script in app/layout.tsx)
 *   and swaps substrate + lottie accordingly. A theme switch while the
 *   loader is visible reloads the matching mark live.
 */

const LOTTIE_SRC: Record<Theme, string> = {
  light: "/lottie/pm4-black-fill-pulse.lottie",
  dark: "/lottie/pm4-white-fill-pulse.lottie",
};

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotLottieRef = useRef<DotLottie | null>(null);
  const loadedThemeRef = useRef<Theme | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Boot script already applied the class before first paint.
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    getDocumentTheme,
    () => "light",
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // Self-hosted WASM to avoid CDN CORS - must be called before creating instance
    try {
      DotLottie.setWasmUrl("/dotlottie-player.wasm");
    } catch {
      // setWasmUrl may throw if already set, ignore
    }

    const dotLottie = new DotLottie({
      canvas: canvasRef.current,
      src: LOTTIE_SRC[getDocumentTheme()],
      loop: true,
      autoplay: true,
      renderConfig: {
        autoResize: true,
      },
    });
    dotLottieRef.current = dotLottie;
    loadedThemeRef.current = getDocumentTheme();

    const onReady = () => setIsReady(true);
    const onLoadError = () => {
      console.error("Failed to load PM pulse lottie");
    };
    dotLottie.addEventListener("ready", onReady);
    dotLottie.addEventListener("loadError", onLoadError);

    return () => {
      dotLottie.removeEventListener("ready", onReady);
      dotLottie.removeEventListener("loadError", onLoadError);
      dotLottie.destroy();
      dotLottieRef.current = null;
    };
  }, []);

  // Live theme switch while the loader is on screen: reload matching mark.
  useEffect(() => {
    if (loadedThemeRef.current === theme) return;
    loadedThemeRef.current = theme;
    dotLottieRef.current?.load({
      src: LOTTIE_SRC[theme],
      loop: true,
      autoplay: true,
    });
  }, [theme]);

  const dark = theme === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading PM Web"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center antialiased transition-colors duration-300",
        dark
          ? "bg-black selection:bg-white/10"
          : "bg-paper selection:bg-black/10",
      )}
    >
      {/* Ambient depth */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            "absolute inset-0",
            dark
              ? "bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.09)_0%,_rgba(255,255,255,0.03)_25%,_transparent_65%)]"
              : "bg-[radial-gradient(ellipse_at_center,_rgba(18,18,16,0.07)_0%,_rgba(18,18,16,0.025)_25%,_transparent_65%)]",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
            dark ? "opacity-[0.015]" : "opacity-[0.03]",
          )}
        />
      </div>

      {/* Canvas for dotLottie-web - this is the actual animation */}
      <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[440px] sm:w-[440px] md:h-[520px] md:w-[520px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-hidden="true"
          // Prevent Next.js from trying to optimize canvas
          data-lottie={dark ? "pm4-white-fill-pulse" : "pm4-black-fill-pulse"}
        />
        {/* Fallback while WASM loads */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "h-12 w-12 animate-spin rounded-full border",
                dark
                  ? "border-white/10 border-t-white/40"
                  : "border-black/10 border-t-black/40",
              )}
            />
          </div>
        )}
      </div>

      {/* Bottom meta */}
      <div className="absolute bottom-8 flex flex-col items-center gap-4 sm:bottom-12">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "h-px w-12",
              dark
                ? "bg-gradient-to-r from-transparent to-white/20"
                : "bg-gradient-to-r from-transparent to-black/20",
            )}
            aria-hidden="true"
          />
          <p
            className={cn(
              "font-mono text-[11px] font-medium tracking-[0.4em]",
              dark ? "text-white/60" : "text-ink-soft",
            )}
          >
            PM
          </p>
          <span
            className={cn(
              "h-px w-12",
              dark
                ? "bg-gradient-to-l from-transparent to-white/20"
                : "bg-gradient-to-l from-transparent to-black/20",
            )}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-1 w-1 animate-pulse rounded-full [animation-delay:0ms]",
              dark ? "bg-white/40" : "bg-black/40",
            )}
          />
          <span
            className={cn(
              "h-1 w-1 animate-pulse rounded-full [animation-delay:200ms]",
              dark ? "bg-white/40" : "bg-black/40",
            )}
          />
          <span
            className={cn(
              "h-1 w-1 animate-pulse rounded-full [animation-delay:400ms]",
              dark ? "bg-white/40" : "bg-black/40",
            )}
          />
        </div>
        <p
          className={cn(
            "font-mono text-[10px] tracking-[0.28em]",
            dark ? "text-white/25" : "text-ink-soft/60",
          )}
        >
          LOADING
        </p>
      </div>

      <span className="sr-only">Loading, please wait</span>
    </div>
  );
}
