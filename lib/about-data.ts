import { EDUCATION, EXPERIENCE } from "@/lib/profile-data";

/**
 * Content for /about. The CV records are derived from lib/profile-data.ts —
 * the same source /portfolio reads, never a second copy of the CV.
 */

/** About-only media; swap freely without touching the home or portfolio art. */
export const ABOUT_MEDIA = {
  portrait: "/img/hero/robot-arm.jpg",
  portraitAlt: "Portrait stand-in — six-axis robot arm at work",
  /** The triptych: one set of frames, three different starting orders. */
  gallery: [
    { image: "/img/hero/robot-arm.jpg" },
    { image: "/img/hero/pcb-macro.jpg" },
    { image: "/img/hero/cad-gearbox.jpg" },
  ],
} as const;

/** Stable module-scope arrays: a new array each render would rebuild the WebGL engine. */
export const ABOUT_SLIDER_ORDERS = [
  [ABOUT_MEDIA.gallery[0], ABOUT_MEDIA.gallery[1], ABOUT_MEDIA.gallery[2]],
  [ABOUT_MEDIA.gallery[1], ABOUT_MEDIA.gallery[2], ABOUT_MEDIA.gallery[0]],
  [ABOUT_MEDIA.gallery[2], ABOUT_MEDIA.gallery[0], ABOUT_MEDIA.gallery[1]],
] as const;

export const ABOUT_PRINCIPLES = [
  {
    id: "mission",
    label: "My mission",
    title: "Make useful things work.",
    description:
      "I want to turn engineering ideas into practical systems: mechanisms that move reliably, electronics that respond predictably, and software that makes the whole system easier to use.",
    details: [
      "Practical automation",
      "Reliable mechanisms",
      "Clear documentation",
    ],
    footer: "Purpose before complexity",
  },
  {
    id: "approach",
    label: "My approach",
    title: "Understand. Model. Build.",
    description:
      "Start with the requirements and constraints. Sketch and model the design, test the uncertain parts, then refine the prototype. Keep drawings, code and observations together so the next iteration has a solid starting point.",
    details: [
      "Define the constraints",
      "Prototype and test",
      "Refine and document",
    ],
    footer: "Small iterations, considered decisions",
  },
  {
    id: "expertise",
    label: "My expertise",
    title: "Across the engineering stack.",
    description:
      "My foundation is in mechanical engineering and technical draftsmanship. Mechatronics brings electronics, control and computing into that work, with automation and robotics as the areas I want to keep developing.",
    details: [
      "CAD and technical drawing",
      "Electronics and control",
      "Embedded and web software",
    ],
    footer: "Mechanics, electronics and computing",
  },
] as const;

export interface AboutMilestone {
  id: string;
  kind: "Education" | "Experience";
  title: string;
  organization: string;
  location: string;
  period: string;
  year: number;
  order: number;
  current: boolean;
  summary: string;
  points: readonly string[];
}

/**
 * Oldest record first, newest last. Completed entries ascend by sortYear, the
 * 2024 posts follow their recorded months, and the degree in progress closes
 * the stack. No dates or qualifications are invented.
 */
export const ABOUT_MILESTONES: AboutMilestone[] = [
  ...EDUCATION.map((entry) => ({
    id: `education-${entry.institution}`,
    kind: "Education" as const,
    title: entry.credential,
    organization: entry.institution,
    location: entry.location,
    period: entry.period,
    year: entry.sortYear,
    order: entry.period === "Reading" ? 13 : 0,
    current: entry.period === "Reading",
    summary: entry.note,
    points: [] as readonly string[],
  })),
  ...EXPERIENCE.map((entry) => ({
    id: `experience-${entry.org}`,
    kind: "Experience" as const,
    title: entry.role,
    organization: entry.org,
    location: entry.location,
    period: entry.period,
    year: entry.sortYear,
    order: entry.period.includes("(Jun")
      ? 6
      : entry.period.includes("(Mar")
        ? 3
        : 1,
    current: false,
    summary: entry.summary,
    points: entry.points as readonly string[],
  })),
].sort(
  (left, right) =>
    Number(left.current) - Number(right.current) ||
    left.year - right.year ||
    left.order - right.order,
);

