"use client";

import { motion } from "motion/react";
import {
  Boxes,
  Info,
  House,
  Moon,
  Sun,
  Wrench,
  User,
  LogOut,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AccentPicker } from "@/components/site/AccentPicker";
import { cn } from "@/lib/utils";
import { applyTheme, getDocumentTheme, subscribeTheme } from "@/lib/theme";
import { authClient } from "@/lib/auth-client";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/", icon: House },
  { label: "About", href: "/about", icon: Info },
  { label: "Projects", href: "/projects", icon: Boxes },
  { label: "Tools", href: "/tools", icon: Wrench },
];

export function FloatingNavbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getDocumentTheme,
    () => "light" as const,
  );
  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  const user = session?.user;
  const userRole = (user as { role?: string })?.role;
  const dashboardHref = userRole === "admin" ? "/admin" : "/dashboard";
  const authHref = user
    ? dashboardHref
    : `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <nav
      aria-label="Floating navigation"
      className="fixed right-6 top-5 z-50 hidden items-center gap-1 rounded-full border border-border/80 bg-background/80 p-1.5 shadow-[0_0_30px_-7px_color-mix(in_srgb,var(--pm-ink)_26%,transparent)] backdrop-blur-2xl md:flex"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-10 items-center justify-center overflow-hidden rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "text-primary-foreground"
                    : "text-ink-soft hover:bg-muted hover:text-ink",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="floating-navbar-active"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className="relative size-[18px]"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={9}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {/* User / Dashboard Icon Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={authHref}
            aria-label={user ? "User Dashboard" : "Sign In"}
            className={cn(
              "relative flex size-10 items-center justify-center overflow-hidden rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              pathname === "/dashboard" ||
                pathname === "/admin" ||
                pathname.startsWith("/auth")
                ? "bg-primary text-primary-foreground"
                : "text-ink-soft hover:bg-muted hover:text-ink",
            )}
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="size-7 rounded-full object-cover ring-1 ring-border"
              />
            ) : userRole === "admin" ? (
              <Shield
                className="size-[18px] text-amber-500"
                strokeWidth={1.8}
                aria-hidden
              />
            ) : (
              <User className="size-[18px]" strokeWidth={1.8} aria-hidden />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={9}>
          {user
            ? userRole === "admin"
              ? "Admin Console"
              : "Dashboard"
            : "Sign In / Register"}
        </TooltipContent>
      </Tooltip>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <AccentPicker placement="floating" side="bottom" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => applyTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            className="flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ThemeIcon className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={9}>
          {isDark ? "Switch to light theme" : "Switch to dark theme"}
        </TooltipContent>
      </Tooltip>
    </nav>
  );
}
