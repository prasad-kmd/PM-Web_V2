import type { Metadata } from "next";
import styles from "./about.module.css";
import IntroChapter from "@/components/about/IntroChapter";
import PillarsChapter from "@/components/about/PillarsChapter";
import ContextChapter from "@/components/about/ContextChapter";
import JourneyChapter from "@/components/about/JourneyChapter";
import ToolkitChapter from "@/components/about/ToolkitChapter";
import CtaChapter from "@/components/about/CtaChapter";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Prasad Madhuranga — mechanical and mechatronics engineer in Kandy, Sri Lanka: mission and approach, professional context, experience, education and the engineering toolchain behind the work.",
};

/**
 * /about — read as six chapters, snapping one viewport at a time on desktop
 * exactly like the homepage, stacking and flowing normally on mobile.
 *
 * 01 header + morph sliders · 02 mission / approach / expertise ·
 * 03 professional context · 04 experience and education ·
 * 05 tools and stack · 06 call to action
 *
 * NOTE: /portfolio is intentionally untouched; this page only reads the
 * shared data in lib/profile-data.ts.
 */
export default function AboutPage() {
  return (
    <div className={styles.page}>
      <IntroChapter />
      <PillarsChapter />
      <ContextChapter />
      <JourneyChapter />
      <ToolkitChapter />
      <CtaChapter />
    </div>
  );
}
