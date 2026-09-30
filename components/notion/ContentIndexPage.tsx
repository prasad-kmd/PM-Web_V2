import Link from "next/link";
import { ArrowLeft, ArrowRight, LayoutGrid, List } from "lucide-react";
import { ContentCards } from "@/components/notion/ContentCards";
import { CollectionSearch } from "@/components/notion/CollectionSearch";
import { CollectionSort } from "@/components/notion/CollectionSort";
import {
  CONTENT_META,
  getContentIndex,
  type ContentType,
} from "@/lib/notion-cms";
import {
  INITIALS,
  listingHref,
  parseListingOptions,
  selectListing,
  type ListingOptions,
  type ListingSearchParams,
} from "@/lib/content-listing";
import styles from "@/components/notion/content-listing.module.css";

function SourceMessage({ type }: { type: ContentType }) {
  return (
    <section
      className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8"
      role="status"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
        Page isn't ready to serve. Coma back later.
      </p>
    </section>
  );
}

export async function ContentIndexPage({
  type,
  searchParams = {},
}: {
  type: ContentType;
  searchParams?: ListingSearchParams;
}) {
  const result = await getContentIndex(type);
  const options = parseListingOptions(type, searchParams);
  const listing = selectListing(result.items, options);
  const current = { ...options, page: listing.page };
  const meta = CONTENT_META[type];
  const ready = result.configured && !result.error;
  const href = (patch: Partial<ListingOptions>) =>
    listingHref(type, current, patch);
  const clearHref = href({ q: "", category: "", letter: "", page: 1 });
  const filtered = Boolean(options.q || options.category || options.letter);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{meta.eyebrow}</p>
          <div className={styles.headingRow}>
            <h1>{meta.label}</h1>
            {ready ? (
              <span>
                {result.items.length}{" "}
                {result.items.length === 1 ? "entry" : "entries"}
              </span>
            ) : null}
          </div>
          <p className={styles.intro}>{meta.description}</p>
        </div>
        <CollectionSearch type={type} label={meta.label} options={current} />
      </header>
      {ready ? (
        <>
          <div className={styles.toolbar}>
            <nav className={styles.filters} aria-label="Filter by category">
              <Link
                className={styles.chip}
                href={href({ category: "", letter: "", page: 1 })}
                aria-current={!options.category ? "true" : undefined}
              >
                All <span>{listing.searchCount}</span>
              </Link>
              {listing.categories.map(([category, count]) => (
                <Link
                  key={category}
                  className={styles.chip}
                  href={href({ category, letter: "", page: 1 })}
                  aria-current={
                    options.category === category ? "true" : undefined
                  }
                >
                  {category}
                  <span>{count}</span>
                </Link>
              ))}
            </nav>
            <CollectionSort type={type} options={current} />
            <nav className={styles.viewToggle} aria-label="Card view">
              <Link
                href={href({ view: "grid" })}
                scroll={false}
                aria-current={options.view === "grid" ? "true" : undefined}
              >
                <LayoutGrid aria-hidden="true" />
                Grid
              </Link>
              <Link
                href={href({ view: "list" })}
                scroll={false}
                aria-current={options.view === "list" ? "true" : undefined}
              >
                <List aria-hidden="true" />
                List
              </Link>
            </nav>
          </div>
          {type === "glossary" ? (
            <nav
              className={styles.alphabet}
              aria-label="Filter terms by initial"
            >
              <Link
                href={href({ letter: "", page: 1 })}
                aria-current={!options.letter ? "true" : undefined}
              >
                All
              </Link>
              {INITIALS.map((letter) =>
                listing.initials.has(letter) || options.letter === letter ? (
                  <Link
                    key={letter}
                    href={href({ letter, page: 1 })}
                    aria-current={
                      options.letter === letter ? "true" : undefined
                    }
                    aria-label={
                      letter === "#"
                        ? "Other initials"
                        : `Terms starting with ${letter}`
                    }
                  >
                    {letter}
                  </Link>
                ) : (
                  <span key={letter} aria-disabled="true">
                    {letter}
                  </span>
                ),
              )}
            </nav>
          ) : null}
          <div className={styles.results}>
            <p role="status">
              {listing.total
                ? `${listing.offset + 1}–${listing.offset + listing.items.length} of ${listing.total} entries`
                : "0 entries"}
              {options.q ? ` matching “${options.q}”` : ""}
              {options.category ? ` · ${options.category}` : ""}
            </p>
            {filtered ? <Link href={clearHref}>Clear filters</Link> : null}
          </div>
          {listing.items.length ? (
            <section aria-label={`${meta.label} ${options.view}`}>
              <ContentCards
                items={listing.items}
                view={options.view}
                offset={listing.offset}
              />
            </section>
          ) : (
            <section className={styles.empty} role="status">
              <h2>
                {filtered ? "No matching entries" : "No published entries yet"}
              </h2>
              <p>
                {filtered
                  ? "Try a different search or clear the filters."
                  : "Published entries will appear here when available."}
              </p>
              {filtered ? <Link href={clearHref}>Clear filters</Link> : null}
            </section>
          )}
          {listing.pageCount > 1 ? (
            <nav className={styles.pagination} aria-label="Collection pages">
              {listing.page > 1 ? (
                <Link href={href({ page: listing.page - 1 })}>
                  <ArrowLeft aria-hidden="true" />
                  Previous
                </Link>
              ) : (
                <span aria-disabled="true">Previous</span>
              )}
              <span>
                Page {listing.page} of {listing.pageCount}
              </span>
              {listing.page < listing.pageCount ? (
                <Link href={href({ page: listing.page + 1 })}>
                  Next
                  <ArrowRight aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true">Next</span>
              )}
            </nav>
          ) : null}
        </>
      ) : null}
      {!result.configured ? <SourceMessage type={type} /> : null}
      {result.configured && result.error ? (
        <section className={styles.empty} role="status">
          <h2>Content is temporarily unavailable</h2>
          <p>
            The Notion source could not be loaded. Check database sharing,
            integration permissions and server environment values.
          </p>
          <Link href={`/${type}`}>Try again</Link>
        </section>
      ) : null}
    </main>
  );
}
