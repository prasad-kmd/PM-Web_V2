import SectionBackdrops from "@/components/home/SectionBackdrops";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import ToolsSection from "@/components/home/ToolsSection";
import MissionSection from "@/components/home/MissionSection";
import { getContentIndex, type ContentType } from "@/lib/notion-cms";
import type { HeroSlide } from "@/components/home/HeroCarousel";

export const revalidate = 3600;

const SOURCES: ContentType[] = ["blog", "articles", "tutorials", "projects"];

export default async function Home() {
  // One newest published item from each collection; the same Notion source
  // and thumbnail resolution used by the collection listing pages.
  const results = await Promise.all(
    SOURCES.map((type) => getContentIndex(type)),
  );
  const slides = results
    .flatMap((result) =>
      result.items.slice(0, 1).map((item) => ({
        src: item.thumbnail ?? item.image,
        alt: item.title,
        tag: item.type[0].toUpperCase() + item.type.slice(1),
        title: item.title,
        desc: item.description,
        href: `/${item.type}/${encodeURIComponent(item.slug)}`,
        date: item.date,
      })),
    )
    .sort(
      (a, b) =>
        (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0),
    ) satisfies (HeroSlide & { date: string | null })[];

  return (
    <>
      <SectionBackdrops />
      <HeroSection slides={slides} />
      <AboutSection />
      <ShowcaseSection />
      <ToolsSection />
      <MissionSection />
    </>
  );
}
