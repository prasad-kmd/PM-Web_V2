"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/animate-ui/components/radix/sidebar";
import FooterSection from "@/components/home/FooterSection";
import { AppSidebar } from "@/components/site/AppSidebar";
import { FloatingNavbar } from "@/components/site/FloatingNavbar";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ContentBookmarksProvider } from "@/components/notion/ContentBookmarksProvider";

/**
 * Global frame. variant="sidebar" pushes the page instead of covering it.
 * The rail starts collapsed (icon mode) on desktop. Homepage chapter snap
 * stays on the document scroller — this shell must not become its own
 * scroll container, or the section jump stops working. Interior routes set
 * data-snap="off" so they scroll normally.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (pathname === "/") delete root.dataset.snap;
    else root.dataset.snap = "off";
    return () => {
      delete root.dataset.snap;
    };
  }, [pathname]);

  return (
    <AccessibilityProvider>
      <ContentBookmarksProvider>
        <SidebarProvider defaultOpen={false} className="min-h-svh flex-1">
          <AppSidebar />
          <SidebarInset className="min-h-svh min-w-0 bg-transparent">
            {children}
            <FooterSection />
            <div className="h-24 shrink-0 md:hidden" aria-hidden />
            <FloatingNavbar />
            <MobileBottomNav />
            <AccessibilityPanel />
          </SidebarInset>
        </SidebarProvider>
      </ContentBookmarksProvider>
    </AccessibilityProvider>
  );
}
