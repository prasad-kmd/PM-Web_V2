import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";
import type { ListingSearchParams } from "@/lib/content-listing";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Articles from Notion — engineering notes, research, and practical work.",
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  return <ContentIndexPage type="articles" searchParams={await searchParams} />;
}
