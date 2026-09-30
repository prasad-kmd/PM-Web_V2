"use client";

import {
  Accessibility,
  Boxes,
  Info,
  House,
  Menu,
  Moon,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { DialogTrigger } from "@/components/animate-ui/components/base/dialog";
import { isReaderRoute } from "@/lib/accessibility/content-routes";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import Dock, { type DockItemData } from "@/components/reactbits/Dock";
import { useSidebar } from "@/components/animate-ui/components/radix/sidebar";
import { applyTheme, getDocumentTheme, subscribeTheme } from "@/lib/theme";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isPanelOpen } = useAccessibility();
  const { openMobile, setOpenMobile } = useSidebar();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getDocumentTheme,
    () => "light" as const,
  );
  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;

  const items: DockItemData[] = [
    {
      label: "Home",
      href: "/",
      active: pathname === "/",
      icon: <House className="size-[18px]" strokeWidth={1.8} aria-hidden />,
    },
    {
      label: "About",
      href: "/about",
      active: pathname.startsWith("/about"),
      icon: (
        <Info className="size-[18px]" strokeWidth={1.8} aria-hidden />
      ),
    },
    {
      label: "Projects",
      href: "/projects",
      active: pathname.startsWith("/projects"),
      icon: <Boxes className="size-[18px]" strokeWidth={1.8} aria-hidden />,
    },
    {
      label: "Tools",
      href: "/tools",
      active: pathname.startsWith("/tools"),
      icon: <Wrench className="size-[18px]" strokeWidth={1.8} aria-hidden />,
    },
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
