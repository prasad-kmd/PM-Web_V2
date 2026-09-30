"use client";

import { Bookmark } from "lucide-react";
import type { ContentItem } from "@/lib/notion-cms";
import { useContentBookmarks } from "@/components/notion/ContentBookmarksProvider";

export function BookmarkToggle({ item }: { item: Pick<ContentItem, "type" | "slug" | "title" | "date" | "description" | "image"> }) {
  const { ready, isBookmarked, toggleBookmark } = useContentBookmarks();
  const saved = isBookmarked(item.type, item.slug);
  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={saved}
      onClick={() => toggleBookmark({
        type: item.type,
        slug: item.slug,
        title: item.title,
        date: item.date,
        description: item.description,
        image: item.image,
      })}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Bookmark aria-hidden="true" className={`size-4 ${saved ? "fill-current text-primary" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
