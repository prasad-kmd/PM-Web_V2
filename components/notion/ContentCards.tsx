import Link from "next/link";
import { CalendarDays, Clock3, Cpu, UserRound } from "lucide-react";
import { ContentThumbnail } from "@/components/notion/ContentThumbnail";
import {
  CONTENT_META,
  formatContentDate,
  type ContentItem,
} from "@/lib/notion-cms";
import type { ListingView } from "@/lib/content-listing";
import styles from "@/components/notion/content-listing.module.css";

function Categories({ values }: { values: string[] }) {
  const unique = [...new Set(values)];
  return (
    <div className={styles.categories} aria-label="Categories">
      {unique.length ? (
        unique.slice(0, 2).map((value) => (
          <span key={value} className={styles.category}>
            {value}
          </span>
        ))
      ) : (
        <span className={styles.missing}>Uncategorized</span>
      )}
      {unique.length > 2 ? (
        <span
          className={styles.more}
          aria-label={`More categories: ${unique.slice(2).join(", ")}`}
        >
          +{unique.length - 2}
        </span>
      ) : null}
    </div>
  );
}

function Tags({ values }: { values: string[] }) {
  const tags = [...new Set(values)];
  return (
    <div className={styles.tagsRow}>
      {/* <span className={styles.smallLabel}>Tags</span> */}
      <ul className={styles.tags} aria-label="Tags">
        {tags.slice(0, 3).map((tag) => (
          <li key={tag}>#{tag}</li>
        ))}
        {!tags.length ? <li className={styles.missing}>—</li> : null}
      </ul>
      {tags.length > 3 ? (
        <span
          className={styles.more}
          aria-label={`More tags: ${tags.slice(3).join(", ")}`}
        >
          +{tags.length - 3}
        </span>
      ) : null}
    </div>
  );
}

function Metadata({ item }: { item: ContentItem }) {
  const date = formatContentDate(item.date);
  return (
    <dl className={styles.metadata}>
      <div>
        <dt>Date</dt>
        <dd>
          <CalendarDays aria-hidden="true" />
          {date ? (
            <time dateTime={item.date ?? undefined}>{date}</time>
          ) : (
            <span>—</span>
          )}
        </dd>
      </div>
      <div>
        <dt>Author</dt>
        <dd>
          <UserRound aria-hidden="true" />
          <span>{item.author?.name || "—"}</span>
        </dd>
      </div>
      <div>
        <dt>Reading Time</dt>
        <dd>
          <Clock3 aria-hidden="true" />
          <span>{item.readTime ? `${item.readTime} min read` : "—"}</span>
        </dd>
      </div>
    </dl>
  );
}

/** Spec sheet in grid; Index rail in list. Both expose identical metadata. */
export function ContentCards({
  items,
  view,
  offset,
}: {
  items: ContentItem[];
  view: ListingView;
  offset: number;
}) {
  const grid = view === "grid";
  return (
    <div className={styles.feed} data-view={view}>
      {items.map((item, index) => (
        <article className={styles.card} key={item.id}>
          {!grid ? (
            <div className={styles.rail} aria-hidden="true">
              <span>{String(offset + index + 1).padStart(2, "0")}</span>
              <span>{CONTENT_META[item.type].singular}</span>
            </div>
          ) : null}
          <ContentThumbnail src={item.thumbnail} grid={grid} />
          <div className={styles.cardBody}>
            <div className={styles.cardTop}>
              <Categories values={item.categories} />
              {item.aiAssisted ? (
                <span className={styles.ai}>
                  <Cpu aria-hidden="true" />
                  AI assisted
                </span>
              ) : null}
            </div>
            <h2 className={styles.title}>
              <Link href={`/${item.type}/${item.slug}`}>{item.title}</Link>
            </h2>
            <p className={styles.description}>
              {item.description || (
                <span className={styles.missing}>No summary provided.</span>
              )}
            </p>
            <Tags values={item.tags} />
          </div>
          <Metadata item={item} />
        </article>
      ))}
    </div>
  );
}
