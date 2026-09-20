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
    <SectionShell
      id="showcase"
      label="SEC.03 // INDEX"
      image="/img/bg-content.jpg"
      imageAlt="Electronics and robotics laboratory workbench"
    >
      <SplitText
        tag="h2"
        text="EXPLORE THE ARCHIVE"
        splitType="chars"
        textAlign="left"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        className="font-display text-[clamp(2.2rem,4.4vw,4.4rem)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
      />
      <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-ink-soft">
        Five drawers, one ledger. Everything on this site is filed under one of
        these — pick a drawer and pull.
      </p>

      <div className="mt-10 border-t-2 border-ink md:mt-12">
        {SHOWCASE.map((item, index) => (
          <FadeContent key={item.href} delay={index * 0.08} duration={0.7}>
            <Link
              href={item.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-ink/25 px-3 py-4 transition-colors duration-300 hover:bg-ink hover:text-paper md:grid-cols-[5rem_1fr_auto_3rem] md:px-5 md:py-5"
            >
              <span className="font-extd text-sm font-medium text-ink-soft transition-colors duration-300 group-hover:text-hazard md:text-base">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl uppercase leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-2 md:text-4xl">
                  {item.name}
                </span>
                <span className="mt-1 hidden max-w-md font-body text-xs leading-relaxed text-ink-soft transition-colors duration-300 group-hover:text-paper/70 md:block">
                  {item.desc}
                </span>
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft transition-colors duration-300 group-hover:text-paper/70 md:block">
                OPEN FILE
              </span>
              <ArrowUpRight
                className="h-5 w-5 justify-self-end text-ink-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-hazard md:h-7 md:w-7"
                aria-hidden
              />
            </Link>
          </FadeContent>
        ))}
      </div>
    </SectionShell>
  );
}
