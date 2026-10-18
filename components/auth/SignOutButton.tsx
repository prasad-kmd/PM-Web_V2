"use client";

import { LogOut, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";

/**
 * Signs the reader out **without moving them**.
 *
 * The reference behaviour — sign out, then jump to the home page — loses the
 * reader's place for no reason. Signing out is not a navigation; it is a state
 * change. `router.refresh()` re-renders the page they are already on so the nav
 * stops showing their avatar, and the URL never changes.
 *
 * The exception is by construction rather than by special-casing: signing out on
 * a protected page (`/dashboard`, `/admin`) leaves the reader there for exactly
 * one request, and `proxy.ts` then answers with the sign-in redirect. That is
 * the correct outcome, and it comes from the gate rather than from this button.
 */
type SignOutButtonProps = {
  children?: ReactNode;
  className?: string;
  /** Called before the refresh, e.g. to close the menu this lives in. */
  onSignedOut?: () => void;
};

export function SignOutButton({
  children = "Sign out",
  className,
  onSignedOut,
}: SignOutButtonProps) {
  const { isPending, signOutNow } = useSignOut();

  return (
    <button
      type="button"
      onClick={() => void signOutNow(onSignedOut)}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-2 text-left",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4 shrink-0" aria-hidden />
      )}
      {children}
    </button>
  );
}
