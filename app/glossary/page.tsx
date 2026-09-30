import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";
import type { ListingSearchParams } from "@/lib/content-listing";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Glossary from Notion — engineering notes, research, and practical work.",
};

export default async function GlossaryPage({ searchParams }: PageProps) {
  return <ContentIndexPage type="glossary" searchParams={await searchParams} />;
}
