"use client";

import { LogIn, Shield, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignInButton } from "@/components/auth/SignInButton";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSession } from "@/lib/auth-client";
import { AUTH_ROUTES } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The account entry point in the nav surfaces.
 *
 * Three states, and the loading one matters: `useSession()` resolves on the
 * client, so without it a signed-in reader sees "Sign in" for a beat on every
 * page load. The placeholder occupies the same box as the avatar, so nothing
 * jumps when the real state arrives.
 *
 * `role` is typed rather than cast, because `lib/auth-client.ts` registers
 * `inferAdditionalFields<typeof auth>()`. That is what makes the conditional
 * Admin link below type-safe.
 *
 * `surface` only picks the tooltip side: the floating navbar sits at the top of
 * the screen, the sidebar rail down the left edge.
 */
type UserMenuProps = {
  surface?: "floating" | "sidebar";
  className?: string;
};

/** First letter of a display name, for when there is no avatar image. */
function initialOf(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

const TRIGGER_CLASS =
  "flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function UserMenu({ surface = "floating", className }: UserMenuProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const signOutState = useSignOut();
  const [imageFailed, setImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const tooltipSide = surface === "sidebar" ? "right" : "bottom";
  const user = session?.user;

  // Resolving. Same size as the button in every other state, so the row does
  // not reflow when the answer arrives. Not announced — there is nothing to
  // announce yet, and a spinner in a nav bar is noise.
  if (isPending) {
    return (
      <span
        className={cn(TRIGGER_CLASS, "cursor-default opacity-60", className)}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <SignInButton
            aria-label="Sign in"
            className={cn(TRIGGER_CLASS, className)}
          >
            <LogIn className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </SignInButton>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} sideOffset={9}>
          Sign in
        </TooltipContent>
      </Tooltip>
    );
  }

  const isAdmin = user.role === "admin";
  const displayName = user.name?.trim() || "Signed in";
  const showImage = Boolean(user.image) && !imageFailed;

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={`Account menu — ${displayName}`}
            className={cn(
              TRIGGER_CLASS,
              "overflow-hidden data-[state=open]:bg-muted",
              className,
            )}
          >
            {showImage ? (
              <Image
                src={user.image ?? ""}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span
                className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                aria-hidden
              >
                {initialOf(user.name)}
              </span>
            )}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} sideOffset={9}>
          {displayName}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" sideOffset={10} className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium text-ink">{displayName}</span>
          {user.email ? (
            <span className="truncate text-xs font-normal text-ink-soft">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation goes through `onSelect`, not an `<a>` inside the item.
            This menu primitive renders each item as its own `role="menuitem"`
            element and explicitly disallows `asChild`, so the item *is* the
            interactive thing — which is what keeps roving focus, Escape and
            typeahead working. */}
        <DropdownMenuItem
          onSelect={() => {
            setMenuOpen(false);
            router.push(AUTH_ROUTES.dashboard);
          }}
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Dashboard
        </DropdownMenuItem>

        {isAdmin ? (
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false);
              router.push(AUTH_ROUTES.admin);
            }}
          >
            <Shield className="size-4" aria-hidden />
            Admin
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={signOutState.isPending}
          onSelect={() => {
            void signOutState.signOutNow(() => setMenuOpen(false));
          }}
        >
          {signOutState.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4" aria-hidden />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
