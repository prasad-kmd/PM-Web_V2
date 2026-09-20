import Noise from "@/components/reactbits/Noise";
import SectionBackdrops from "@/components/home/SectionBackdrops";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import ToolsSection from "@/components/home/ToolsSection";
import MissionSection from "@/components/home/MissionSection";
import FooterSection from "@/components/home/FooterSection";

export default function Home() {
  return (
    <>
      {/* Pinned photo backdrops for sections 02–05 (never scroll) */}
      <SectionBackdrops />

      {/* Printed-paper grain over the whole sheet */}
      <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
        <Noise patternAlpha={10} />
      </div>

      <HeroSection />
      <AboutSection />
      <ShowcaseSection />
      <ToolsSection />
      <MissionSection />
      <FooterSection />
    </>
  );
}
