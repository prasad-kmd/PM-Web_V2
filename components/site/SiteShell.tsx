"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/animate-ui/components/radix/sidebar";
import FooterSection from "@/components/home/FooterSection";
import { AppSidebar } from "@/components/site/AppSidebar";
import { FloatingNavbar } from "@/components/site/FloatingNavbar";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { WisteriaScrollbar } from "@/components/site/WisteriaScrollbar";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ContentBookmarksProvider } from "@/components/notion/ContentBookmarksProvider";

/**
 * Global frame. variant="sidebar" pushes the page instead of covering it.
 * The rail starts collapsed (icon mode) on desktop. Homepage chapter snap
 * stays on the document scroller — this shell must not become its own
 * scroll container, or the section jump stops working. Interior routes set
 * data-snap="home" is enabled only on the homepage.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Chapter-snap routes: the homepage and /about are both read as a
    // sequence of viewport-tall chapters.
    if (pathname === "/") root.dataset.snap = "home";
    else if (pathname === "/about") root.dataset.snap = "about";
    else delete root.dataset.snap;
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
            <AccessibilityPanel>
              <MobileBottomNav />
            </AccessibilityPanel>
            <ScrollToTop />
            <WisteriaScrollbar />
          </SidebarInset>
        </SidebarProvider>
      </ContentBookmarksProvider>
    </AccessibilityProvider>
  );
}
