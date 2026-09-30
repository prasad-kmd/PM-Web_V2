"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import AboutChapter, {
  AboutChapterLabel,
} from "@/components/about/AboutChapter";
import PointerGradientBorder from "@/components/portfolio/PointerGradientBorder";
import SocialLinks from "@/components/portfolio/social-links";
import MorphSlider from "@/components/react-bits/morph-slider";
import RisingLines from "@/components/react-bits/rising-lines";
import { useThemeColors } from "@/components/about/use-theme-color";
import {
  useAboutCompactViewport,
  useAboutInView,
  useAboutMotionAllowed,
} from "@/components/about/use-about-environment";
import { ABOUT_SLIDER_ORDERS } from "@/lib/about-data";
import { PROFILE } from "@/lib/profile-data";
import styles from "@/app/about/about.module.css";

/** Alternating melt / shear so neighbouring panels never morph identically. */
const TRANSITIONS = ["melt", "shear", "melt"] as const;

/**
 * NOTE: MorphSlider takes `autoplayDelay` in SECONDS, not milliseconds
 * (internally `Math.max(delay, 1) * 1000`). Staggered so the three panels
 * never turn over together.
 */
const DELAYS = [3.2, 3.8, 4.4];

const TOKENS = {
  "--pm-accent": "#7c5cff",
  "--pm-accent-soft": "#9d86ff",
};

export default function IntroChapter() {
  const colors = useThemeColors(TOKENS);
  const compact = useAboutCompactViewport();
  const { allowed } = useAboutMotionAllowed();
  const { ref, visible } = useAboutInView<HTMLDivElement>();

  return (
    <AboutChapter
      id="about-intro"
      backdrop={
        <>
          {/* Painted inside a viewport-tall section, so it never travels
              with the scroll. */}
          <RisingLines
            className="absolute inset-0 h-full w-full opacity-70 dark:opacity-90"
            color={colors["--pm-accent"]}
            horizonColor={colors["--pm-accent"]}
            haloColor={colors["--pm-accent-soft"]}
            riseSpeed={0.08}
            flowSpeed={0.16}
            haloIntensity={5.5}
            horizonIntensity={0.7}
            brightness={0.9}
          />
          <div className="absolute inset-0 bg-paper/72 dark:bg-paper/78" />
        </>
      }
    >
      <AboutChapterLabel number="01">Who is behind the work</AboutChapterLabel>

      {/* ── Header, carried over from /portfolio ─────────────────────────── */}
      <PointerGradientBorder>
        <div className="relative grid gap-5 p-5 md:grid-cols-[auto_1fr] md:items-center md:p-6">
          <div className="relative size-28 overflow-hidden rounded-2xl border border-border shadow-sm md:size-36">
            <Image
              src="/img/hero/robot-arm.jpg"
              alt="Portrait stand-in — six-axis robot arm at work"
              fill
              priority
              sizes="144px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1
              id="about-intro-title"
              className="font-display text-[clamp(1.75rem,3.4dvh+1vw,2.9rem)] font-semibold leading-none tracking-[-0.02em] text-ink"
            >
              {PROFILE.firstName}
              <span className="text-primary"> {PROFILE.lastName}</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-primary">
              {PROFILE.role}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{PROFILE.statusLine}</p>
            <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-ink-soft md:text-[13px]">
              {PROFILE.summary[0]}
            </p>
            <SocialLinks className="mt-3.5" />
          </div>
        </div>
      </PointerGradientBorder>

      {/* ── Three morph sliders: same frames, three different orders ─────── */}
      <div ref={ref} className={styles.triptych}>
        {ABOUT_SLIDER_ORDERS.map((order, index) => (
          <div key={index} className={styles.sliderFrame}>
            <MorphSlider
              /* Stable module-scope arrays: a fresh array each render would
                 tear down and rebuild the WebGL engine on every paint. */
              items={order as unknown as { image: string }[]}
              transition={TRANSITIONS[index]}
              ease="expo.out"
              duration={1.4}
              autoplay={allowed && visible && !compact}
              autoplayDelay={DELAYS[index]}
              loop
              radius={0}
              showCaptions={false}
              showControls={false}
              showIndicators={false}
              aria-label={`Workshop frames, view ${index + 1} of 3`}
              className="h-full w-full"
            />
          </div>
        ))}
      </div>

      <Link
        href="#about-purpose"
        className="mt-4 inline-flex w-fit items-center gap-2 text-xs text-ink-soft transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        A little more about how I work
        <ArrowDown className="size-3.5" strokeWidth={1.5} aria-hidden />
      </Link>
    </AboutChapter>
  );
}
