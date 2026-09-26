import type { Metadata } from "next";
import Image from "next/image";
import FadeContent from "@/components/reactbits/FadeContent";
import GlowCard from "@/components/reactbits/GlowCard";
import BorderGlowTheme from "@/components/reactbits/BorderGlowTheme";
import SkewedCarousel from "@/components/reactbits/SkewedCarousel";
import BendingMarquee from "@/components/react-bits/bending-marquee";
import RayBackground from "@/components/portfolio/ray-background";
import SocialLinks from "@/components/portfolio/social-links";
import {
  EDUCATION,
  EXPERIENCE,
  INTERESTS,
  LANGUAGES,
  PERSONAL_DETAILS,
  PROFILE,
  PROFILE_STATS,
} from "@/lib/profile-data";
import { PROJECTS } from "@/lib/portfolio-data";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "The working record of Prasad Madhuranga — mechanical + mechatronics engineer in Kandy: personal details, education, experience, research interests and featured projects.",
};

const MARQUEE_ITEMS = [
  "Mechatronics",
  "CAD drafting",
  "Automation",
  "Robotics",
  "Machine vision",
  "Renewables",
  "Kandy, Sri Lanka",
];

const CAROUSEL_ITEMS = PROJECTS.flatMap((project) =>
  project.image
    ? [
        {
          src: project.image.src,
          title: `${project.ref} · ${project.name}`,
          alt: project.image.alt,
        },
      ]
    : [],
);

/**
 * The portfolio — the milestone CV direction. Ray animated backdrop behind
 * the profile banner (photo, not monogram), bending marquee under it, stats
 * strip, featured projects as a skewed coverflow carousel, professional
 * milestones on a rail, and a card rail of personal details, education,
 * research interests and languages. Closes on a call to action.
 */
