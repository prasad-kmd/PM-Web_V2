"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Cog, Cpu } from "lucide-react";
import AboutChapter, {
  AboutChapterLabel,
} from "@/components/about/AboutChapter";
import SocialLinks from "@/components/portfolio/social-links";
import { useAboutMotionAllowed } from "@/components/about/use-about-environment";
import { ABOUT_MEDIA } from "@/lib/about-data";
import { PROFILE } from "@/lib/profile-data";
import styles from "@/app/about/about.module.css";

const STARTING_POINTS = [
  "A mechanism or CAD drawing",
  "An embedded prototype",
  "An automation idea",
];

/**
 * Chapter 06 — a reworked cta-9: the centred composition with two tilted
 * accent cards, retuned onto the site tokens, pointed at real destinations
 * and quiet when the reader asks for reduced motion.
 */
export default function CtaChapter() {
  const { allowed } = useAboutMotionAllowed();
  const duration = allowed ? 0.6 : 0;

  return (
    <AboutChapter id="about-connect">
      <AboutChapterLabel number="06">Let us build something</AboutChapterLabel>

      <div className={styles.ctaShell}>
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card/90 px-6 py-10 shadow-sm backdrop-blur-md sm:px-12 sm:py-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_srgb,var(--pm-accent)_16%,transparent),transparent_70%)]"
          />

          <motion.div
            initial={false}
            whileInView={{ x: 0, rotate: -12 }}
            viewport={{ once: true }}
            transition={{ duration, delay: allowed ? 0.12 : 0 }}
            aria-hidden
            className="absolute -left-12 top-1/2 hidden w-56 -translate-y-1/2 rounded-xl border border-border bg-card p-2 shadow-sm xl:block"
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
              <Image
                src={ABOUT_MEDIA.gallery[2].image}
                alt=""
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
            <p className="px-2 pb-1 pt-3 font-display text-base font-medium text-ink">
              From sketch to mechanism
            </p>
            <p className="px-2 pb-2 font-mono text-[10px] text-primary">
              DESIGN / BUILD / REFINE
            </p>
          </motion.div>

          <motion.div
            initial={false}
            whileInView={{ x: 0, rotate: 9 }}
            viewport={{ once: true }}
            transition={{ duration, delay: allowed ? 0.2 : 0 }}
            aria-hidden
            className="absolute -right-14 top-1/2 hidden w-64 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-sm xl:block"
          >
            <p className="border-b border-border pb-3 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              A good starting point
            </p>
            <p className="mt-4 font-display text-xl font-medium text-ink">
              What are you working on?
            </p>
            <ul className="mt-4 space-y-3">
              {STARTING_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-xs text-ink-soft"
                >
                  <Check className="size-3.5 text-primary" strokeWidth={1.5} />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="relative mx-auto flex max-w-[35rem] flex-col items-center text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {PROFILE.availability}
            </p>
            <div aria-hidden className="mb-5 flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                <Cog className="size-5 text-primary" strokeWidth={1.5} />
              </span>
              <ArrowRight className="size-4 text-ink-soft" strokeWidth={1.5} />
              <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                <Cpu className="size-5 text-primary" strokeWidth={1.5} />
              </span>
            </div>
            <h2
              id="about-connect-title"
              className="text-balance font-display text-[clamp(1.9rem,4.4dvh+1vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-ink"
            >
              Have a problem worth building for?
            </h2>
            <p className="mt-4 max-w-[45ch] text-sm leading-relaxed text-ink-soft">
              A mechanism to refine, a control system to prototype, or an idea
              to discuss. I am open to collaboration across engineering and
              software.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="group inline-flex min-h-12 items-center gap-5 whitespace-nowrap rounded-xl bg-primary py-2 pl-5 pr-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:scale-[0.98]"
              >
                Get in touch
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl border border-border bg-card px-5 text-sm text-ink transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:scale-[0.98]"
              >
                See the full record
              </Link>
            </div>
            <SocialLinks className="mt-5 justify-center" />
            <p className="mt-4 font-mono text-[11px] text-ink-soft">
              {PROFILE.location} · {PROFILE.timezone}
            </p>
          </div>
        </motion.div>
      </div>
    </AboutChapter>
  );
}
