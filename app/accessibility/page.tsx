import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, Keyboard, Type } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Accessibility and reading options available across PrasadM content.",
};

const SUPPORTS = [
  {
    icon: Type,
    title: "Adjust the reading view",
    description:
      "On long-form content, use Reading options to enlarge text, switch between sans-serif and serif, change line spacing, or enable higher contrast.",
  },
  {
    icon: Keyboard,
    title: "Use the keyboard",
    description:
      "Links, buttons, the table of contents, and reading controls can be reached and activated with a keyboard. Focus indicators remain visible while navigating.",
  },
  {
    icon: Accessibility,
    title: "Respect motion preferences",
    description:
      "Page scrolling and section navigation honor your device's reduced-motion setting where motion can be adjusted.",
  },
] as const;

export default function AccessibilityPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 md:px-12 md:pt-16">
      <header className="max-w-3xl border-b border-border pb-8 md:pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          Using this site
        </p>
        <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-ink md:text-6xl">
          Accessibility
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
          I want the engineering notes and project archive to be usable with
          different reading needs and input methods. These are the controls
          currently available.
        </p>
      </header>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {SUPPORTS.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            className="grid gap-4 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-5"
          >
            <Icon
              aria-hidden="true"
              className="mt-1 size-5 text-primary"
              strokeWidth={1.7}
            />
            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-7 max-w-2xl text-sm leading-6 text-ink-soft">
        Accessibility is an ongoing effort, and behavior can vary by browser and
        assistive technology. If a page or control is difficult to use, please{" "}
        <Link
          href="/contact"
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          send a note
        </Link>{" "}
        so I can investigate.
      </p>
    </main>
  );
}
