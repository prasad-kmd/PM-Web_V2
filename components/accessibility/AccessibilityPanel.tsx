"use client";

import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
} from "@/components/animate-ui/components/base/dialog";
import { ControlPanel } from "@/components/accessibility/ControlPanel";
import { FloatingButton } from "@/components/accessibility/FloatingButton";
import { useAccessibility } from "@/contexts/AccessibilityContext";

/** Route roots whose detail pages carry long-form Notion content. */
const CONTENT_ROOTS = ["articles", "blog", "glossary", "projects", "tutorials"];

/**
 * Floating reading-options control for content pages: the trigger is the
 * A11Y button, the popup is the animate-ui dialog that hosts the control
 * panel. Both live inside one dialog root so the trigger keeps its built-in
 * dialog semantics (aria-haspopup, focus return, Escape to close).
 */
export function AccessibilityPanel() {
  const { isPanelOpen, updateSetting } = useAccessibility();
  const pathname = usePathname();

  const [root, slug] = pathname.split("/").filter(Boolean);
  const isContentPage = CONTENT_ROOTS.includes(root ?? "") && Boolean(slug);

  if (!isContentPage) return null;

  return (
    <Dialog
      open={isPanelOpen}
      onOpenChange={(open) => updateSetting("isPanelOpen", open)}
    >
      <DialogTrigger render={<FloatingButton />} />
      <ControlPanel />
    </Dialog>
  );
}
