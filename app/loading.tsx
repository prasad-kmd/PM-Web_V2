'use client';

import { useEffect, useRef, useState } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

/**
 * PM Loading Screen - uses @lottiefiles/dotlottie-web with self-hosted WASM
 *
 * Why dotlottie-web instead of dotlottie-react?
 * - dotlottie-react is a wrapper around dotlottie-web, same CSP requirements
 * - Using web directly gives control over WASM URL via setWasmUrl()
 * - Self-hosting WASM (/dotlottie-player.wasm) avoids CDN CORS/CSP issues:
 *   Your next.config.mjs had connect-src without cdn.jsdelivr.net/unpkg.com,
 *   so WASM fetch from CDN was blocked -> animation never appeared.
 *
 * Fix applied in next.config.mjs:
 * - script-src: added 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://unpkg.com
 * - connect-src: added blob: https://cdn.jsdelivr.net https://unpkg.com
 * - Self-hosted WASM in public/dotlottie-player.wasm + setWasmUrl('/dotlottie-player.wasm')
 *
 * You can use both packages together:
 *   import { setWasmUrl } from '@lottiefiles/dotlottie-react'
 *   setWasmUrl('/dotlottie-player.wasm')
 *   -> then <DotLottieReact src="/lottie/pm4-white-fill-pulse.lottie" />
 *
 * This file uses web directly (canvas) - most CSP-friendly, no worker blob needed if you want.
 */

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Self-hosted WASM to avoid CDN CORS - must be called before creating instance
    // WASM file is in public/dotlottie-player.wasm (copied from @lottiefiles/dotlottie-web/dist/)
    try {
      DotLottie.setWasmUrl('/dotlottie-player.wasm');
    } catch {
      // setWasmUrl may throw if already set, ignore
    }

    const dotLottie = new DotLottie({
      canvas: canvasRef.current,
      src: '/lottie/pm4-white-fill-pulse.lottie',
      loop: true,
      autoplay: true,
      renderConfig: {
        autoResize: true,
      },
    });

    const onReady = () => setIsReady(true);
    const onLoadError = () => {
      // eslint-disable-next-line no-console
      console.error('Failed to load pm4-white-fill-pulse.lottie');
    };

    dotLottie.addEventListener('ready', onReady);
    dotLottie.addEventListener('loadError', onLoadError);

    return () => {
      dotLottie.removeEventListener('ready', onReady);
      dotLottie.removeEventListener('loadError', onLoadError);
      dotLottie.destroy();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading PM Web"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black antialiased selection:bg-white/10"
    >
      {/* Ambient depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.09)_0%,_rgba(255,255,255,0.03)_25%,_transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />
      </div>

      {/* Canvas for dotLottie-web - this is the actual animation */}
      <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[440px] sm:w-[440px] md:h-[520px] md:w-[520px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-hidden="true"
          // Prevent Next.js from trying to optimize canvas
          data-lottie="pm4-white-fill-pulse"
        />
        {/* Fallback while WASM loads */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border border-white/10 border-t-white/40" />
          </div>
        )}
      </div>

      {/* Bottom meta */}
      <div className="absolute bottom-8 flex flex-col items-center gap-4 sm:bottom-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" aria-hidden="true" />
          <p className="font-mono text-[11px] font-medium tracking-[0.4em] text-white/60">PM</p>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 animate-pulse rounded-full bg-white/40 [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-white/40 [animation-delay:200ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-white/40 [animation-delay:400ms]" />
        </div>
        <p className="font-mono text-[10px] tracking-[0.28em] text-white/25">LOADING</p>
      </div>

      <span className="sr-only">Loading, please wait</span>
    </div>
  );
}
