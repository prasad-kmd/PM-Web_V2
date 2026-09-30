"use client";

import { MessageSquare, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { NotionComment } from "@/lib/comments/types";
import { CommentItem } from "./comment-item";

/**
 * Comment feed for one Notion page.
 *
 * Fetches on mount (and whenever the panel is re-opened) and appends pages as
 * the reader scrolls. Comments posted in this session are prepended locally so
 * they appear instantly instead of waiting for the next fetch.
 */

type CommentListProps = {
  pageId: string;
  /** True while the enclosing sheet/drawer is open — gates fetching. */
  active: boolean;
  /** Comments created in this session, prepended and de-duplicated. */
  pending?: NotionComment[];
  onCountChange?: (count: number) => void;
};

type ListResponse = {
  results: NotionComment[];
  next_cursor: string | null;
  has_more: boolean;
};

export function CommentList({
  pageId,
  active,
  pending = [],
  onCountChange,
}: CommentListProps) {
  const [comments, setComments] = useState<NotionComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const inFlight = useRef(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (nextCursor?: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ pageId });
        if (nextCursor) params.set("cursor", nextCursor);

        const response = await fetch(`/api/comments?${params}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as ListResponse & {
          error?: string;
        };

        if (!response.ok)
          throw new Error(data.error ?? "Could not load comments");

        setComments((previous) =>
          nextCursor ? [...previous, ...data.results] : data.results,
        );
        setCursor(data.next_cursor);
        setHasMore(data.has_more);
        setLoaded(true);
        if (!nextCursor) onCountChange?.(data.results.length);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load comments",
        );
        setLoaded(true);
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [onCountChange, pageId],
  );

  // First load — deferred until the panel is actually opened.
  useEffect(() => {
    if (active && !loaded && !inFlight.current) void fetchPage();
  }, [active, fetchPage, loaded]);

  // Infinite scroll inside the sheet/drawer scroll container.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !active || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchPage(cursor ?? undefined);
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, cursor, fetchPage, hasMore]);

  const visible = [...pending, ...comments].filter(
    (comment, index, all) =>
      all.findIndex((c) => c.id === comment.id) === index,
  );

  if (loading && !loaded) {
    return (
      <div className="grid gap-4" aria-busy>
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex gap-3">
            <div className="size-[34px] shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-2 justify-items-center rounded-lg border border-border/60 bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setLoaded(false);
            void fetchPage();
          }}
        >
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="grid gap-2 justify-items-center px-4 py-10 text-center">
        <MessageSquare
          className="size-6 text-muted-foreground/60"
          strokeWidth={1.5}
        />
        <p className="text-sm text-muted-foreground">
          No comments yet — start the discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <ul className="grid gap-5">
        {visible.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </ul>

      {hasMore ? (
        <div ref={sentinel} className="flex justify-center py-2">
          {loading ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              Loading more…
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void fetchPage(cursor ?? undefined)}
            >
              Load older comments
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
