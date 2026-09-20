import FadeContent from "@/components/reactbits/FadeContent";
import SplitText from "@/components/reactbits/SplitText";
import SectionShell from "@/components/home/SectionShell";

const TOOLGROUPS = [
  {
    code: "T-01",
    name: "CAD & Design",
    tools: ["SolidWorks", "Fusion 360", "AutoCAD", "Onshape", "FreeCAD"],
  },
  {
    code: "T-02",
    name: "Simulation & Control",
    tools: ["MATLAB", "Simulink", "ANSYS", "LTspice", "Python / NumPy", "OpenCV"],
  },
  {
    code: "T-03",
    name: "Embedded & Electronics",
    tools: ["STM32CubeIDE", "Arduino", "KiCad", "Altium Designer", "FreeRTOS", "ROS 2"],
  },
  {
    code: "T-04",
    name: "Fabrication",
    tools: ["CNC Milling", "FDM / SLA Printing", "Laser Cutting", "Lathe Work", "Solder Bench"],
  },
] as const;

export default function ToolsSection() {
  return (
    <SectionShell id="tools" label="SEC.04 // TOOLCHAIN">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitText
          tag="h2"
          text="INSTRUMENTS OF THE TRADE"
          splitType="words"
          textAlign="left"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          className="font-display text-[clamp(2.2rem,4.4vw,4.2rem)] uppercase leading-[0.95] tracking-[-0.02em] text-ink"
        />
        <p className="max-w-sm font-body text-sm leading-relaxed text-ink-soft">
          The software and machines behind every drawing and build published
          here. Tools are chosen for repeatability, not fashion.
        </p>
      </div>

      <div className="mt-10 grid gap-px border-2 border-ink bg-ink/25 md:mt-12 md:grid-cols-2">
        {TOOLGROUPS.map((group, index) => (
          <FadeContent key={group.code} delay={index * 0.1} duration={0.8} className="h-full">
            <div className="flex h-full flex-col bg-card p-6 md:p-7">
              <p className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
                <span className="text-hazard">{group.code}</span>
                <span>CALIBRATED</span>
              </p>
              <h3 className="mt-3 font-display text-lg uppercase tracking-tight text-ink md:text-xl">
                {group.name}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.tools.map((tool) => (
                  <li
                    key={tool}
                    className="border border-ink/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition-colors duration-200 hover:border-hazard hover:text-hazard"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </FadeContent>
        ))}
      </div>
    </SectionShell>
  );
}
