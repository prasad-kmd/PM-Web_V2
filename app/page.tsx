import SectionBackdrops from "@/components/home/SectionBackdrops";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import ToolsSection from "@/components/home/ToolsSection";
import MissionSection from "@/components/home/MissionSection";

export default function Home() {
  return (
    <>
      <SectionBackdrops />
      <HeroSection />
      <AboutSection />
      <ShowcaseSection />
      <ToolsSection />
      <MissionSection />
    </>
  );
}
