"use client";

import {
  Accessibility,
  Boxes,
  Info,
  House,
  LogIn,
  Menu,
  Moon,
  Sun,
  User,
  Wrench,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { DialogTrigger } from "@/components/animate-ui/components/base/dialog";
import { isReaderRoute } from "@/lib/accessibility/content-routes";
import { useSession } from "@/lib/auth-client";
import { buildSignInHref } from "@/lib/auth/callback-url";
import { AUTH_ROUTES, DEFAULT_SIGNED_IN_PATH, PRIMARY_NAV } from "@/lib/nav";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import Dock, { type DockItemData } from "@/components/reactbits/Dock";
import { useSidebar } from "@/components/animate-ui/components/radix/sidebar";
import { applyTheme, getDocumentTheme, subscribeTheme } from "@/lib/theme";

/** Path → dock icon. See `FloatingNavbar.tsx` for why these are not in lib/nav.ts. */
const DOCK_ICONS: Record<string, ReactNode> = {
  "/": <House className="size-[18px]" strokeWidth={1.8} aria-hidden />,
  "/about": <Info className="size-[18px]" strokeWidth={1.8} aria-hidden />,
  "/projects": <Boxes className="size-[18px]" strokeWidth={1.8} aria-hidden />,
  "/tools": <Wrench className="size-[18px]" strokeWidth={1.8} aria-hidden />,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isPanelOpen } = useAccessibility();
  const { openMobile, setOpenMobile } = useSidebar();
  const { data: session, isPending } = useSession();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getDocumentTheme,
    () => "light" as const,
  );
  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  // The same list the floating navbar uses, so the two can no longer disagree
  // about which routes exist. Icons stay local for the edge-bundle reason given
  // in FloatingNavbar.tsx.
  const navItems: DockItemData[] = PRIMARY_NAV.map((item) => ({
    label: item.label,
    href: item.href,
    active:
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    icon: DOCK_ICONS[item.href] ?? (
      <Wrench className="size-[18px]" strokeWidth={1.8} aria-hidden />
    ),
  }));

  /**
   * The account entry point.
   *
   * This is the one surface that builds its sign-in href from `usePathname()`
   * alone rather than through `<SignInButton>`. The reason is structural: the
   * dock lives in `SiteShell`, which wraps *every* page, so a `useSearchParams()`
   * here would need a Suspense boundary around the entire site chrome — and a
   * static page would then have to client-render its whole navigation.
   *
   * The cost is bounded and worth naming: on mobile, signing in from
   * `/blog?tag=firmware` returns to `/blog`, not to the filtered view. The path
   * is preserved, which is what item 4 is about; a query string may be dropped.
   */
  const signInHref = buildSignInHref(pathname, DEFAULT_SIGNED_IN_PATH);
  const accountItem: DockItemData = isPending
    ? {
        // Neutral while the session resolves: "Account" is true whichever way
        // the answer goes, so the label does not flicker.
        label: "Account",
        href: signInHref,
        icon: <User className="size-[18px]" strokeWidth={1.8} aria-hidden />,
      }
    : session
      ? {
          label: "Account",
          href: AUTH_ROUTES.dashboard,
          active: pathname.startsWith(AUTH_ROUTES.dashboard),
          icon: <User className="size-[18px]" strokeWidth={1.8} aria-hidden />,
        }
      : {
          label: "Sign in",
          href: signInHref,
          icon: <LogIn className="size-[18px]" strokeWidth={1.8} aria-hidden />,
        };

  const items: DockItemData[] = [
    ...navItems,
    accountItem,
    {
      label: isDark ? "Light theme" : "Dark theme",
      onClick: () => applyTheme(isDark ? "light" : "dark"),
      icon: <ThemeIcon className="size-[18px]" strokeWidth={1.8} aria-hidden />,
    },
    {
      label: openMobile ? "Close menu" : "Menu",
      onClick: () => setOpenMobile(!openMobile),
      active: openMobile,
      expanded: openMobile,
      icon: openMobile ? (
        <X className="size-[19px]" strokeWidth={1.8} aria-hidden />
      ) : (
        <Menu className="size-[19px]" strokeWidth={1.8} aria-hidden />
      ),
    },
  ];

  if (isReaderRoute(pathname)) {
    items.splice(4, 0, {
      label: "Reading options",
      active: isPanelOpen,
      icon: (
        <Accessibility className="size-[18px]" strokeWidth={1.8} aria-hidden />
      ),
      renderAction: (button) => <DialogTrigger render={button} />,
    });
  }

  return <Dock items={items} label="Mobile navigation" />;
}
