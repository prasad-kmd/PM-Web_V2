/**
 * Shared project data for the /portfolio variants — and for the final page
 * once a direction is chosen. Copy is apostrophe-free per project lint rules.
 */

export type ProjectStatus =
  | "Commissioned"
  | "Documented"
  | "In build"
  | "On the board";

export interface ProjectSpec {
  label: string;
  value: string;
}

export interface PortfolioProject {
  slug: string;
  ref: string;
  name: string;
  discipline: string;
  year: number;
  status: ProjectStatus;
  summary: string;
  image?: { src: string; alt: string };
  specs: ProjectSpec[];
  tags: string[];
}

export const PROJECTS: PortfolioProject[] = [
  {
    slug: "planetary-gearbox",
    ref: "PM-001",
    name: "Planetary gearbox, rice-mill drive",
    discipline: "Mechanisms",
    year: 2026,
    status: "Documented",
    summary:
      "Two-stage planetary reduction for a Kandy rice-mill gearbox rebuild. Drawn for manufacture with a full tolerance stack, cut on the shop CNC and run-tested under load before handover.",
    image: {
      src: "/img/hero/cad-gearbox.jpg",
      alt: "CAD wireframe of a planetary gearbox mechanism",
    },
    specs: [
      { label: "Ratio", value: "6.7 : 1" },
      { label: "Stages", value: "2" },
      { label: "Gearing", value: "20MnCr5" },
      { label: "Tolerance", value: "±0.02 mm" },
    ],
    tags: ["CAD", "Planetary", "Fatigue"],
  },
  {
    slug: "six-axis-research-arm",
    ref: "PM-002",
    name: "Six-axis arm, research cell",
    discipline: "Robotics",
    year: 2025,
    status: "Commissioned",
    summary:
      "Compact six-axis manipulator for a university research cell. Trajectory planning in ROS 2, harmonic drives at the shoulder and elbow, custom end-of-arm tooling for pick-and-place cycles.",
    image: {
      src: "/img/hero/robot-arm.jpg",
      alt: "Six-axis industrial robot arm welding an engine block on a conveyor",
    },
    specs: [
      { label: "Payload", value: "3 kg" },
      { label: "Reach", value: "720 mm" },
      { label: "Repeatability", value: "±0.1 mm" },
      { label: "Control", value: "ROS 2 + MoveIt" },
    ],
    tags: ["ROS 2", "Kinematics", "Tooling"],
  },
  {
    slug: "foc-motor-driver",
    ref: "PM-003",
    name: "Field-oriented motor driver",
    discipline: "Embedded",
    year: 2025,
    status: "Documented",
    summary:
      "Four-layer controller PCB driving BLDC motors with field-oriented control. STM32G4 at the core, 12-bit absolute encoders, current loops tuned on the bench with a dyno fixture.",
    image: {
      src: "/img/hero/pcb-macro.jpg",
      alt: "Macro photograph of a microcontroller circuit board",
    },
    specs: [
      { label: "MCU", value: "STM32G4" },
      { label: "PWM", value: "40 kHz" },
      { label: "Encoder", value: "12-bit abs" },
      { label: "Layers", value: "4" },
    ],
    tags: ["STM32", "FOC", "PCB"],
  },
  {
    slug: "quadrotor-autonomy",
    ref: "PM-004",
    name: "Autonomy stack, quadrotor",
    discipline: "Autonomy",
    year: 2024,
    status: "In build",
    summary:
      "450 mm quadrotor holding position in Kandy valley wind. PX4 flight stack, custom telemetry bridge and a ground station that logs every flight for post-run tuning.",
    image: {
      src: "/img/hero/drone-motor.jpg",
      alt: "Carbon fiber drone with brushless motors on a workbench",
    },
    specs: [
      { label: "Airframe", value: "450 mm" },
      { label: "Flight stack", value: "PX4" },
      { label: "Telemetry", value: "2.4 GHz" },
      { label: "Loiter", value: "±0.4 m" },
    ],
    tags: ["PX4", "BLDC", "Telemetry"],
  },
  {
    slug: "lathe-cnc-retrofit",
    ref: "PM-005",
    name: "CNC retrofit, bench lathe",
    discipline: "Fabrication",
    year: 2024,
    status: "Commissioned",
    image: {
      src: "/img/projects/cnc-lathe.jpg",
      alt: "Bench lathe retrofitted with CNC stepper motors and a custom control box",
    },
    summary:
      "Import bench lathe rebuilt into a two-axis CNC machine. New ballscrews, NEMA 23 servos, a spindle control board and a home-switch scheme that survived six months of chip making.",
    specs: [
      { label: "Travel", value: "240 mm" },
      { label: "Servos", value: "2 × NEMA 23" },
      { label: "Spindle", value: "1600 rpm" },
      { label: "Controller", value: "GRBL HAL" },
    ],
    tags: ["Ballscrew", "Servo", "Wiring"],
  },
  {
    slug: "compliant-gripper",
    ref: "PM-006",
    name: "Compliant gripper, print-in-place",
    discipline: "Mechanisms",
    year: 2023,
    status: "On the board",
    image: {
      src: "/img/projects/compliant-gripper.jpg",
      alt: "Print-in-place compliant gripper with three flexure fingers on a test rig",
    },
    summary:
      "Print-in-place flexure gripper for FDM tooling. PA12 fingers, zero fasteners, targeted at fifty thousand cycles on the test rig before the drawing set is published.",
    specs: [
      { label: "Flexure", value: "PA12" },
      { label: "Fingers", value: "3" },
      { label: "Cycles", value: "50 k target" },
      { label: "Mass", value: "84 g" },
    ],
    tags: ["Flexure", "FDM", "Tooling"],
  },
];

export const DISCIPLINES: string[] = [
  ...new Set(PROJECTS.map((project) => project.discipline)),
];

export const STAGE_ORDER = ["Design", "Build", "Commission", "Document"] as const;

export type StageState = "done" | "current" | "pending";

/** Stage progress implied by a project status, in STAGE_ORDER sequence. */
export function stagesFor(status: ProjectStatus): StageState[] {
  switch (status) {
    case "Documented":
      return ["done", "done", "done", "done"];
    case "Commissioned":
      return ["done", "done", "done", "pending"];
    case "In build":
      return ["done", "current", "pending", "pending"];
    case "On the board":
      return ["current", "pending", "pending", "pending"];
  }
}
