import SplitText from "@/components/reactbits/SplitText";
import FadeContent from "@/components/reactbits/FadeContent";
import SectionShell from "@/components/home/SectionShell";
import { siteConfig } from "@/lib/config";

export default function AboutSection() {
  return (
    <SectionShell id="about" label="SEC.02 // BRIEFING">
      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-7">
          <SplitText
            tag="h2"
            text="Engineer by discipline. Builder by instinct."
            splitType="words"
            textAlign="left"
            from={{ opacity: 0, y: 32 }}
            to={{ opacity: 1, y: 0 }}
            className="font-serif-display text-[clamp(1.9rem,3.4vw,3.4rem)] leading-[1.08] text-ink"
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
          <FadeContent delay={0.2} duration={0.9} className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            <span>{siteConfig.revision}</span>
            <span>{siteConfig.location}</span>
            <span>{siteConfig.timezone}</span>
          </FadeContent>
        </div>

        <div className="md:col-span-5">
          <FadeContent duration={0.9} className="h-full">
            <div className="relative border-2 border-ink bg-card p-6 md:p-7">
              <span aria-hidden className="absolute -left-px -top-px h-4 w-4 border-l-4 border-t-4 border-hazard" />
              <span aria-hidden className="absolute -bottom-px -right-px h-4 w-4 border-b-4 border-r-4 border-hazard" />
              <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-hazard">
                <span className="inline-block h-2 w-2 animate-pulse bg-hazard" aria-hidden />
                Notice // Site Status
              </p>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink">
                This platform is under active construction. Sections are being
                commissioned in stages — if something looks half-built, it is.
                Drawings, builds and writing ship as they pass inspection.
              </p>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink-soft">
                Found a fault? Report it through the contact page and it goes
                on the board like everything else.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                <span>
                  STATUS
                  <span className="mt-1 block text-ink">BUILDING</span>
                </span>
                <span>
                  PRIORITY
                  <span className="mt-1 block text-hazard">HIGH</span>
                </span>
                <span>
                  MODE
                  <span className="mt-1 block text-ink">DOCUMENTED</span>
                </span>
              </div>
            </div>
          </FadeContent>
        </div>
      </div>
    </SectionShell>
  );
}
