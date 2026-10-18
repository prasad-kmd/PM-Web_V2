"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

/**
 * Signing out, in one place.
 *
 * Two surfaces need this and they need it in different shapes:
 * `SignOutButton` renders a real `<button>` (on `/dashboard`), while `UserMenu`
 * needs the action without the markup, because a Radix menu item is its own
 * `role="menuitem"` element and nesting a button inside it would be both invalid
 * markup and a keyboard trap. So the behaviour lives here and the wrappers
 * differ.
 *
 * The important part is what happens *after*: the reader stays where they are.
 * Signing out is a state change, not a navigation — jumping to the home page
 * loses their place for no reason. `router.refresh()` re-renders the current
 * route so the navigation stops showing an avatar. The one exception comes from
 * the gate rather than from here: signing out on `/dashboard` or `/admin` leaves
 * them on a protected URL for exactly one request, and `proxy.ts` answers with
 * the sign-in redirect. That is the correct outcome.
 */
export function useSignOut() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  /**
   * @param onSignedOut runs before the refresh — used to close the menu this
   *   was triggered from, so focus is not left inside a disappearing overlay.
   */
  async function signOutNow(onSignedOut?: () => void) {
    setIsPending(true);
    try {
      await signOut();
    } catch {
      // A failed sign-out leaves the cookie in place. The refresh below then
      // shows the reader their session is still live rather than pretending
      // otherwise.
    } finally {
      onSignedOut?.();
      router.refresh();
      setIsPending(false);
    }
  }

  return { isPending, signOutNow };
}
