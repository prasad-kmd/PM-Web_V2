import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";
import type { ListingSearchParams } from "@/lib/content-listing";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Projects from Notion — engineering notes, research, and practical work.",
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  return <ContentIndexPage type="projects" searchParams={await searchParams} />;
}
