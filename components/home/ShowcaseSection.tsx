import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import FadeContent from "@/components/reactbits/FadeContent";
import SplitText from "@/components/reactbits/SplitText";
import SectionShell from "@/components/home/SectionShell";

const SHOWCASE = [
  {
    href: "/blog",
    name: "Blog",
    desc: "Long-form write-ups of builds, failures and lessons from the bench.",
  },
  {
    href: "/articles",
    name: "Articles",
    desc: "Opinionated essays on engineering practice and the tools we trust.",
  },
  {
    href: "/tutorials",
    name: "Tutorials",
    desc: "Step-by-step guides: CAD, firmware, control loops, fabrication.",
  },
  {
    href: "/projects",
    name: "Projects",
    desc: "The portfolio — robots, machines and systems documented end-to-end.",
  },
  {
    href: "/glossary",
    name: "Glossary",
    desc: "A working dictionary of the terms this site keeps using.",
  },
] as const;

export default function ShowcaseSection() {
  return (
    <SectionShell id="showcase" label="Explore">
      <SplitText
        tag="h2"
        text="Explore the archive"
        splitType="words"
        textAlign="left"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        className="font-display text-[clamp(2rem,4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink"
      />
      <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
        Five drawers, one ledger. Everything on this site is filed under one of
        these — pick a drawer and pull.
      </p>

      <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:mt-12">
        {SHOWCASE.map((item, index) => (
          <FadeContent key={item.href} delay={index * 0.08} duration={0.7}>
            <Link
              href={item.href}
              className="group flex items-center gap-5 px-5 py-5 transition-colors duration-200 hover:bg-muted/50 md:gap-7 md:px-7 md:py-6"
            >
              <span className="w-8 shrink-0 text-sm font-medium tabular-nums text-primary md:text-base">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-medium tracking-tight text-ink transition-transform duration-200 group-hover:translate-x-1 md:text-2xl">
                  {item.name}
                </span>
                <span className="mt-1 hidden max-w-md font-body text-xs leading-relaxed text-ink-soft md:block md:text-sm">
                  {item.desc}
                </span>
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-ink-soft transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </Link>
          </FadeContent>
        ))}
      </div>
    </SectionShell>
  );
}
