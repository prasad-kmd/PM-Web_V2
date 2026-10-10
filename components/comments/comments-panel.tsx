"use client";

import { MessageSquare } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCommenterIdentity } from "@/hooks/use-commenter-identity";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NotionComment } from "@/lib/comments/types";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

/**
 * The comments surface.
 *
 * One overlay, two presentations:
 *   - desktop (≥768px) → coss `Sheet`, sliding in from the right
 *   - mobile  (<768px) → coss `Drawer`, sliding up from the bottom
 *
 * `CommentsProvider` owns the open state and renders the overlay, so any
 * descendant can open it — that is what lets the article header carry a
 * Comments button without the trigger having to live next to the panel.
 * This is coss's documented "detached trigger via controlled state" pattern.
 *
 * Both containers render the same `CommentsPanelBody`, so behaviour and state
 * are identical; only the shell differs.
 */

type CommentsPanelContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openPanel: () => void;
  /** Comment count, or `null` until the panel has been opened once. */
  count: number | null;
  contentTitle: string;
};

const CommentsPanelContext = createContext<CommentsPanelContextValue | null>(
  null,
);

/** Reads the panel controls. Must be called inside `<CommentsProvider>`. */
export function useCommentsPanel(): CommentsPanelContextValue {
  const context = useContext(CommentsPanelContext);
  if (!context) {
    throw new Error(
      "useCommentsPanel must be used within a <CommentsProvider>.",
    );
  }
  return context;
}

type BodyProps = {
  pageId: string;
  open: boolean;
  onCountChange: (count: number) => void;
};

function CommentsPanelBody({ pageId, open, onCountChange }: BodyProps) {
  const { identity, hydrate, save } = useCommenterIdentity();
  const [pending, setPending] = useState<NotionComment[]>([]);
  const [fetchedCount, setFetchedCount] = useState(0);

  // Read the `pm_commenter` cookie once the component is on the client.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleCount = useCallback(
    (count: number) => {
      setFetchedCount(count);
      onCountChange(count + pending.length);
    },
    [onCountChange, pending.length],
  );

  const handlePosted = useCallback(
    (comment: NotionComment) => {
      const next = [comment, ...pending];
      setPending(next);
      onCountChange(fetchedCount + next.length);
    },
    [fetchedCount, onCountChange, pending],
  );

  return (
    <div className="grid gap-6">
      <CommentForm
        pageId={pageId}
        identity={identity}
        onIdentitySave={save}
        onPosted={handlePosted}
      />

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border/60" />
        <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
          Discussion
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <CommentList
        pageId={pageId}
        active={open}
        pending={pending}
        onCountChange={handleCount}
      />
    </div>
  );
}

type CommentsProviderProps = {
  /** Notion page id the comments are attached to. */
  pageId: string;
  /** Human-readable title used in the overlay header. */
  contentTitle: string;
  children: ReactNode;
};

/**
 * Owns the overlay and exposes the controls to everything it wraps.
 * Render it high enough in the tree that both the header button and the
 * end-of-article call to action are descendants.
 */
export function CommentsProvider({
  pageId,
  contentTitle,
  children,
}: CommentsProviderProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const openPanel = useCallback(() => setOpen(true), []);

  const value = useMemo<CommentsPanelContextValue>(
    () => ({ open, setOpen, openPanel, count, contentTitle }),
    [open, openPanel, count, contentTitle],
  );

  const body = (
    <CommentsPanelBody pageId={pageId} open={open} onCountChange={setCount} />
  );

  return (
    <CommentsPanelContext.Provider value={value}>
      {children}

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen} position="bottom">
          <DrawerPopup showBar showCloseButton className="max-h-[88vh]">
            <DrawerHeader className="pt-8">
              <DrawerTitle className="text-lg">Discussion</DrawerTitle>
              <DrawerDescription>
                Comments on “{contentTitle}”
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>{body}</DrawerPanel>
          </DrawerPopup>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetPopup side="right" className="max-w-lg">
            <SheetHeader className="pe-12">
              <SheetTitle className="text-lg">Discussion</SheetTitle>
              <SheetDescription>Comments on “{contentTitle}”</SheetDescription>
            </SheetHeader>
            <SheetPanel>{body}</SheetPanel>
          </SheetPopup>
        </Sheet>
      )}
    </CommentsPanelContext.Provider>
  );
}

type CommentsTriggerProps = {
  children?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** Append the comment count once it is known. */
  showCount?: boolean;
};

/** A button that opens the comments overlay from anywhere under the provider. */
export function CommentsTrigger({
  children = "Comments",
  variant = "outline",
  size = "default",
  className,
  showCount = true,
}: CommentsTriggerProps) {
  const { openPanel, count } = useCommentsPanel();
  const label =
    showCount && count !== null ? `${children} (${count})` : children;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={openPanel}
    >
      <MessageSquare aria-hidden="true" />
      {label}
    </Button>
  );
}

/** The end-of-article "Join the discussion" block. */
export function CommentsInlineCta() {
  const { openPanel, count } = useCommentsPanel();

  return (
    <section
      id="comments"
      className="mt-10 flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/25 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-card text-foreground">
          <MessageSquare className="size-4" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Join the discussion</h2>
          <p className="text-xs text-muted-foreground">
            No account needed — a name and an email are enough.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={openPanel}>
        <MessageSquare aria-hidden="true" />
        {count === null ? "Comments" : `Comments (${count})`}
      </Button>
    </section>
  );
}

type CommentsPanelProps = {
  pageId: string;
  contentTitle: string;
};

/**
 * Self-contained variant: provider + the inline call to action.
 * Use this when nothing else on the page needs to open the panel.
 */
export function CommentsPanel({ pageId, contentTitle }: CommentsPanelProps) {
  return (
    <CommentsProvider pageId={pageId} contentTitle={contentTitle}>
      <CommentsInlineCta />
    </CommentsProvider>
  );
}
