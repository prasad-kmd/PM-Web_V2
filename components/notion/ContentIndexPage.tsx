import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CONTENT_META,
  formatContentDate,
  getContentIndex,
  getConfiguredContentEnv,
  type ContentItem,
  type ContentType,
} from "@/lib/notion-cms";

const FALLBACK_IMAGES: Record<ContentType, string> = {
  projects: "/img/projects/cnc-lathe.jpg",
  blog: "/img/bg-content.jpg",
  articles: "/img/hero/cad-gearbox.jpg",
  tutorials: "/img/hero/pcb-macro.jpg",
  glossary: "/img/bg-about.jpg",
};
const PAGE_SIZE = 10;

function SourceMessage({ type }: { type: ContentType }) {
  const envNames = getConfiguredContentEnv(type);
  return (
    <section
      className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8"
      role="status"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
        Notion connection needed
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
        Connect this collection
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
        Add the server-side Notion settings below, share this database with your
        integration, then restart or redeploy the site. The setup guide is in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          docs/notion-cms-setup.md
        </code>
        .
      </p>
      <ul
        className="mt-4 flex flex-wrap gap-2"
        aria-label="Required environment variables"
      >
        {envNames.map((name) => (
          <li
            key={name}
            className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-ink-soft"
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ItemMeta({ item, type }: { item: ContentItem; type: ContentType }) {
  const date = formatContentDate(item.date);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
      <span className="text-primary">
        {item.categories[0] || CONTENT_META[type].singular}
      </span>
      {date ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {date}
        </span>
      ) : null}
      {item.readTime ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {item.readTime} min
        </span>
      ) : null}
      {item.aiAssisted ? <span>AI assisted</span> : null}
      {item.author?.name ? (
        <span className="normal-case tracking-normal">
          By {item.author.name}
        </span>
      ) : null}
    </div>
  );
}

function TopicPills({ item }: { item: ContentItem }) {
  const topics = [...new Set([...item.technical, ...item.tags])].slice(0, 3);
  if (!topics.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1" aria-label="Topics">
      {topics.map((topic) => (
        <li
          key={topic}
          className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-soft"
        >
          {topic}
        </li>
      ))}
    </ul>
  );
}

function ArchiveEntry({
  item,
  type,
}: {
  item: ContentItem;
  type: ContentType;
}) {
  return (
    <article className="group min-w-0 border-t border-border">
      <Link
        href={`/${type}/${item.slug}`}
        className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={item.image || FALLBACK_IMAGES[type]}
            alt=""
            fill
            sizes="96px"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>
        <div className="min-w-0 self-center">
          <ItemMeta item={item} type={type} />
          <h2 className="mt-1.5 line-clamp-2 font-sans text-base font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-primary">
            {item.title}
          </h2>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-ink-soft">
              {item.description}
            </p>
          ) : null}
          <TopicPills item={item} />
        </div>
      </Link>
    </article>
  );
}

function GlossaryEntry({ item }: { item: ContentItem }) {
  return (
    <li className="grid gap-3 border-b border-border py-5 last:border-b-0 md:grid-cols-[minmax(12rem,0.35fr)_1fr_auto] md:items-center md:gap-6">
      <Link
        href={`/glossary/${item.slug}`}
        className="font-display text-xl font-semibold tracking-tight text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {item.title}
      </Link>
      <p className="text-sm leading-6 text-ink-soft">
        {item.description ||
          "Open the term to read its full definition and notes."}
      </p>
      <Link
        href={`/glossary/${item.slug}`}
        aria-label={`Read definition of ${item.title}`}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </li>
  );
}

function Pagination({
  type,
  query,
  page,
  pageCount,
}: {
  type: ContentType;
  query: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(target));
    return `/${type}?${params.toString()}`;
  };
  return (
    <nav
      aria-label="Collection pages"
      className="mt-8 flex items-center justify-between border-t border-border pt-5"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-soft transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs tabular-nums text-ink-soft">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-soft transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Next
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export async function ContentIndexPage({
  type,
  query = "",
  page = 1,
}: {
  type: ContentType;
  query?: string;
  page?: number;
}) {
  const result = await getContentIndex(type);
  const meta = CONTENT_META[type];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = result.items.filter((item) => {
    if (!normalizedQuery) return true;
    const searchable = [
      item.title,
      item.description,
      item.author?.name,
      item.author?.role,
      ...item.tags,
      ...item.categories,
      ...item.technical,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(normalizedQuery);
  });
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(page) ? page : 1),
    pageCount,
  );
  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 md:px-12 md:pt-14">
      <header className="border-b border-border pb-7 md:pb-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              {meta.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink md:text-6xl">
              {meta.label}
            </h1>
          </div>
          {result.configured && !result.error ? (
            <p className="pb-1 font-mono text-xs tabular-nums text-ink-soft">
              {filteredItems.length.toString().padStart(2, "0")}{" "}
              {filteredItems.length === 1 ? "entry" : "entries"}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <p className="max-w-2xl text-sm leading-6 text-ink-soft md:text-base">
            {meta.description}
          </p>
          <form
            action={`/${type}`}
            method="get"
            role="search"
            className="relative w-full sm:w-80"
          >
            <label htmlFor={`${type}-search`} className="sr-only">
              Search {meta.label.toLowerCase()}
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            />
            <Input
              id={`${type}-search`}
              name="q"
              type="search"
              defaultValue={query}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="h-10 bg-card pl-9 pr-4"
            />
          </form>
        </div>
      </header>

      {!result.configured ? <SourceMessage type={type} /> : null}
      {result.configured && result.error ? (
        <section
          className="mt-8 rounded-xl border border-border bg-card p-6"
          role="status"
        >
          <h2 className="font-display text-xl font-semibold text-ink">
            Content is temporarily unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            The Notion source could not be loaded. Check database sharing,
            integration permissions, and server environment values.
          </p>
        </section>
      ) : null}
      {result.configured && !result.error && filteredItems.length === 0 ? (
        <section
          className="mt-8 rounded-xl border border-dashed border-border px-6 py-12 text-center"
          role="status"
        >
          <p className="font-display text-xl font-medium text-ink">
            {normalizedQuery
              ? "No matching entries"
              : "No published entries yet"}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {normalizedQuery
              ? `Try a different search for ${meta.label.toLowerCase()}.`
              : "Set a Notion page's Status to Published and it will appear here."}
          </p>
        </section>
      ) : null}

      {type === "glossary" && pageItems.length > 0 ? (
        <section className="mt-7" aria-label="Glossary terms">
          <ul className="border-y border-border">
            {pageItems.map((item) => (
              <GlossaryEntry key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {type !== "glossary" && pageItems.length > 0 ? (
        <section
          className="mt-6 max-w-5xl"
          aria-label={`${meta.label} archive`}
        >
          <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              {normalizedQuery ? "Search results" : "The archive"}
            </h2>
            <span className="font-mono text-[10px] tabular-nums text-ink-soft">
              {pageItems.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {pageItems.map((item) => (
              <ArchiveEntry key={item.id} item={item} type={type} />
            ))}
          </div>
        </section>
      ) : null}

      <Pagination
        type={type}
        query={query}
        page={currentPage}
        pageCount={pageCount}
      />
    </main>
  );
}
