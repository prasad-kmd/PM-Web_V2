import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CONTENT_META, getContentIndex, type ContentItem, type ContentType } from "@/lib/notion-cms";

function overlap(a: string[], b: string[]) {
  const right = new Set(b.map((value) => value.toLocaleLowerCase()));
  return a.reduce((score, value) => score + Number(right.has(value.toLocaleLowerCase())), 0);
}

export async function RelatedContent({ type, current }: { type: ContentType; current: ContentItem }) {
  const { items } = await getContentIndex(type);
  const related = items
    .filter((item) => item.slug !== current.slug)
    .map((item) => ({
      item,
      score: overlap(current.tags, item.tags) * 2 + overlap(current.categories, item.categories),
    }))
    .sort((a, b) => b.score - a.score || Date.parse(b.item.date || "") - Date.parse(a.item.date || ""))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8" aria-labelledby="related-content-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Keep exploring</p>
          <h2 id="related-content-heading" className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">More {CONTENT_META[type].label.toLowerCase()}</h2>
        </div>
        <Link href={`/${type}`} className="text-xs font-medium text-primary hover:underline">Browse all</Link>
      </div>
      <div className="mt-5 divide-y divide-border border-y border-border">
        {related.map(({ item }, index) => (
          <article key={item.id} className="group grid gap-4 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_8rem] sm:items-center">
            <span className="font-mono text-xs tabular-nums text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">{item.categories[0] || CONTENT_META[type].singular}</p>
              <Link href={`/${type}/${item.slug}`} className="mt-1 block font-display text-lg font-medium leading-snug text-ink transition-colors group-hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.title}</Link>
              {item.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-soft">{item.description}</p> : null}
            </div>
            {item.image ? <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted sm:block"><Image src={item.image} alt="" fill sizes="128px" unoptimized className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div> : <span aria-hidden="true" className="hidden justify-self-end text-primary sm:inline-flex"><ArrowUpRight className="size-4" /></span>}
          </article>
        ))}
      </div>
    </section>
  );
}
