"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, CalendarDays, Trash2 } from "lucide-react";
import { useContentBookmarks } from "@/components/notion/ContentBookmarksProvider";
import { CONTENT_META, formatContentDate } from "@/lib/notion-cms";

export function SavedItemsPage() {
  const { bookmarks, ready, removeBookmark } = useContentBookmarks();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 md:px-12 md:pt-14">
      <header className="max-w-3xl border-b border-border pb-8 md:pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Your reading shelf</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink md:text-6xl">Saved items</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft md:text-base">A private list stored in this browser. It stays on this device and syncs across tabs.</p>
      </header>

      {!ready ? <div className="mt-8 h-24 animate-pulse rounded-xl bg-muted" aria-label="Loading saved items" /> : null}
      {ready && bookmarks.length === 0 ? (
        <section className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center" role="status">
          <Bookmark aria-hidden="true" className="size-7 text-primary/70" />
          <h2 className="mt-4 font-display text-xl font-medium text-ink">Nothing saved yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">Use “Save for later” on any project, article, post, tutorial, or glossary entry to keep it here.</p>
        </section>
      ) : null}

      {ready && bookmarks.length > 0 ? (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {bookmarks.map((item, index) => (
            <li key={`${item.type}:${item.slug}`} className="grid gap-4 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
              <span className="font-mono text-xs tabular-nums text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 items-center gap-4">
                {item.image ? (
                  <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:block">
                    <Image src={item.image} alt="" fill sizes="64px" unoptimized className="object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">{CONTENT_META[item.type].label}</p>
                  <Link href={`/${item.type}/${item.slug}`} className="mt-1 block truncate font-display text-lg font-medium text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                    {formatContentDate(item.date) ? <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-3.5" />{formatContentDate(item.date)}</span> : null}
                    {item.description ? <span className="line-clamp-1">{item.description}</span> : null}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => removeBookmark(item.type, item.slug)} aria-label={`Remove ${item.title} from saved items`} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:justify-self-end">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
