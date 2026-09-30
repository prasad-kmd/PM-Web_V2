"use client";

import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
 * One trigger, two presentations:
 *   - desktop (≥768px) → coss `Sheet`, sliding in from the right
 *   - mobile  (<768px) → coss `Drawer`, sliding up from the bottom
 *
 * Both render the same `CommentsPanelBody`, so behaviour and state are
 * identical; only the container differs. The panel is mounted on every
 * `articles|blog|tutorials|projects|glossary/[slug]` page through
 * `components/notion/ContentDetailPage.tsx`.
 */

type CommentsPanelProps = {
  /** Notion page id the comments are attached to. */
  pageId: string;
  /** Human-readable title used in the overlay header. */
  contentTitle: string;
};

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

export function CommentsPanel({ pageId, contentTitle }: CommentsPanelProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const trigger = (
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
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <MessageSquare />
        {count === null ? "Comments" : `Comments (${count})`}
      </Button>
    </section>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen} position="bottom">
          <DrawerPopup showBar showCloseButton className="max-h-[88vh]">
            <DrawerHeader className="pt-8">
              <DrawerTitle className="text-lg">Discussion</DrawerTitle>
              <DrawerDescription>
                Comments on “{contentTitle}”
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>
              <CommentsPanelBody
                pageId={pageId}
                open={open}
                onCountChange={setCount}
              />
            </DrawerPanel>
          </DrawerPopup>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetPopup side="right" className="max-w-lg">
          <SheetHeader className="pe-12">
            <SheetTitle className="text-lg">Discussion</SheetTitle>
            <SheetDescription>Comments on “{contentTitle}”</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <CommentsPanelBody
              pageId={pageId}
              open={open}
              onCountChange={setCount}
            />
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </>
  );
}
