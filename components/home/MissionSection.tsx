import SplitText from "@/components/reactbits/SplitText";
import FadeContent from "@/components/reactbits/FadeContent";
import GlowCard from "@/components/reactbits/GlowCard";
import BorderGlow from "@/components/reactbits/BorderGlow";
import SectionShell from "@/components/home/SectionShell";

const TARGETS = [
  {
    name: "Design",
    desc: "Rigorous, manufacturable, fully dimensioned. A drawing that cannot be machined by a stranger is not finished.",
  },
  {
    name: "Build",
    desc: "Fabricate and validate in-house wherever possible. Data from the bench beats data from the brochure.",
  },
  {
    name: "Share",
    desc: "Publish the drawings, the firmware and the failures. Open knowledge compounds faster than secrecy.",
  },
] as const;

/** BorderGlow shell tuning: 16px radius matches rounded-2xl cards. */
const GLOW_PROPS: Parameters<typeof BorderGlow>[0] = {
  borderRadius: 16,
  glowRadius: 24,
  glowIntensity: 0.8,
  glowColor: "252 60 62",
  colors: ["#a78bfa", "#8b5cf6", "#6366f1"],
};

export default function MissionSection() {
  return (
    <SectionShell id="mission" label="Mission">
      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-7">
          <SplitText
            tag="h2"
            text="Machines should extend human hands — precisely, safely, honestly."
            splitType="words"
            textAlign="left"
            from={{ opacity: 0, y: 32 }}
            to={{ opacity: 1, y: 0 }}
            className="font-display text-[clamp(1.9rem,3.3vw,3.1rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
          />
          <FadeContent duration={0.9} className="mt-8 max-w-xl">
            <p className="font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
              My target is simple to say and hard to do: build local
              engineering capability that survives contact with the real
              world. Every project on this site is measured against three
              commitments.
            </p>
          </FadeContent>
          <FadeContent delay={0.15} duration={0.9} className="mt-8">
            <p className="font-sinhala text-lg text-ink md:text-xl">
              යන්ත්‍ර · බුද්ධිය · නිර්මාණය
            </p>
            <p className="mt-1.5 text-xs text-ink-soft">
              Machines · Intelligence · Creation
            </p>
          </FadeContent>
        </div>

        <div className="md:col-span-5">
          <div className="flex flex-col gap-4">
            {TARGETS.map((target, index) => (
              <FadeContent
                key={target.name}
                delay={index * 0.12}
                duration={0.8}
              >
                <BorderGlow {...GLOW_PROPS}>
                  <GlowCard>
                    <div className="relative p-6">
                      <div className="flex items-baseline gap-4">
                        <span className="text-sm font-semibold tabular-nums text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-xl font-medium tracking-tight text-ink">
                          {target.name}
                        </h3>
                      </div>
                      <p className="mt-3 font-body text-sm leading-relaxed text-ink-soft">
                        {target.desc}
                      </p>
                    </div>
                  </GlowCard>
                </BorderGlow>
              </FadeContent>
            ))}
          </div>
          <FadeContent
            delay={0.35}
            duration={0.9}
            className="mt-8 flex items-end justify-between gap-4"
          >
            <p className="text-xs text-ink-soft">Signed,</p>
            <p className="font-script text-3xl leading-none text-ink md:text-4xl">
              Prasad M.
            </p>
          </FadeContent>
        </div>
      </div>
    </SectionShell>
  );
}
