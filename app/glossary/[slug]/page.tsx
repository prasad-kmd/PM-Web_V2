import type { Metadata } from "next";
import { ContentDetailPage } from "@/components/notion/ContentDetailPage";
import { getContentIndex } from "@/lib/notion-cms";
import { getContentMetadata } from "@/lib/content-metadata";

export const revalidate = 3600;
export const dynamicParams = true;

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { items } = await getContentIndex("glossary");
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const { items } = await getContentIndex("glossary");
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return { title: "Glossary" };
  return getContentMetadata(item, "glossary");
}

export default async function GlossaryDetailPage({ params }: RouteProps) {
  const { slug } = await params;
  return <ContentDetailPage type="glossary" slug={slug} />;
}
