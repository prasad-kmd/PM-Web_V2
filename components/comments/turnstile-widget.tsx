"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ShieldAlert } from "lucide-react";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
} from "react";
import { getDocumentTheme, subscribeTheme } from "@/lib/theme";
import { TURNSTILE_TEST_SITE_KEY } from "@/lib/comments/config";

/**
 * Cloudflare Turnstile widget, ported from PMEngineerLK-NextJS
 * (`components/comments/turnstile-widget.tsx`).
 *
 * Differences from the reference:
 *  - PM-Web_V2 manages theming with `lib/theme.ts` (a class on <html>) rather
 *    than next-themes, so the widget subscribes to that store instead.
 *  - The site key is inlined at build time from
 *    `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; in development it falls back to
 *    Cloudflare's always-pass test key.
 */

export type TurnstileWidgetRef = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
};

export const TurnstileWidget = forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(function TurnstileWidget({ onVerify, onError, onExpire }, ref) {
  const widgetRef = useRef<TurnstileInstance>(null);
  const theme = useSyncExternalStore(
    subscribeTheme,
    getDocumentTheme,
    () => "light" as const,
  );

  useImperativeHandle(ref, () => ({
    reset: () => widgetRef.current?.reset(),
  }));

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SITE_KEY);

  if (!siteKey) {
    return (
      <div className="my-2 flex min-h-16 flex-col items-start justify-center gap-1 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-destructive">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <ShieldAlert className="size-3.5" />
          Verification unavailable
        </span>
        <span className="text-[11px] leading-4 opacity-80">
          Set <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> to enable comments.
        </span>
      </div>
    );
  }

  return (
    <div className="my-2 flex min-h-16 justify-start">
      <Turnstile
        ref={widgetRef}
        siteKey={siteKey}
        injectScript
        options={{ theme, size: "normal" }}
        onSuccess={onVerify}
        onError={onError}
        onExpire={onExpire}
      />
    </div>
  );
});
