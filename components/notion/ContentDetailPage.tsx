import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NotionBlocks } from "@/components/notion/NotionBlocks";
import { ReaderExperience } from "@/components/notion/ReaderExperience";
import { ContentOutline } from "@/components/notion/ContentOutline";
import { RelatedContent } from "@/components/notion/RelatedContent";
import {
  CommentsInlineCta,
  CommentsProvider,
} from "@/components/comments/comments-panel";
import { ContentDetailHeader } from "@/components/notion/ContentDetailHeader";
import {
  CONTENT_META,
  estimateReadingTime,
  formatContentDate,
  getContentDetail,
  getContentHeadings,
  type ContentItem,
  type ContentType,
} from "@/lib/notion-cms";
import { SITE_URL } from "@/lib/content-metadata";

function SetupState({}: { type: ContentType }) {
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

function JsonLd({ type, item }: { type: ContentType; item: ContentItem }) {
  const route = `${SITE_URL}/${type}/${encodeURIComponent(item.slug)}`;
  const schemaType =
    type === "projects"
      ? "CreativeWork"
      : type === "glossary"
        ? "DefinedTerm"
        : "TechArticle";
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: item.title,
    name: item.title,
    description: item.description || undefined,
    url: route,
    datePublished: item.date || undefined,
    dateModified: item.date || undefined,
    image: item.image ? new URL(item.image, SITE_URL).toString() : undefined,
    author: item.author
      ? {
          "@type": "Person",
          name: item.author.name,
        }
      : undefined,
    keywords:
      [...item.categories, ...item.tags, ...item.technical].join(", ") ||
      undefined,
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: CONTENT_META[type].label,
      url: `${SITE_URL}/${type}`,
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: CONTENT_META[type].label,
        item: `${SITE_URL}/${type}`,
      },
      { "@type": "ListItem", position: 3, name: item.title, item: route },
    ],
  };
  const safeJson = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumb) }}
      />
    </>
  );
}

export async function ContentDetailPage({
  type,
  slug,
}: {
  type: ContentType;
  slug: string;
}) {
  const result = await getContentDetail(type, slug);
  const meta = CONTENT_META[type];

  if (result.configured && !result.error && !result.item) notFound();

  if (!result.configured || (result.error && !result.item)) {
    return (
      <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 md:px-12 md:pt-12">
        <Link
          href={`/${type}`}
          className="inline-flex items-center gap-2 rounded-md py-2 text-sm text-ink-soft transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to {meta.label.toLowerCase()}
        </Link>
        {!result.configured ? (
          <SetupState type={type} />
        ) : (
          <section
            className="mt-8 rounded-xl border border-border bg-card p-6"
            role="status"
          >
            <h1 className="font-display text-2xl font-semibold text-ink">
              Content is temporarily unavailable
            </h1>
          </section>
        )}
      </main>
    );
  }

  const item = result.item;
  if (!item) notFound();
  const headings = getContentHeadings(result.blocks);
  const readingTime = item.readTime || estimateReadingTime(result.blocks);
  const formattedDate = formatContentDate(item.date);
  const topicList = [
    ...new Set([...item.categories, ...item.tags, ...item.technical]),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 md:px-12 md:pt-10">
      <JsonLd type={type} item={item} />
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-ink-soft"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/${type}`}
          className="transition-colors hover:text-primary"
        >
          {meta.label}
        </Link>
        <span aria-hidden="true">/</span>
        <span
          className="max-w-[min(50vw,28rem)] truncate text-ink"
          aria-current="page"
        >
          {item.title}
        </span>
      </nav>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10 xl:gap-12">
        <CommentsProvider pageId={item.id} contentTitle={item.title}>
          <article className="min-w-0">
            <ContentDetailHeader
              item={item}
              type={type}
              typeSingular={meta.singular}
              readingTime={readingTime}
              formattedDate={formattedDate}
              topics={topicList}
            />

            {item.image ? (
              <figure className="relative mt-6 aspect-16/8 overflow-hidden rounded-xl border border-border bg-muted/40">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 900px"
                  unoptimized
                  priority
                  className="object-cover"
                />
              </figure>
            ) : null}

            {result.error ? (
              <div
                className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-ink-soft"
                role="status"
              >
                The page details loaded, but some Notion blocks could not be
                retrieved.
              </div>
            ) : null}
            {result.blocks.length ? (
              <ReaderExperience>
                <NotionBlocks blocks={result.blocks} />
              </ReaderExperience>
            ) : !result.error ? (
              <p className="mt-8 text-sm leading-6 text-ink-soft">
                This entry does not have body content yet.
              </p>
            ) : null}

            <RelatedContent type={type} current={item} />

            <CommentsInlineCta />
          </article>
        </CommentsProvider>

        <ContentOutline
          headings={headings}
          author={item.author}
          published={formattedDate}
        />
      </div>
    </main>
  );
}
