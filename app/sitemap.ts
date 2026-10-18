import type { MetadataRoute } from "next";
import { CONTENT_TYPES, getContentIndex } from "@/lib/notion-cms";
import { SITE_URL } from "@/lib/content-metadata";
import { NON_INDEXABLE_ROUTES } from "@/lib/nav";

export const revalidate = 3600;

/**
 * Keeps private, auth and deliberately-thin routes out of the sitemap.
 *
 * None of them are listed below today — this is the guard against the day one
 * is added "just to see if it shows up". The list lives in `lib/nav.ts` beside
 * the `robots` metadata each page sets for itself, so the two cannot disagree:
 * a page that says `index: false` is a page that is absent from here.
 *
 * `/tools` is the interesting entry — it is excluded because a "coming soon"
 * page is thin content that should not rank, while the pages linking to it
 * still pass signal (`follow: true`).
 */
function isIndexable(url: string): boolean {
  const { pathname } = new URL(url);
  return !NON_INDEXABLE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    ...CONTENT_TYPES.map((type) => ({
      url: `${SITE_URL}/${type}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
  const indexes = await Promise.all(
    CONTENT_TYPES.map((type) => getContentIndex(type)),
  );
  const contentRoutes = indexes.flatMap((index, i) => {
    const type = CONTENT_TYPES[i];
    return index.items.map((item) => {
      const timestamp = item.date ? Date.parse(item.date) : Number.NaN;
      return {
        url: `${SITE_URL}/${type}/${encodeURIComponent(item.slug)}`,
        ...(Number.isFinite(timestamp)
          ? { lastModified: new Date(timestamp) }
          : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  });
  return [...staticRoutes, ...contentRoutes].filter((entry) =>
    isIndexable(entry.url),
  );
}
