"use client";

import {
  ArrowUpRight,
  Crosshair,
  Layers3,
  Workflow,
  Wrench,
} from "lucide-react";
import AboutChapter, {
  AboutChapterLabel,
} from "@/components/about/AboutChapter";
import CardSwap, { Card } from "@/components/react-bits/card-swap";
import BlinkingSquares from "@/components/react-bits/blinking-squares";
import { useThemeColors } from "@/components/about/use-theme-color";
import {
  useAboutCompactViewport,
  useAboutInView,
  useAboutMotionAllowed,
} from "@/components/about/use-about-environment";
import { ABOUT_PRINCIPLES } from "@/lib/about-data";
import styles from "@/app/about/about.module.css";

const PRINCIPLE_ICONS = {
  mission: Crosshair,
  approach: Workflow,
  expertise: Layers3,
};

const TOKENS = {
  "--pm-accent": "#7c5cff",
  "--pm-paper": "#fafafa",
};

/** Chapter 02 — mission, approach and expertise on a rotating card stack. */
export default function PillarsChapter() {
  const colors = useThemeColors(TOKENS);
  const compact = useAboutCompactViewport();
  const { allowed, reduced } = useAboutMotionAllowed();
  const { ref, visible } = useAboutInView<HTMLDivElement>();
  const staticLayout = compact || reduced;

  return (
    <AboutChapter
      id="about-purpose"
      backdrop={
        <>
          {/* Anchored left because the card stack sits on the right. */}
          <BlinkingSquares
            className="absolute inset-0 h-full w-full"
            direction="left"
            gridSize={30}
            squareSize={0.75}
            squareColor={colors["--pm-accent"]}
            backgroundColor={colors["--pm-paper"]}
            intensity={0.9}
            opacity={0.5}
          />
          <div className="absolute inset-0 bg-paper/55 dark:bg-paper/65" />
        </>
      }
    >
      <div className={styles.split}>
        <div>
          <AboutChapterLabel number="02">
            Mission, approach &amp; expertise
          </AboutChapterLabel>
          <h2 id="about-purpose-title" className={styles.display}>
            Practical engineering.
            <br />
            <span className="text-primary">Thoughtful systems.</span>
          </h2>
          <p className={styles.bodyCopy}>
            I am interested in what happens when a drawing becomes a working
            mechanism, and when electronics and software give it useful
            behaviour.
          </p>
          <p className={styles.bodyCopy}>
            My work starts with a clear problem and a willingness to learn.
            These three principles guide the way I approach a design, a
            prototype or a piece of software.
          </p>
          <p className="mt-6 flex items-center gap-2 text-xs text-ink-soft">
            <Wrench
              className="size-4 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            Mechanical design · Automation · Robotics
          </p>
        </div>

        <div
          ref={ref}
          className={styles.missionStage}
          data-static={staticLayout}
        >
          <CardSwap
            width="100%"
            height="min(28rem, 52dvh)"
            cardDistance={24}
            verticalDistance={30}
            skewAmount={3}
            delay={6800}
            pauseOnHover
            easing="elastic"
            enabled={allowed && visible}
            staticLayout={staticLayout}
          >
            {ABOUT_PRINCIPLES.map((principle) => {
              const Icon = PRINCIPLE_ICONS[principle.id];
              return (
                <Card key={principle.id}>
                  <article className={styles.principleCard}>
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                      <p className="font-mono text-xs text-primary">
                        {principle.label}
                      </p>
                      <Icon
                        className="size-5 text-primary"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                    <h3 className="mt-4 font-display text-[clamp(1.4rem,3dvh,2.1rem)] font-medium leading-[1.08] tracking-tight text-ink">
                      {principle.title}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                      {principle.description}
                    </p>
                    <ul
                      className="mt-3.5 flex flex-wrap gap-2"
                      aria-label={`${principle.label} themes`}
                    >
                      {principle.details.map((detail) => (
                        <li
                          key={detail}
                          className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-ink-soft"
                        >
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-ink-soft">
                      {principle.footer}
                      <ArrowUpRight
                        className="size-4 text-primary"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </p>
                  </article>
                </Card>
              );
            })}
          </CardSwap>
        </div>
      </div>
    </AboutChapter>
  );
}
