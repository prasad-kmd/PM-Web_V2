"use client";

import { BriefcaseBusiness, GraduationCap, MapPin } from "lucide-react";
import ScrollStack from "@/components/react-bits/scroll-stack";
import { AboutChapterLabel } from "@/components/about/AboutChapter";
import {
  useAboutCompactViewport,
  useAboutMotionAllowed,
} from "@/components/about/use-about-environment";
import { ABOUT_MILESTONES, type AboutMilestone } from "@/lib/about-data";
import styles from "@/app/about/about.module.css";

function MilestoneCard({ milestone }: { milestone: AboutMilestone }) {
  const Icon =
    milestone.kind === "Education" ? GraduationCap : BriefcaseBusiness;
  return (
    <article className={styles.historyCard}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p className="flex items-center gap-2 font-mono text-xs text-primary">
          <Icon className="size-4" strokeWidth={1.5} aria-hidden />
          {milestone.kind}
        </p>
        <p className="font-mono text-xs tabular-nums text-ink-soft">
          {milestone.current
            ? "Currently reading"
            : milestone.period === "Completed"
              ? `${milestone.year} · Completed`
              : milestone.period}
        </p>
      </div>
      <div className="mt-4 min-w-0">
        <h3 className="max-w-[32ch] text-balance font-display text-[clamp(1.35rem,3dvh,2.2rem)] font-medium leading-[1.1] tracking-tight text-ink">
          {milestone.title}
        </h3>
        <p className="mt-2.5 text-sm font-medium text-ink">
          {milestone.organization}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
          <MapPin className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
          {milestone.location}
        </p>
      </div>
      <div className="mt-4 border-t border-border pt-3.5">
        <p className="max-w-[70ch] text-sm leading-relaxed text-ink-soft">
          {milestone.summary}
        </p>
        {milestone.points.length > 0 && (
          <ul className="mt-3 space-y-2">
            {milestone.points.map((point) => (
              <li
                key={point}
                className="flex max-w-[74ch] gap-2.5 text-[13px] leading-relaxed text-ink-soft"
              >
                <span
                  aria-hidden
                  className="mt-2 size-1 shrink-0 rounded-full bg-primary"
                />
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
      {milestone.current && (
        <p className="mt-auto pt-4 font-mono text-xs text-primary">
          Mechanics · Electronics · Control · Computing
        </p>
      )}
    </article>
  );
}

/**
 * Chapter 04 — experience and education, oldest card first. The stack pins a
 * full-viewport stage and advances a card per screen of scroll, so what the
 * reader sees is always exactly one viewport tall. No backdrop by request.
 */
export default function JourneyChapter() {
  const compact = useAboutCompactViewport();
  const { reduced } = useAboutMotionAllowed();

  return (
    <section
      id="about-history"
      aria-labelledby="about-history-title"
      className={`snap-section ${styles.historyChapter}`}
    >
      <ScrollStack
        ariaLabel="Professional experience and education, oldest to newest"
        header={
          <div className={styles.historyHeader}>
            <AboutChapterLabel number="04">
              Experience &amp; education
            </AboutChapterLabel>
            <h2 id="about-history-title" className={styles.display}>
              A foundation built over time.
            </h2>
            <p className="mt-2 text-xs text-ink-soft">
              From the earliest studies to the work in progress. Scroll through
              the journey.
            </p>
          </div>
        }
        variant="stack"
        scrollLength={0.85}
        peek={22}
        scaleStep={0.035}
        blur={0}
        dim={0.14}
        smooth={0.2}
        depth={3}
        cardWidth={880}
        cardHeight={0.62}
        borderRadius={16}
        showProgress={false}
        showCounter={false}
        staticLayout={compact || reduced}
      >
        {ABOUT_MILESTONES.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </ScrollStack>
    </section>
  );
}
