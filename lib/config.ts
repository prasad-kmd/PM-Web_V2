import { version } from "../package.json";

/**
 * Displayed interface revision.
 *
 * Sourced from `package.json` so the badge in the sidebar can never drift from
 * the released version (v2.8.0 shipped with a stale `v2.7.5` literal; the
 * lesson was already learned the expensive way once).
 *
 * Trade-off: this module is imported by client components, so the bundler needs
 * the `version` field in the client graph. Only that field is referenced and
 * JSON modules are tree-shaken, but if it ever becomes a bundle concern the
 * escape hatch is a build-time constant injected from `next.config.mjs`.
 */
const revision = `v${version}`;

export const siteConfig = {
  name: "PrasadM",
  tagline: "Engineering Portfolio",
  role: "Mechanical + Mechatronics Engineer",
  location: "Kandy, Sri Lanka",
  coordinates: "7.2906° N, 80.6337° E",
  timezone: "UTC +05:30",
  revision,
  description:
    "Working archive of a mechanical + mechatronics engineer: robot builds, mechanism drawings, firmware notes, tutorials and the lessons learned between the CAD viewport and the workbench.",
  email: "hello@prasadk.xyz",
  socialLinks: {
    github: "https://github.com/prasad-kmd",
    twitter: "https://x.com/prasad_kmd",
    linkedin: "https://www.linkedin.com/in/prasad-kmd",
  },
} as const;
