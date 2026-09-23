"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import FooterSection from "@/components/home/FooterSection";
import { AppSidebar } from "@/components/site/AppSidebar";

/**
 * Global frame. variant="sidebar" pushes the page instead of covering it.
 * Homepage chapter snap stays on the document scroller — this shell must not
 * become its own scroll container, or the section jump stops working.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
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
    <SidebarProvider defaultOpen className="min-h-svh flex-1">
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 bg-transparent">
        <SidebarTrigger
          className="fixed top-3 left-3 z-30 border border-ink/20 bg-paper/90 text-ink md:hidden"
          aria-label="Open sidebar"
        />
        {children}
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
