import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Blog from Notion — engineering notes, research, and practical work.",
};

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] || "" : params.q || "";
  const rawPage = Array.isArray(params.page)
    ? params.page[0] || "1"
    : params.page || "1";
  const page = Number.parseInt(rawPage, 10);
  return (
    <ContentIndexPage
      type="blog"
      query={query}
      page={Number.isFinite(page) ? page : 1}
    />
  );
}
