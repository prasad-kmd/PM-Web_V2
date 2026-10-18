"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";

/**
 * Mounted on `/sign-in` and `/sign-up`. If a session already exists, forwards
 * the reader to their destination instead of showing the form again.
 *
 * `proxy.ts` already handles this on the server for a normal navigation, so why
 * a client guard too? Because the cases that annoy people are the client-side
 * ones: the back button after signing in, a second tab left open on the form, a
 * restored session. Those never produce a fresh document request, so the proxy
 * never sees them.
 *
 * `router.refresh()` after the `replace` is deliberate rather than redundant.
 * The target route may already sit in the client router cache — cached *before*
 * this reader was signed in, when it would have answered with a redirect. The
 * refresh drops that entry so the page is rendered for the session that now
 * exists.
 *
 * Renders nothing. Its only job is the side effect.
 */
export function AuthRedirectGuard({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !session) return;

    router.replace(callbackUrl);
    router.refresh();
  }, [callbackUrl, isPending, router, session]);

  return null;
}
