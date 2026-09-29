"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HookSidebar,
  type HookSidebarItem,
} from "@/components/ui/hook-sidebar";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import type { AuthorSummary, ContentHeading } from "@/lib/notion-cms";

function socialUrl(value: string, platform: "github" | "x" | "linkedin") {
  const domain =
    platform === "github"
      ? "github.com"
      : platform === "x"
        ? "x.com"
        : "linkedin.com";
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol === "https:" &&
      (parsed.hostname === domain ||
        parsed.hostname === `www.${domain}` ||
        (platform === "x" && parsed.hostname === "twitter.com"))
    )
      return parsed.toString();
  } catch {
    // Author properties usually store a handle rather than a full URL.
  }
  const handle = value.replace(/^@/, "").replace(/^\/+/, "");
  const path =
    platform === "linkedin" && !handle.startsWith("in/")
      ? `in/${handle}`
      : handle;
  return `https://${domain}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Thin progress bar pinned to the top of the reading column (desktop only). */
function DesktopReadingProgress() {
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          scrollable > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollable))
            : 0;
        progressRef.current?.style.setProperty(
          "transform",
          `scaleX(${progress})`,
        );
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden h-0.5 bg-border/50 lg:block"
      aria-hidden="true"
    >
      <div
        ref={progressRef}
        className="h-full origin-left scale-x-0 bg-primary transition-transform duration-100 motion-reduce:transition-none"
      />
    </div>
  );
}

export function ContentOutline({
  headings,
  author,
  published,
}: {
  headings: ContentHeading[];
  author: AuthorSummary | null;
  published: string | null;
}) {
  const [activeId, setActiveId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const shallowest = headings.length
    ? Math.min(...headings.map((heading) => heading.level))
    : 0;

  const mobileSections = useMemo(
    () =>
      headings
        .filter((heading) => heading.level === shallowest)
        .map(({ id, text }) => ({ id, label: text })),
    [headings, shallowest],
  );

  const sidebarItems = useMemo<HookSidebarItem[]>(
    () =>
      headings.map((heading) => ({
        label: heading.text,
        depth: Math.max(0, Math.min(heading.level - shallowest, 2)),
      })),
    [headings, shallowest],
  );

  const activeIndex = headings.findIndex((heading) => heading.id === activeId);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (active) setActiveId(active.target.id);
      },
      { rootMargin: "0% 0% -80% 0%", threshold: 0 },
    );
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  // Keep the active row visible inside the sidebar's own scroller without
  // scrolling the page itself.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const row = container.querySelector<HTMLElement>(
      '[data-slot="hook-sidebar-item"][data-active="true"]',
    );
    if (!row) return;

    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? ("auto" as const)
      : ("smooth" as const);

    if (rowTop < viewTop) {
      container.scrollTo({ top: Math.max(0, rowTop - 8), behavior });
    } else if (rowBottom > viewBottom) {
      container.scrollTo({
        top: rowBottom - container.clientHeight + 8,
        behavior,
      });
    }
  }, [activeId]);

  const selectHeading = (heading: ContentHeading) => {
    setActiveId(heading.id);
    document.getElementById(heading.id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const selectHeadingAt = (index: number) => {
    const heading = headings[index];
    if (heading) selectHeading(heading);
  };

  return (
    <>
      <DesktopReadingProgress />
      {author || published || headings.length ? (
        <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] min-h-0 self-start overflow-hidden lg:block">
          <div className="flex h-full min-h-0 flex-col gap-6">
            {author ? (
              <section className="shrink-0 border-b border-border pb-5">
                <p className="font-mono text-[10px] tracking-[0.16em] text-ink-soft uppercase">
                  Written by
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {author.avatar ? (
                      <Image
                        src={author.avatar}
                        alt=""
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-full items-center justify-center font-sans text-base font-semibold text-primary"
                      >
                        {author.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {author.name}
                    </p>
                    {author.role ? (
                      <p className="truncate text-xs text-ink-soft">
                        {author.role}
                      </p>
                    ) : null}
                  </div>
                </div>
                {author.biography ? (
                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-ink-soft">
                    {author.biography}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-primary">
                  {author.github ? (
                    <a
                      href={socialUrl(author.github, "github")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      GitHub
                    </a>
                  ) : null}
                  {author.twitter ? (
                    <a
                      href={socialUrl(author.twitter, "x")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      X
                    </a>
                  ) : null}
                  {author.linkedin ? (
                    <a
                      href={socialUrl(author.linkedin, "linkedin")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                </div>
                {published ? (
                  <p className="mt-3 text-[10px] text-ink-soft">
                    Published {published}
                  </p>
                ) : null}
              </section>
            ) : published ? (
              <p className="shrink-0 border-b border-border pb-4 text-[10px] text-ink-soft">
                Published {published}
              </p>
            ) : null}

            {headings.length ? (
              <section
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                aria-labelledby="content-toc-heading"
              >
                <div className="mb-3 flex shrink-0 items-center gap-2 px-1">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-primary"
                  />
                  <h2
                    id="content-toc-heading"
                    className="font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-soft uppercase"
                  >
                    Table of contents
                  </h2>
                </div>
                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 pb-4"
                >
                  <HookSidebar
                    aria-label="Table of contents"
                    items={sidebarItems}
                    value={activeIndex}
                    onChange={selectHeadingAt}
                    color="var(--pm-accent)"
                  />
                </div>
              </section>
            ) : null}
          </div>
        </aside>
      ) : null}
      {mobileSections.length ? (
        <ScrollProgress
          sections={mobileSections}
          className="bottom-[calc(env(safe-area-inset-bottom)_+_5.5rem)] z-30 lg:hidden"
        />
      ) : null}
    </>
  );
}
