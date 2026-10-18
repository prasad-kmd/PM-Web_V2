import { ArrowLeft, Calculator, FileText, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/config";

/**
 * `/tools` — "coming soon", and honest about it.
 *
 * This page exists because four navigation surfaces linked to it and no route
 * was ever built: the floating navbar, the sidebar rail, the mobile dock and the
 * footer, all pointing at a 404. It also quietly fixes the mobile dock's active
 * state, which had `startsWith("/tools")` logic that could never match anything.
 *
 * Adapted from React Bits Pro `app-ui/empty-state-*` — the centred icon,
 * headline and single action. What is deliberately **not** here:
 *
 * - no e-mail capture (there is no mailing list, and collecting addresses with
 *   nowhere to put them is worse than asking for nothing);
 * - no countdown or "launching soon" theatre — a date would be invented, and
 *   guesses read as promises.
 *
 * `robots: { index: false, follow: true }`: a thin placeholder should not rank,
 * but the links pointing here should still pass signal. It is excluded from
 * `app/sitemap.ts` to match.
 */

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Engineering tools for this site, in progress: an invoice generator and supporting calculators.",
  robots: { index: false, follow: true },
};

const PLANNED = [
  {
    icon: FileText,
    title: "Professional invoice generator",
    body: "The tool from the previous site: structured invoices with a line-item breakdown, tax, and a print-ready export.",
  },
  {
    icon: Calculator,
    title: "Engineering calculators",
    body: "The ones reached for often enough to be worth automating — shafts, beams, fits, and the unit conversions that keep catching people out.",
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-8 lg:py-24">
      <span
        className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/60 text-ink-soft"
        aria-hidden
      >
        <Wrench className="size-6" strokeWidth={1.7} />
      </span>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Tools — coming soon
      </h1>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
        This corner of the site is still being built. Rather than a page of
        disabled buttons, here is what is actually planned.
      </p>

      <ul className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2">
        {PLANNED.map((tool) => (
          <li
            key={tool.title}
            className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm"
          >
            <tool.icon className="size-5 text-ink-soft" aria-hidden />
            <p className="mt-3 font-medium text-ink">{tool.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {tool.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          See finished work instead
        </Link>
        {/* A mailto rather than a form: suggestions are a conversation, and
            `siteConfig` already holds the address. */}
        <a
          href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Tool suggestion")}`}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Suggest something
        </a>
      </div>
    </div>
  );
}
