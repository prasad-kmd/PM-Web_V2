import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import StaggeredText from "@/components/react-bits/staggered-text";
import HeroCarousel, { type HeroSlide } from "@/components/home/HeroCarousel";
import { siteConfig } from "@/lib/config";

const SLIDES: HeroSlide[] = [
  {
    src: "/img/hero/robot-arm.jpg",
    alt: "Six-axis industrial robot arm welding an engine block on a conveyor",
    tag: "Robotics",
    title: "Industrial robotics",
    desc: "Six-axis manipulation cells: kinematics, trajectory planning and end-of-arm tooling built and commissioned on real lines.",
  },
  {
    src: "/img/hero/pcb-macro.jpg",
    alt: "Macro photograph of a microcontroller circuit board",
    tag: "Embedded",
    title: "Embedded systems",
    desc: "STM32 + RTOS firmware, sensor fusion and field-oriented motor control running on custom four-layer PCBs.",
  },
  {
    src: "/img/hero/cad-gearbox.jpg",
    alt: "CAD wireframe of a planetary gearbox mechanism",
    tag: "Mechanisms",
    title: "Precision mechanisms",
    desc: "Planetary gear trains and compliant mechanisms — modeled, simulated and drawn for manufacture down to the last tolerance.",
  },
  {
    src: "/img/hero/drone-motor.jpg",
    alt: "Carbon fiber drone with brushless motors on a workbench",
    tag: "Autonomy",
    title: "Autonomous systems",
    desc: "Flight controllers, BLDC drives and perception loops for aerial platforms that hold position in Sri Lankan wind.",
  },
];

const FOCUS_AREAS = [
  "Robotics",
  "Embedded systems",
  "CAD / CAM",
  "Control systems",
  "Automation",
  "Mechanism design",
  "PCB engineering",
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="snap-section relative min-h-dvh md:h-dvh md:overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-14 md:h-full md:grid-cols-[48fr_52fr] md:items-center md:px-12">
        {/* Left column — identity */}
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {siteConfig.role}
          </p>

          <StaggeredText
            as="h1"
            text={"Mechatronics,|engineered end to end."}
            separator="|"
            segmentBy="words"
            direction="bottom"
            blur
            delay={60}
            duration={0.9}
            className="mt-6 font-display text-[clamp(2.6rem,5vw,4.2rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink"
          />

          <p className="mt-6 max-w-md font-body text-[15px] leading-relaxed text-ink-soft md:text-base">
            I design, model and build systems that move — robot arms, drive
            trains, control loops. This site is my working archive: field
            notes, builds, tutorials and the drawings behind them.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              View projects
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Read the blog
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <p className="mt-10 text-xs text-ink-soft">
            {FOCUS_AREAS.join(" · ")}
          </p>
        </div>

        {/* Right column — focus carousel */}
        <div className="h-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:h-[58dvh]">
          <HeroCarousel slides={SLIDES} />
        </div>
      </div>
    </section>
  );
}
