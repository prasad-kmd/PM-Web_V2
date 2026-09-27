"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { List, X } from "lucide-react";
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

function MobileSectionProgress({
  sections,
}: {
  sections: Array<{ id: string; label: string }>;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const threshold = 128;
        let active = sections[0]?.id || "";
        for (const section of sections) {
          const top = document
            .getElementById(section.id)
            ?.getBoundingClientRect().top;
          if (typeof top === "number" && top <= threshold) active = section.id;
          else if (typeof top === "number") break;
        }
        setActiveId((current) => (current === active ? current : active));
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          scrollable > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollable))
            : 0;
        progressRef.current?.style.setProperty(
          "stroke-dashoffset",
          String(62.83 * (1 - progress)),
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
  }, [sections]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeSection =
    sections.find((section) => section.id === activeId) || sections[0];

  const selectSection = (id: string) => {
    setActiveId(id);
    setOpen(false);
    const target = document.getElementById(id);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)_+_5.25rem)] left-1/2 z-40 w-[min(22rem,calc(100vw_-_2rem))] -translate-x-1/2 lg:hidden"
    >
      <section
        id="mobile-section-outline"
        aria-label="Page sections"
        hidden={!open}
        className={`${open ? "block" : "hidden"} mb-2 max-h-[min(55vh,24rem)] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl`}
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <h2 className="text-xs font-semibold text-ink">Page sections</h2>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
            aria-label="Close page sections"
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <ol className="divide-y divide-border/70">
          {sections.map((section, index) => {
            const active = section.id === activeId;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => selectSection(section.id)}
                  aria-current={active ? "location" : undefined}
                  className={`flex min-h-11 w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "bg-primary/10 font-medium text-primary" : "text-ink-soft hover:bg-muted hover:text-ink"}`}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 w-6 shrink-0 font-mono text-[10px] tabular-nums"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">{section.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-section-outline"
        aria-label={
          activeSection
            ? `Page sections. Current section: ${activeSection.label}`
            : "Show page sections"
        }
        onClick={() => setOpen((value) => !value)}
        className="mx-auto flex min-h-11 max-w-full items-center gap-2.5 rounded-full border border-border bg-card/95 px-3 py-2 text-left text-sm font-medium text-ink shadow-lg backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          className="relative inline-flex size-5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="size-5 -rotate-90">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="2.5"
              className="stroke-ink/15"
            />
            <circle
              ref={progressRef}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="62.83"
              strokeDashoffset="62.83"
              className="stroke-primary"
            />
          </svg>
        </span>
        <span className="max-w-[16rem] truncate">
          {activeSection?.label || "Page sections"}
        </span>
        <List aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      </button>
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
  const navRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const activeRow = navRef.current.querySelector<HTMLElement>(
      '[data-toc-active="true"]',
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    activeRow?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
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

  return (
    <>
      <DesktopReadingProgress />
      {author || published || headings.length ? (
        <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] min-h-0 self-start overflow-hidden lg:block">
          <div className="flex h-full min-h-0 flex-col gap-6">
            {author ? (
              <section className="shrink-0 border-b border-border pb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
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
                      className="focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:underline"
                    >
                      GitHub
                    </a>
                  ) : null}
                  {author.twitter ? (
                    <a
                      href={socialUrl(author.twitter, "x")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:underline"
                    >
                      X
                    </a>
                  ) : null}
                  {author.linkedin ? (
                    <a
                      href={socialUrl(author.linkedin, "linkedin")}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:underline"
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
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft"
                  >
                    Table of contents
                  </h2>
                </div>
                <nav
                  ref={navRef}
                  aria-label="Table of contents"
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-2"
                >
                  <ol className="space-y-0.5 border-l border-border">
                    {headings.map((heading) => {
                      const depth = Math.max(
                        0,
                        Math.min(heading.level - shallowest, 3),
                      );
                      return (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            data-toc-active={activeId === heading.id}
                            aria-current={
                              activeId === heading.id ? "location" : undefined
                            }
                            onClick={() => selectHeading(heading)}
                            style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
                            className={`block rounded-r-md py-2 pr-2 text-left leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${depth === 0 ? "text-sm" : depth === 1 ? "text-[13px]" : "text-xs"} ${activeId === heading.id ? "border-l-2 border-primary bg-primary/5 font-medium text-ink" : "border-l-2 border-transparent text-ink-soft hover:bg-muted/70 hover:text-ink"}`}
                          >
                            {heading.text}
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              </section>
            ) : null}
          </div>
        </aside>
      ) : null}
      {mobileSections.length ? (
        <MobileSectionProgress sections={mobileSections} />
      ) : null}
    </>
  );
}