export interface AboutTool {
  name: string;
  use: string;
  /** Filename in /public/logos/tools; absent means an honest category icon. */
  icon?: string;
  fallback?: "cad" | "automation" | "factory";
}

/** Engineering bench first — that is the primary trade. */
export const ENGINEERING_TOOLS: readonly AboutTool[] = [
  { name: "MATLAB", use: "Modelling & control", icon: "matlab.svg" },
  { name: "Simulink", use: "Control simulation", fallback: "automation" },
  { name: "SOLIDWORKS", use: "Mechanical CAD", icon: "dassault-systemes.svg" },
  { name: "AutoCAD", use: "Technical drawing", icon: "autocad.svg" },
  { name: "Fusion 360", use: "CAD / CAM", icon: "fusion-360.svg" },
  { name: "Proteus", use: "Circuit simulation", icon: "proteus.svg" },
  { name: "KiCad", use: "PCB design", icon: "kicad.svg" },
  { name: "Arduino", use: "Embedded prototypes", icon: "arduino.svg" },
  { name: "SIMATIC Manager", use: "Siemens automation", icon: "siemens.svg" },
  { name: "STEP 7", use: "PLC programming", icon: "siemens.svg" },
  { name: "Siemens TIA", use: "PLC / HMI integration", icon: "siemens.svg" },
  {
    name: "Automation Studio",
    use: "Famic Technologies",
    fallback: "automation",
  },
  { name: "Factory I/O", use: "Virtual commissioning", fallback: "factory" },
  { name: "ANSYS", use: "Engineering simulation", icon: "ansys.svg" },
  { name: "ROS 2", use: "Robotics software", icon: "ros.svg" },
  { name: "LabVIEW", use: "Instrumentation", icon: "labview.svg" },
  { name: "ESP32", use: "Wireless firmware", icon: "espressif.svg" },
  { name: "Raspberry Pi", use: "Edge vision rigs", icon: "raspberry-pi.svg" },
];

export const OTHER_TOOLS: readonly AboutTool[] = [
  { name: "Next.js", use: "Web applications", icon: "nextjs.svg" },
  { name: "React", use: "Interfaces", icon: "react.svg" },
  { name: "TypeScript", use: "Typed software", icon: "typescript.svg" },
  { name: "Tailwind CSS", use: "UI styling", icon: "tailwindcss.svg" },
  { name: "Node.js", use: "Web tooling", icon: "nodejs.svg" },
  { name: "Python", use: "Scripting & analysis", icon: "python.svg" },
  { name: "Git", use: "Version control", icon: "git.svg" },
  { name: "GitHub", use: "Code collaboration", icon: "github.svg" },
  { name: "VS Code", use: "Code editor", icon: "visual-studio-code.svg" },
  { name: "Blender", use: "3D & visualisation", icon: "blender.svg" },
  { name: "Inkscape", use: "Vector graphics", icon: "inkscape.svg" },
  { name: "GIMP", use: "Image editing", icon: "gimp.svg" },
  {
    name: "Microsoft Office",
    use: "Documents & analysis",
    icon: "microsoft-office.svg",
  },
  { name: "Notion", use: "Working notes", icon: "notion.svg" },
  { name: "Figma", use: "Interface design", icon: "figma.svg" },
  { name: "Docker", use: "Development environments", icon: "docker.svg" },
];

export const TOOL_ICON_BASE = "/logos/tools";

/** Marks used by the tilted-tiles backdrop behind the stack chapter. */
export const ABOUT_TILE_IMAGES = [
  "matlab",
  "kicad",
  "arduino",
  "fusion-360",
  "autocad",
  "siemens",
  "ansys",
  "proteus",
  "ros",
  "python",
  "react",
  "blender",
].map((name) => `${TOOL_ICON_BASE}/${name}.svg`);
