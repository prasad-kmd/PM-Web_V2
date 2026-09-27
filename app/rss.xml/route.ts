import { CONTENT_TYPES, CONTENT_META, getContentIndex } from "@/lib/notion-cms";
import { SITE_URL } from "@/lib/content-metadata";

export const revalidate = 3600;

function escapeXml(value: string) {
  const entities: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  };
  return value.replace(
    /[<>&'"]/g,
    (character) => entities[character] || character,
  );
}

export async function GET() {
  const indexes = await Promise.all(
    CONTENT_TYPES.map((type) => getContentIndex(type)),
  );
  const entries = indexes
    .flatMap((index, i) =>
      index.items.map((item) => ({ ...item, collection: CONTENT_TYPES[i] })),
    )
    .sort(
      (a, b) =>
        (Date.parse(b.date || "") || 0) - (Date.parse(a.date || "") || 0),
    )
    .slice(0, 50);
  const feedUrl = `${SITE_URL}/rss.xml`;
  const lastBuildDate = new Date().toUTCString();
  const xmlItems = entries
    .map((item) => {
      const url = `${SITE_URL}/${item.collection}/${encodeURIComponent(item.slug)}`;
      const categories = [...item.categories, ...item.tags, ...item.technical]
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");
      const published =
        item.date && Number.isFinite(Date.parse(item.date))
          ? `<pubDate>${new Date(item.date).toUTCString()}</pubDate>`
          : "";
      const author = item.author?.name
        ? `<dc:creator>${escapeXml(item.author.name)}</dc:creator>`
        : "";
      const description = escapeXml(
        item.description ||
          `${CONTENT_META[item.collection].singular}: ${item.title}`,
      );
      return `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid>${published}${author}<description>${description}</description>${categories}</item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>PrasadM — Engineering Notes</title><link>${SITE_URL}</link><description>Projects, articles, tutorials, blog posts, and glossary entries.</description><language>en</language><lastBuildDate>${lastBuildDate}</lastBuildDate><atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>${xmlItems}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
