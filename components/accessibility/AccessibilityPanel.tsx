"use client";

import type { ReactNode } from "react";
import { isReaderRoute } from "@/lib/accessibility/content-routes";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
} from "@/components/animate-ui/components/base/dialog";
import { ControlPanel } from "@/components/accessibility/ControlPanel";
import { FloatingButton } from "@/components/accessibility/FloatingButton";
import { useAccessibility } from "@/contexts/AccessibilityContext";

/** One dialog root owns both the dock trigger and the desktop floating trigger. */
export function AccessibilityPanel({ children }: { children?: ReactNode }) {
  const { isPanelOpen, updateSetting } = useAccessibility();
  const pathname = usePathname();

  if (!isReaderRoute(pathname)) return children;

  return (
    <Dialog
      open={isPanelOpen}
      onOpenChange={(open) => updateSetting("isPanelOpen", open)}
    >
      {children}
      <DialogTrigger render={<FloatingButton />} />
      <ControlPanel />
    </Dialog>
  );
}
