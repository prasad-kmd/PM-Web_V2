import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";
import type { ListingSearchParams } from "@/lib/content-listing";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Blog from PrasadM - Engineering notes, research and practical work.",
};

export default async function BlogPage({ searchParams }: PageProps) {
  return <ContentIndexPage type="blog" searchParams={await searchParams} />;
}
