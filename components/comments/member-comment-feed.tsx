"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, RefreshCw, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CommentAvatar } from "./comment-avatar";

type MemberComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatar: string | null };
  isOwner: boolean;
};

type MemberCommentFeedProps = {
  pageId: string;
  /** Fetch only after the comments panel has been opened. */
  active: boolean;
  onCountChange?: (count: number) => void;
};

type FeedResponse = {
  results: MemberComment[];
  totalCount: number;
  viewerSignedIn: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  error?: string;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, divisor] of units) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(-Math.round(seconds / divisor), unit);
    }
  }
  return "just now";
}

function MemberCommentItem({
  comment,
  onDelete,
}: {
  comment: MemberComment;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    await onDelete(comment.id);
    setDeleting(false);
    setConfirming(false);
  }

  return (
    <li className="flex gap-3">
      <CommentAvatar
        name={comment.author.name}
        src={comment.author.avatar}
        size={36}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">
            {comment.author.name}
          </span>
          <span className="rounded border border-border/70 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Member
          </span>
          {comment.isOwner ? (
            <span className="text-[10px] font-medium text-primary">You</span>
          ) : null}
          <time
            dateTime={comment.createdAt}
            className="text-xs text-muted-foreground"
          >
            {relativeTime(comment.createdAt)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft">
          {comment.content}
        </p>

        {comment.isOwner ? (
          <div className="mt-2 flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-xs text-muted-foreground">
                  Delete this comment?
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  disabled={deleting}
                  onClick={() => void confirmDelete()}
                >
                  {deleting ? <Spinner className="size-3" /> : <Trash2 />}
                  Delete
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={deleting}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setConfirming(true)}
              >
                <Trash2 /> Delete
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function MemberCommentFeed({
  pageId,
  active,
  onCountChange,
}: MemberCommentFeedProps) {
  const pathname = usePathname();
  const [comments, setComments] = useState<MemberComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(
    async (nextCursor?: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ pageId });
        if (nextCursor) params.set("cursor", nextCursor);
        const response = await fetch(`/api/member-comments?${params}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as FeedResponse;
        if (!response.ok)
          throw new Error(data.error ?? "Could not load comments.");
        setComments((previous) =>
          nextCursor ? [...previous, ...data.results] : data.results,
        );
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
        setSignedIn(data.viewerSignedIn);
        onCountChange?.(data.totalCount);
        setLoaded(true);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load comments.",
        );
        setLoaded(true);
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [onCountChange, pageId],
  );

  useEffect(() => {
    if (active && !loaded && !inFlight.current) void load();
  }, [active, load, loaded]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const response = await fetch(
          `/api/member-comments?id=${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        const data = (await response.json()) as { error?: string };
        if (!response.ok)
          throw new Error(data.error ?? "Could not delete comment.");
        setComments((previous) =>
          previous.filter((comment) => comment.id !== id),
        );
        const nextCount = Math.max(0, totalCount - 1);
        setTotalCount(nextCount);
        onCountChange?.(nextCount);
        toast.success("Your comment was deleted.");
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : "Could not delete comment.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [onCountChange, totalCount],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 3 || trimmed.length > 1000 || posting) return;

    setPosting(true);
    try {
      const response = await fetch("/api/member-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, content: trimmed }),
      });
      const data = (await response.json()) as {
        comment?: MemberComment;
        error?: string;
      };
      if (!response.ok || !data.comment) {
        throw new Error(data.error ?? "Could not post comment.");
      }
      setComments((previous) => [
        data.comment!,
        ...previous.filter((item) => item.id !== data.comment!.id),
      ]);
      const nextCount = totalCount + 1;
      setTotalCount(nextCount);
      onCountChange?.(nextCount);
      setContent("");
      toast.success("Member comment posted.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not post comment.",
      );
    } finally {
      setPosting(false);
    }
  }

  const signInHref = `/sign-in?returnTo=${encodeURIComponent(pathname || "/")}`;

  return (
    <div className="grid gap-5">
      {signedIn ? (
        <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Signed-in members
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            Add a member comment
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Member comments are stored separately from the public guest
            discussion. You can delete your own comments at any time.
          </p>
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <label htmlFor="member-comment-body" className="sr-only">
              Your member comment
            </label>
            <textarea
              id="member-comment-body"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Share a question, correction, or field note…"
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              disabled={posting}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className="text-xs text-muted-foreground"
                aria-live="polite"
              >
                {content.length} / 1,000
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={posting || content.trim().length < 3}
              >
                {posting ? <Spinner className="size-4" /> : <Send />}
                {posting ? "Posting…" : "Post member comment"}
              </Button>
            </div>
          </form>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Be constructive and respectful. Comments are checked for
            inappropriate language and limited to reduce spam.
          </p>
        </section>
      ) : loaded && !error ? (
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
          <p className="text-sm font-semibold text-foreground">
            Want to post as a member?
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sign in with GitHub to attach your comment to your member profile.
            Guest comments remain available in their separate feed.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href={signInHref}>Sign in with GitHub</Link>
          </Button>
        </div>
      ) : !loaded ? (
        <p
          className="rounded-xl border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground"
          aria-live="polite"
        >
          Checking member access…
        </p>
      ) : null}

      {!loaded && loading ? (
        <div
          className="grid gap-4"
          aria-busy="true"
          aria-label="Loading member comments"
        >
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex gap-3">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      ) : error && comments.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void load()}
          >
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
          <MessageSquare
            className="size-6 text-muted-foreground/60"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No member comments yet. Start the signed-in discussion.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <ul className="grid gap-5">
            {comments.map((comment) => (
              <MemberCommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleDelete}
              />
            ))}
          </ul>
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={loading}
                onClick={() => cursor && void load(cursor)}
              >
                {loading ? <Spinner className="size-4" /> : null}
                Load older member comments
              </Button>
            </div>
          ) : null}
          {error ? (
            <p role="status" className="text-center text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {deletingId ? (
        <span className="sr-only" role="status">
          Deleting comment…
        </span>
      ) : null}
    </div>
  );
}
