import type { MetadataRoute } from "next";
import { CONTENT_TYPES, getContentIndex } from "@/lib/notion-cms";
import { SITE_URL } from "@/lib/content-metadata";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
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
  return [...staticRoutes, ...contentRoutes];
}