export default function PortfolioPage() {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden"
      >
        <RayBackground />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 md:py-12">
        <header>

          <FadeContent duration={0.9} className="mt-6">
            <BorderGlowTheme glowIntensity={0.8}>
              <GlowCard>
                <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
                  <div className="relative size-50 overflow-hidden rounded-2xl border border-border shadow-sm md:size-50">
                    <Image
                      src="/img/hero/robot-arm.jpg"
                      alt="Portrait stand-in — six-axis robot arm at work"
                      fill
                      priority
                      sizes="240px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-none tracking-[-0.02em] text-ink">
                      {PROFILE.firstName}
                      <span className="text-primary"> {PROFILE.lastName}</span>
                    </h1>
                    <p className="mt-2.5 text-sm font-medium text-primary">
                      {PROFILE.role}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {PROFILE.statusLine}
                    </p>
                    <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ink-soft md:text-[13px]">
                      {PROFILE.summary[0]}
                    </p>
                    <SocialLinks className="mt-4" />
                  </div>
                </div>
              </GlowCard>
            </BorderGlowTheme>
          </FadeContent>

          <FadeContent delay={0.1} duration={0.9} className="mt-5">
            <div className="h-14 overflow-hidden rounded-2xl border border-border bg-card md:h-16">
              <BendingMarquee
                items={MARQUEE_ITEMS}
                separator="·"
                rows={1}
                panelHeight={64}
                fontSize={13}
                letterSpacing={2}
                speed={28}
                color="var(--pm-ink-soft)"
                bandColor="transparent"
                pauseOnHover
                className="h-full w-full"
              />
            </div>
          </FadeContent>

          <FadeContent delay={0.12} duration={0.9} className="mt-5">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              {PROFILE_STATS.map((stat) => (
                <div key={stat.label} className="bg-card p-4 md:p-5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-medium tabular-nums text-ink md:text-3xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeContent>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-6">
            <FadeContent duration={0.8}>
              <BorderGlowTheme className="h-full" glowIntensity={0.8}>
                <GlowCard className="h-full">
                  <section
                    aria-label="Featured projects"
                    className="relative p-6 md:p-7"
                  >
                    <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                      Featured projects
                    </h2>
                    <div className="mt-6 pb-2">
                      <SkewedCarousel
                        items={CAROUSEL_ITEMS}
                        cardWidth={480}
                        aspectRatio="16 / 10"
                        rotation={45}
                        borderRadius={12}
                        loop
                        className="py-4"
                      />
                    </div>
                  </section>
                </GlowCard>
              </BorderGlowTheme>
            </FadeContent>

            <FadeContent delay={0.1} duration={0.8}>
              <BorderGlowTheme className="h-full" glowIntensity={0.8}>
                <GlowCard className="h-full">
                  <section
                    aria-label="Professional milestones"
                    className="relative p-6 md:p-7"
                  >
                    <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                      Professional milestones
                    </h2>
                    <div className="relative mt-6 space-y-8 border-l-2 border-primary/20 pl-7">
                      {EXPERIENCE.map((entry) => (
                        <article key={entry.org} className="relative">
                          <span
                            aria-hidden
                            className="absolute -left-[35px] top-1 size-3.5 rounded-full border-2 border-primary/40 bg-card"
                          />
                          <p className="font-mono text-xs tabular-nums text-primary">
                            {entry.period}
                          </p>
                          <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-ink">
                            {entry.role}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium text-ink-soft">
                            {entry.org} · {entry.location}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-ink-soft md:text-[13px]">
                            {entry.summary}
                          </p>
                          {entry.points.length > 0 ? (
                            <ul className="mt-2.5 space-y-1.5">
                              {entry.points.map((point) => (
                                <li
                                  key={point}
                                  className="flex gap-2.5 text-xs leading-relaxed text-ink-soft md:text-[13px]"
                                >
                                  <span
                                    className="mt-[7px] size-1 shrink-0 rounded-full bg-primary/70"
                                    aria-hidden
                                  />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                </GlowCard>
              </BorderGlowTheme>
            </FadeContent>
          </div>

          <aside className="space-y-6">
            <FadeContent duration={0.8}>
              <section
                aria-label="Personal details"
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  Personal details
                </h2>
                <dl className="mt-4 divide-y divide-border">
                  {PERSONAL_DETAILS.map((detail) => (
                    <div
                      key={detail.label}
                      className="flex items-baseline justify-between gap-4 py-2"
                    >
                      <dt className="text-xs text-ink-soft">{detail.label}</dt>
                      <dd className="text-right text-xs font-medium text-ink">
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </FadeContent>

            <FadeContent delay={0.08} duration={0.8}>
              <section
                aria-label="Education"
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  Education
                </h2>
                <ol className="mt-4 space-y-4">
                  {EDUCATION.map((entry, index) => (
                    <li key={entry.credential}>
                      {index > 0 ? (
                        <hr className="mb-4 border-border/60" />
                      ) : null}
                      <p className="text-sm font-medium leading-snug text-ink">
                        {entry.credential}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {entry.institution}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                        {entry.period}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </FadeContent>

            <FadeContent delay={0.14} duration={0.8}>
              <section
                aria-label="Research interests"
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  Research interests
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {INTERESTS.map((interest) => (
                    <li
                      key={interest.name}
                      title={interest.blurb}
                      className="flex items-center gap-2.5 text-xs text-ink-soft"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      {interest.name}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeContent>

            <FadeContent delay={0.2} duration={0.8}>
              <section
                aria-label="Languages"
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  Languages
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => (
                    <li
                      key={language.name}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink-soft"
                    >
                      {language.name} ({language.level})
                    </li>
                  ))}
                </ul>
              </section>
            </FadeContent>
          </aside>
        </div>

        <FadeContent delay={0.15} duration={0.9} className="mt-6">
          <BorderGlowTheme glowIntensity={0.8}>
            <GlowCard>
              <section
                aria-label="Contact call to action"
                className="relative p-8 text-center md:p-10"
              >
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  Let us build something together
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-ink-soft md:text-[13px]">
                  Always open to discussing new projects, creative ideas or
                  opportunities to be part of your visions.
                </p>
                <SocialLinks className="mt-5 justify-center" />
              </section>
            </GlowCard>
          </BorderGlowTheme>
        </FadeContent>
      </div>
    </div>
  );
}
