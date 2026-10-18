"use client";

import type { ComponentProps } from "react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog";

/**
 * A submit button that asks before it acts.
 *
 * Sits inside a plain `<form action={serverAction}>`, so the action itself works
 * with JavaScript disabled — only the confirmation needs it. That ordering is
 * deliberate: a guard rail should never be the thing that *creates* a
 * dependency. With JS off the button is still `type="submit"` and posts
 * straight through, exactly as it did with the native `confirm()`. A missing
 * confirmation is a worse experience; an unusable Delete button would be a worse
 * product.
 *
 * **Why the site's `Dialog` and not `window.confirm`.** Phase 4 used the native
 * modal and justified it on accessibility grounds: it is focus-trapped,
 * Escape-dismissible and announced correctly without a line of code that could
 * get those wrong. That reasoning was sound for a button that had to ship, but
 * it is not a reason to keep it. This dialog is built on Base UI's primitive,
 * which supplies the same focus trap, the same Escape handling, `role="dialog"`,
 * and `aria-modal` — and it puts the destructive action behind the site's own
 * type scale, palette and dark mode instead of stopping the page with a browser
 * chrome dialog.
 *
 * Two details that matter more than the styling:
 *
 * 1. **Cancel is first in the DOM.** Base UI moves focus into the popup when it
 *    opens, so the first focusable element is what a stray Enter or Space will
 *    activate. That must be the safe option. The popup's own close button is
 *    suppressed for the same reason — it would otherwise sit ahead of Cancel.
 * 2. **The action runs from `requestSubmit()`, not from a second form.** The
 *    dialog is a sibling of the button, not a wrapper, so there is no nested
 *    form and no second submit path to keep in sync. `button.form` is the form
 *    the button belongs to, which is the one the server action is bound to.
 */
type ConfirmSubmitProps = ComponentProps<typeof Button> & {
  /** The dialog's heading. Should name what is about to be lost. */
  confirm: string;
  /** Optional sentence under the heading, for consequences that are not obvious. */
  confirmDescription?: string;
  /** Label for the button that actually performs the action. */
  confirmAction?: string;
};

export function ConfirmSubmit({
  confirm,
  confirmDescription,
  confirmAction = "Delete",
  onClick,
  children,
  ...rest
}: ConfirmSubmitProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function proceed() {
    setOpen(false);
    // `form` is the nearest ancestor form — the one carrying the server action.
    // Absent only if this button is ever rendered outside a form, in which case
    // there is nothing to submit and nothing to confirm.
    buttonRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        {...rest}
        ref={buttonRef}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          // With JS running, the dialog is the only way to submit. Without it,
          // this handler never runs and the browser posts the form directly.
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup showCloseButton={false} className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">{confirm}</DialogTitle>
                {confirmDescription ? (
                  <DialogDescription className="text-sm leading-6 text-muted-foreground">
                    {confirmDescription}
                  </DialogDescription>
                ) : null}
              </DialogHeader>
              <DialogFooter>
                {/* First focusable in the popup — see note 1 above. */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={proceed}>
                  {confirmAction}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
    </>
  );
}
