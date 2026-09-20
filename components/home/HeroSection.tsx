import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import StaggeredText from "@/components/react-bits/staggered-text";
import BendingMarquee from "@/components/react-bits/bending-marquee";
import ShinyText from "@/components/reactbits/ShinyText";
import HeroCarousel, { type HeroSlide } from "@/components/home/HeroCarousel";
import { siteConfig } from "@/lib/config";

const SLIDES: HeroSlide[] = [
  {
    src: "/img/hero/robot-arm.jpg",
    alt: "Six-axis industrial robot arm welding an engine block on a conveyor",
    tag: "FILE 01 // ROBOTICS",
    title: "Industrial Robotics",
    desc: "Six-axis manipulation cells: kinematics, trajectory planning and end-of-arm tooling built and commissioned on real lines.",
  },
  {
    src: "/img/hero/pcb-macro.jpg",
    alt: "Macro photograph of a microcontroller circuit board",
    tag: "FILE 02 // EMBEDDED",
    title: "Embedded Systems",
    desc: "STM32 + RTOS firmware, sensor fusion and field-oriented motor control running on custom four-layer PCBs.",
  },
  {
    src: "/img/hero/cad-gearbox.jpg",
    alt: "CAD wireframe of a planetary gearbox mechanism",
    tag: "FILE 03 // MECHANISM",
    title: "Precision Mechanisms",
    desc: "Planetary gear trains and compliant mechanisms — modeled, simulated and drawn for manufacture down to the last tolerance.",
  },
  {
    src: "/img/hero/drone-motor.jpg",
    alt: "Carbon fiber drone with brushless motors on a workbench",
    tag: "FILE 04 // AUTONOMY",
    title: "Autonomous Systems",
    desc: "Flight controllers, BLDC drives and perception loops for aerial platforms that hold position in Sri Lankan wind.",
  },
];

const MARQUEE_ITEMS = [
  "MECHATRONICS",
  "CAD / CAM",
  "CONTROL SYSTEMS",
  "ROBOTICS",
  "EMBEDDED FIRMWARE",
  "AUTOMATION",
  "MECHANISM DESIGN",
  "PCB ENGINEERING",
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="snap-section relative flex min-h-dvh flex-col md:h-dvh md:overflow-hidden"
    >
      <div className="blueprint-grid absolute inset-0" aria-hidden />

      <div className="relative grid flex-1 md:grid-cols-[46fr_54fr]">
        {/* Left column — identity */}
        <div className="relative flex flex-col justify-between px-6 pb-8 pt-6 md:px-12 md:pb-10 md:pt-8">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            <span>PM/ENG // {siteConfig.coordinates}</span>
            <span className="hidden md:inline">EST. KANDY, LK</span>
          </div>

          <div className="py-10 md:py-0">
            <p className="mb-5 inline-block border-2 border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
              [ Mechanical + Mechatronics ]
            </p>

            <StaggeredText
              as="h1"
              text={"STEEL DISCIPLINE,|MACHINE INTELLIGENCE."}
              separator="|"
              segmentBy="words"
              direction="bottom"
              blur
              delay={60}
              duration={0.9}
              className="font-display text-[clamp(2.7rem,4.9vw,5rem)] uppercase leading-[0.94] tracking-[-0.02em] text-ink"
            />

            <div className="mt-6 max-w-md">
              <ShinyText
                text={siteConfig.role.toUpperCase()}
                speed={3}
                color="var(--pm-ink-soft)"
                className="font-mono text-xs tracking-[0.3em]"
              />
              <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
                I design, model and build systems that move — robot arms, drive
                trains, control loops. This site is my working archive: field
                notes, builds, tutorials and the drawings behind them.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/projects"
                className="group flex items-center gap-3 bg-hazard px-7 py-4 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors duration-300 hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard"
              >
                View Projects
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              <Link
                href="/blog"
                className="group flex items-center gap-3 border-2 border-ink px-7 py-[14px] font-mono text-xs uppercase tracking-[0.25em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Read the Blog
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            <span>{siteConfig.revision}</span>
            <span>{siteConfig.timezone}</span>
          </div>
        </div>

        {/* Right column — carousel with vertical loading bar */}
        <div className="relative border-t-2 border-ink md:border-l-2 md:border-t-0">
          <HeroCarousel slides={SLIDES} />
        </div>
      </div>

      {/* Ticker strip */}
      <div className="relative h-12 shrink-0 overflow-hidden border-t-2 border-ink md:h-14">
        <BendingMarquee
          items={MARQUEE_ITEMS}
          separator="///"
          speed={26}
          rows={1}
          fit
          panelHeight={56}
          fontSize={13}
          fontWeight={500}
          letterSpacing={3}
          color="var(--pm-ink)"
          bandColor="transparent"
          pauseOnHover
        />
      </div>
    </section>
  );
}
