import type { Metadata } from "next";
import { ContentIndexPage } from "@/components/notion/ContentIndexPage";
import type { ListingSearchParams } from "@/lib/content-listing";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export const metadata: Metadata = {
  title: "Tutorials",
  description:
    "Tutorials from PrasadM - Engineering notes, research and practical work.",
};

export default async function TutorialsPage({ searchParams }: PageProps) {
  return (
    <ContentIndexPage type="tutorials" searchParams={await searchParams} />
  );
}
