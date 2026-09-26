import FadeContent from "@/components/reactbits/FadeContent";
import SplitText from "@/components/reactbits/SplitText";
import SectionShell from "@/components/home/SectionShell";

const TOOLGROUPS = [
  {
    name: "CAD & Design",
    tools: ["SolidWorks", "Fusion 360", "AutoCAD", "Onshape", "FreeCAD"],
  },
  {
    name: "Simulation & Control",
    tools: ["MATLAB", "Simulink", "ANSYS", "LTspice", "Python / NumPy", "OpenCV"],
  },
  {
    name: "Embedded & Electronics",
    tools: ["STM32CubeIDE", "Arduino", "KiCad", "Altium Designer", "FreeRTOS", "ROS 2"],
  },
  {
    name: "Fabrication",
    tools: ["CNC Milling", "FDM / SLA Printing", "Laser Cutting", "Lathe Work", "Solder Bench"],
  },
] as const;

export default function ToolsSection() {
  return (
    <SectionShell id="tools" label="Toolchain">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitText
          tag="h2"
          text="Instruments of the trade"
          splitType="words"
          textAlign="left"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          className="font-display text-[clamp(2rem,4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink"
        />
        <p className="max-w-sm font-body text-sm leading-relaxed text-ink-soft md:text-[15px]">
          The software and machines behind every drawing and build published
          here. Tools are chosen for repeatability, not fashion.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2">
        {TOOLGROUPS.map((group, index) => (
          <FadeContent
            key={group.name}
            delay={index * 0.1}
            duration={0.8}
            className="h-full"
          >
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                  {group.name}
                </h3>
                <span className="text-xs font-medium tabular-nums text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
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
