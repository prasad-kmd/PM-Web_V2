/**
 * Personal profile data for the /portfolio variants.
 * Content follows the real record from the previous site
 * (PMEngineerLK-NextJS /portfolio) — edit freely in this file only,
 * no page edits needed. Copy is apostrophe-free per project lint rules.
 */

export interface ProfileStat {
  label: string;
  value: string;
}

export interface ProfileDetail {
  label: string;
  value: string;
}

export interface EducationEntry {
  credential: string;
  institution: string;
  location: string;
  period: string;
  sortYear: number;
  note: string;
}

export interface ExperienceEntry {
  role: string;
  org: string;
  location: string;
  period: string;
  sortYear: number;
  summary: string;
  points: string[];
}

export interface LanguageSkill {
  name: string;
  level: string;
}

export interface Interest {
  name: string;
  blurb: string;
}

export const PROFILE = {
  name: "Prasad M.",
  firstName: "Prasad",
  lastName: "Madhuranga",
  role: "Mechanical + Mechatronics Engineer",
  statusLine:
    "BSc (Hons) Mechatronics — reading at The Open University of Sri Lanka",
  tagline: "Machines, firmware and the seam between them.",
  location: "Kandy, Sri Lanka",
  timezone: "UTC +05:30",
  availability: "Open to collaboration",
  summary: [
    "Highly motivated and results-oriented engineer with a strong foundation in mechanical engineering principles and a passion for automation and robotics. A quick learner with the ability to grasp complex concepts and apply them effectively in practical scenarios.",
    "This page is the working record — who I am, what I studied, where I served and what I built. Every project entry links back to the archive.",
  ],
} as const;

export const PROFILE_STATS: ProfileStat[] = [
  { label: "Years in the field", value: "04+" },
  { label: "Projects logged", value: "06" },
  { label: "Disciplines", value: "05" },
  { label: "Tools in the chain", value: "20+" },
];

export const PERSONAL_DETAILS: ProfileDetail[] = [
  { label: "Name", value: `${PROFILE.firstName} ${PROFILE.lastName}` },
  { label: "Role", value: PROFILE.role },
  { label: "Base", value: PROFILE.location },
  { label: "Timezone", value: PROFILE.timezone },
  { label: "Availability", value: PROFILE.availability },
];

export const EDUCATION: EducationEntry[] = [
  {
    credential: "BSc (Hons) in Mechatronics Engineering",
    institution: "The Open University of Sri Lanka",
    location: "Sri Lanka",
    period: "Reading",
    sortYear: 2024,
    note: "Undergraduate programme across mechanics, electronics, control and computing.",
  },
  {
    credential: "National Certificate in Engineering Draftsmanship (NCED)",
    institution: "Technical College, Pathadumbara",
    location: "Kandy, Sri Lanka",
    period: "Completed",
    sortYear: 2021,
    note: "National certificate in engineering draftsmanship — technical drawing to construction-document standard.",
  },
  {
    credential: "G.C.E. Advanced Level",
    institution: "Sri Rahula College",
    location: "Katugasthota, Sri Lanka",
    period: "Completed",
    sortYear: 2019,
    note: "Secondary education completed with the Advanced Level examinations.",
  },
];

export const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Trainee Draughtsperson",
    org: "Department of Engineering Services",
    location: "Central Province Council, Kandy",
    period: "2024 (Jan — Jun)",
    sortYear: 2024,
    summary:
      "Detailed technical drawing for public building works at the provincial engineering office.",
    points: [
      "Created detailed technical drawings and schematics for building construction projects using CAD software.",
      "Collaborated with engineers to ensure designs met project requirements and standards.",
      "Assisted in site inspections and field verification to ensure accuracy of drawings.",
    ],
  },
  {
    role: "Customer Service Assistant",
    org: "People's Bank",
    location: "Mutwal, Sri Lanka",
    period: "2024 (Jun — Oct)",
    sortYear: 2024,
    summary: "Frontline customer service at a state bank branch.",
    points: [
      "Handling customer inquiries, providing information about products and services, and resolving issues.",
    ],
  },
  {
    role: "Cashier",
    org: "Hemantha Glass Center",
    location: "Anamaduwa, Sri Lanka",
    period: "2022 (Mar — May)",
    sortYear: 2022,
    summary: "Counter service at a provincial glass and glazing supplier.",
    points: [
      "Handling customer inquiries, providing information about products and services, and processing sales.",
    ],
  },
];

export const LANGUAGES: LanguageSkill[] = [
  { name: "Sinhala", level: "Native" },
  { name: "English", level: "Professional" },
];

export const INTERESTS: Interest[] = [
  {
    name: "Bio-Inspired Robotics",
    blurb: "Mechanisms that borrow from muscle and bone.",
  },
  {
    name: "Autonomous Navigation",
    blurb: "Machines that hold a path without a hand on them.",
  },
  {
    name: "Renewable Energy Systems",
    blurb: "Harvest, store, convert — engineered honestly.",
  },
  {
    name: "Smart Materials",
    blurb: "Alloys and polymers that answer a stimulus.",
  },
  {
    name: "Artificial Intelligence & Machine Vision",
    blurb: "Cameras as sensors, models as judgement.",
  },
  {
    name: "Mobile Robotics",
    blurb: "Wheels, legs and everything between.",
  },
];
