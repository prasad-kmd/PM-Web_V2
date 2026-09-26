import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Newspaper,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import FadeContent from "@/components/reactbits/FadeContent";
import SplitText from "@/components/reactbits/SplitText";
import SectionShell from "@/components/home/SectionShell";

/** Featured drawer — the portfolio, presented as a photo card. */
const FEATURED = {
  href: "/projects",
  eyebrow: "Portfolio",
  name: "Projects",
  desc: "The portfolio — robots, machines and systems documented end-to-end.",
  image: "/img/hero/cad-gearbox.jpg",
  alt: "CAD wireframe of a planetary gearbox mechanism",
} as const;

interface ShowcaseCard {
  href: string;
  name: string;
  desc: string;
  icon: LucideIcon;
}

const CARDS: ShowcaseCard[] = [
  {
    href: "/blog",
    name: "Blog",
    desc: "Long-form write-ups of builds, failures and lessons from the bench.",
    icon: Newspaper,
  },
  {
    href: "/articles",
    name: "Articles",
    desc: "Opinionated essays on engineering practice and the tools we trust.",
    icon: PenLine,
  },
  {
    href: "/tutorials",
    name: "Tutorials",
    desc: "Step-by-step guides: CAD, firmware, control loops, fabrication.",
    icon: GraduationCap,
  },
  {
    href: "/glossary",
    name: "Glossary",
    desc: "A working dictionary of the terms this site keeps using.",
    icon: BookOpen,
  },
];

/**
 * Chapter 03 — the archive index as a bento board: one featured photo card
 * (Projects) plus four compact drawers. On desktop the board fills the
 * chapter height (grid rows stretch), so nothing is clipped by the
 * one-viewport snap; on mobile it stacks and grows.
 */
export default function ShowcaseSection() {
  return (
    <SectionShell id="showcase" label="Explore">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SplitText
          tag="h2"
          text="Explore the archive"
          splitType="words"
          textAlign="left"
          from={{ opacity: 0, y: 32 }}
          to={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl"
        />
        <p className="max-w-md font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
          Five drawers, one ledger. Everything on this site is filed under one
          of these — pick a drawer and pull.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 lg:max-h-[36rem] lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-2">
        {/* Featured drawer — Projects */}
        <FadeContent
          duration={0.7}
          className="h-64 md:col-span-2 md:h-52 lg:col-span-1 lg:row-span-2 lg:h-full"
        >
          <Link
            href={FEATURED.href}
            className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Image
              src={FEATURED.image}
              alt={FEATURED.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {FEATURED.eyebrow}
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {FEATURED.name}
                </h3>
                <p className="mt-1.5 max-w-sm font-body text-xs leading-relaxed text-white/75 md:text-sm">
                  {FEATURED.desc}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </div>
          </Link>
        </FadeContent>

        {/* The four compact drawers */}
        {CARDS.map((card, index) => (
          <FadeContent
            key={card.href}
            delay={0.08 * (index + 1)}
            duration={0.7}
            className="h-full"
          >
            <Link
              href={card.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors duration-200 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:p-6"
            >
              <card.icon
                className="size-6 text-primary"
                strokeWidth={1.75}
                aria-hidden
              />
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                {card.name}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
                {card.desc}
              </p>
              <span className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full border border-border text-ink-soft transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-3.5" aria-hidden />
              </span>
            </Link>
          </FadeContent>
        ))}
      </div>
    </SectionShell>
  );
}
