import SplitText from "@/components/reactbits/SplitText";
import FadeContent from "@/components/reactbits/FadeContent";
import SectionShell from "@/components/home/SectionShell";

const TARGETS = [
  {
    code: "01",
    name: "Design",
    desc: "Rigorous, manufacturable, fully dimensioned. A drawing that cannot be machined by a stranger is not finished.",
  },
  {
    code: "02",
    name: "Build",
    desc: "Fabricate and validate in-house wherever possible. Data from the bench beats data from the brochure.",
  },
  {
    code: "03",
    name: "Share",
    desc: "Publish the drawings, the firmware and the failures. Open knowledge compounds faster than secrecy.",
  },
] as const;

export default function MissionSection() {
  return (
    <SectionShell id="mission" label="SEC.05 // DIRECTIVE">
      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-7">
          <SplitText
            tag="h2"
            text="Machines should extend human hands — precisely, safely, honestly."
            splitType="words"
            textAlign="left"
            from={{ opacity: 0, y: 32 }}
            to={{ opacity: 1, y: 0 }}
            className="font-serif-display text-[clamp(1.9rem,3.3vw,3.3rem)] leading-[1.1] text-ink"
          />
          <FadeContent duration={0.9} className="mt-8 max-w-xl">
            <p className="font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
              My target is simple to say and hard to do: build local engineering
              capability that survives contact with the real world. Every
              project on this site is measured against three commitments.
            </p>
          </FadeContent>
          <FadeContent delay={0.15} duration={0.9} className="mt-8">
            <p className="font-sinhala text-lg text-ink md:text-xl">
              යන්ත්‍ර · බුද්ධිය · නිර්මාණය
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
              Machines · Intelligence · Creation
            </p>
          </FadeContent>
        </div>

        <div className="md:col-span-5">
          <div className="border-t-2 border-ink">
            {TARGETS.map((target, index) => (
              <FadeContent key={target.code} delay={index * 0.12} duration={0.8}>
                <div className="group border-b border-ink/25 py-5 transition-colors duration-300 hover:border-hazard">
                  <p className="flex items-baseline gap-4">
                    <span className="font-cond text-2xl font-medium text-hazard md:text-3xl">
                      [{target.code}]
                    </span>
                    <span className="font-display text-xl uppercase tracking-tight text-ink md:text-2xl">
                      {target.name}
                    </span>
                  </p>
                  <p className="mt-3 pl-0 font-body text-sm leading-relaxed text-ink-soft md:pl-14">
                    {target.desc}
                  </p>
                </div>
              </FadeContent>
            ))}
          </div>
          <FadeContent delay={0.35} duration={0.9} className="mt-8 flex items-end justify-between gap-4">
            <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-soft">
              Signed,
            </p>
            <p className="font-script text-3xl leading-none text-ink md:text-4xl">
              Prasad M.
            </p>
          </FadeContent>
        </div>
      </div>
    </SectionShell>
  );
}
