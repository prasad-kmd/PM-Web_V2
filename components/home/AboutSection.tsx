import SplitText from "@/components/reactbits/SplitText";
import FadeContent from "@/components/reactbits/FadeContent";
import GlowCard from "@/components/reactbits/GlowCard";
import BorderGlow from "@/components/reactbits/BorderGlow";
import SectionShell from "@/components/home/SectionShell";
import { siteConfig } from "@/lib/config";

/** BorderGlow shell tuning: 16px radius matches rounded-2xl cards. */
const GLOW_PROPS: Parameters<typeof BorderGlow>[0] = {
  borderRadius: 16,
  glowRadius: 24,
  glowIntensity: 0.8,
  glowColor: "252 60 62",
  colors: ["#a78bfa", "#8b5cf6", "#6366f1"],
};

export default function AboutSection() {
  return (
    <SectionShell id="about" label="About">
      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-7">
          <SplitText
            tag="h2"
            text="Engineer by discipline. Builder by instinct."
            splitType="words"
            textAlign="left"
            from={{ opacity: 0, y: 32 }}
            to={{ opacity: 1, y: 0 }}
            className="font-display text-[clamp(1.9rem,3.4vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink"
          />
          <FadeContent duration={0.9} className="mt-8 max-w-xl space-y-5">
            <p className="font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
              I am a mechanical and mechatronics engineer working out of Kandy,
              Sri Lanka. My work sits on the seam between the machine and the
              microcontroller — gearboxes and gantries on one side, firmware,
              sensors and control loops on the other.
            </p>
            <p className="font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
              This site is not a brochure; it is a workshop ledger. Everything
              published here was drawn, machined, soldered or debugged first —
              then written down so the next engineer can start further along
              the line than I did.
            </p>
          </FadeContent>
          <FadeContent
            delay={0.2}
            duration={0.9}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-soft"
          >
            <span>{siteConfig.location}</span>
            <span>{siteConfig.coordinates}</span>
            <span>{siteConfig.timezone}</span>
          </FadeContent>
        </div>

        <div className="md:col-span-5">
          <FadeContent duration={0.9} className="h-full">
            <BorderGlow className="h-full" {...GLOW_PROPS}>
              <GlowCard className="h-full">
                <div className="relative flex h-full flex-col p-6 md:p-7">
                  <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    <span className="relative flex size-2" aria-hidden>
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    Site status
                  </p>
                  <p className="mt-4 font-body text-sm leading-relaxed text-ink">
                    This platform is under active construction. Sections are
                    being commissioned in stages — if something looks
                    half-built, it is. Drawings, builds and writing ship as
                    they pass inspection.
                  </p>
                  <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                    Found a fault? Report it through the contact page and it
                    goes on the board like everything else.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
                    <div>
                      <p className="text-xs text-ink-soft">Status</p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        Building
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-soft">Priority</p>
                      <p className="mt-1 text-sm font-medium text-primary">
                        High
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-soft">Mode</p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        Documented
                      </p>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </BorderGlow>
          </FadeContent>
        </div>
      </div>
    </SectionShell>
  );
}
