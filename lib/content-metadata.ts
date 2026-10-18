import type { Metadata } from "next";
import { CONTENT_META, type ContentItem, type ContentType } from "@/lib/notion-cms";

// Defined once, in the env module. Previously this defaulted to the *previous*
// site's domain (prasadm.vercel.app), which is neither ours nor deployed.
// Imported (not just re-exported) because this file uses it below.
import { SITE_URL } from "@/lib/env";

export { SITE_URL };

const FALLBACK_OG: Record<ContentType, string> = {
  projects: "/img/projects/cnc-lathe.jpg",
  blog: "/img/bg-content.jpg",
  articles: "/img/hero/cad-gearbox.jpg",
  tutorials: "/img/hero/pcb-macro.jpg",
  glossary: "/img/bg-about.jpg",
};

export function getContentMetadata(item: ContentItem, type: ContentType): Metadata {
  const route = `/${type}/${encodeURIComponent(item.slug)}`;
  const canonical = new URL(route, SITE_URL).toString();
  const image = new URL(item.image || FALLBACK_OG[type], SITE_URL).toString();
  const description = item.description || `${item.title} — ${CONTENT_META[type].label} from ${SITE_URL}.`;
  const title = `${item.title} | ${CONTENT_META[type].label}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: item.date || undefined,
      authors: item.author?.name ? [item.author.name] : undefined,
      images: [{ url: image, alt: item.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    keywords: [...item.categories, ...item.tags, ...item.technical],
  };
}
