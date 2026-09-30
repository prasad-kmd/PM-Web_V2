"use client";

import Image from "next/image";
import {
  CalendarDays,
  Check,
  Clock3,
  Layers,
  Link2,
  PenLine,
  Share2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { BookmarkToggle } from "@/components/notion/BookmarkToggle";
import { CommentsTrigger } from "@/components/comments/comments-panel";
import { AiAssistedDialog } from "@/components/notion/AiAssistedDialog";
import { Button } from "@/components/ui/button";
import type { ContentItem, ContentType } from "@/lib/notion-cms";

/**
 * Article header.
 *
 * Client component: it renders the AI-assistance disclosure dialog, the
 * bookmark toggle and the comments trigger, all of which need interactivity.
 * Replaces the inline <header> that used to live in ContentDetailPage.tsx.
 */

type ContentDetailHeaderProps = {
  item: ContentItem;
  type: ContentType;
  /** Human label for the content type, e.g. "Article". */
  typeSingular: string;
  readingTime: number;
  formattedDate: string | null;
  topics: string[];
};

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card text-ink-soft"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="font-mono text-[10px] tracking-[0.14em] text-ink-soft/80 uppercase">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-ink">
          {children}
        </dd>
      </div>
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context; fall back for http/insecure frames.
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    toast.success("Link copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy}>
      {copied ? (
        <Check aria-hidden="true" className="text-primary" />
      ) : (
        <Share2 aria-hidden="true" />
      )}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

export function ContentDetailHeader({
  item,
  type,
  typeSingular,
  readingTime,
  formattedDate,
  topics,
}: ContentDetailHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card/70">
      {/* Accent wash — decorative, sits behind the content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60rem_18rem_at_18%_-12%,color-mix(in_srgb,var(--color-primary)_13%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/45 to-transparent"
      />

      <div className="relative p-5 md:p-8">
        {/* Eyebrow row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            {typeSingular}
          </span>

          {item.categories.map((category) => (
            <span
              key={category}
              className="rounded-md border border-border bg-card/80 px-2.5 py-1 text-[10px] text-ink-soft"
            >
              {category}
            </span>
          ))}

          {item.aiAssisted ? (
            <AiAssistedDialog contentTitle={item.title} />
          ) : null}
        </div>

        <h1 className="mt-5 max-w-5xl font-sans text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-ink">
          {item.title}
        </h1>

        {item.description ? (
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-soft md:text-lg">
            {item.description}
          </p>
        ) : null}

        {/* Meta strip */}
        <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-border py-5 lg:grid-cols-4">
          {formattedDate ? (
            <MetaItem
              icon={<CalendarDays className="size-3.5" />}
              label="Published"
            >
              <time dateTime={item.date ?? undefined}>{formattedDate}</time>
            </MetaItem>
          ) : null}

          <MetaItem icon={<Clock3 className="size-3.5" />} label="Reading time">
            {readingTime} min
          </MetaItem>

          {item.author?.name ? (
            <MetaItem
              icon={<PenLine className="size-3.5" />}
              label="Written by"
            >
              <span className="flex items-center gap-2">
                {item.author.avatar ? (
                  <span className="relative size-5 shrink-0 overflow-hidden rounded border border-border bg-muted">
                    <Image
                      src={item.author.avatar}
                      alt=""
                      fill
                      sizes="20px"
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <span className="truncate">{item.author.name}</span>
              </span>
            </MetaItem>
          ) : null}

          {topics.length ? (
            <MetaItem icon={<Layers className="size-3.5" />} label="Topics">
              {topics.length} covered
            </MetaItem>
          ) : null}
        </dl>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <CommentsTrigger>Comments</CommentsTrigger>
          <BookmarkToggle item={item} />
          <CopyLinkButton />
          <span className="hidden text-[11px] text-ink-soft/70 sm:inline">
            <Link2
              aria-hidden="true"
              className="me-1 inline size-3 align-[-2px]"
            />
            {type}/{item.slug}
          </span>
        </div>

        {topics.length ? (
          <ul
            className="mt-5 flex flex-wrap gap-1.5"
            aria-label="Topics covered"
          >
            {topics.map((topic) => (
              <li
                key={topic}
                className="rounded-md bg-muted px-2.5 py-1 text-[10px] font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {topic}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </header>
  );
}
