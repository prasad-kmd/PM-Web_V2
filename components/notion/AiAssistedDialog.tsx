"use client";

import {
  AlertTriangle,
  Check,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";

/**
 * The "AI assisted" badge and the disclosure it opens.
 *
 * The badge is a real `<button>` (not a decorative span) so the disclosure is
 * reachable by keyboard and announced to assistive tech. The popup is a coss
 * `Dialog` — a blocking, focus-trapped overlay, which suits a disclosure the
 * reader is explicitly asking for.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * DISCLOSURE COPY — REVIEW BEFORE SHIPPING.
 *
 * This is the text readers see. It describes AI assistance in general terms so
 * it stays true for any page carrying the badge. Adjust the two lists below to
 * match how you actually work; everything else is structure.
 * ────────────────────────────────────────────────────────────────────────── */
const AI_DISCLOSURE = {
  usedFor: [
    "Drafting and restructuring sections",
    "Cleaning up code samples, tables and diagrams",
    "Copy-editing for clarity and consistency",
    "Summarising source material before rewriting it",
  ],
  humanKept: [
    "The technical decisions and the conclusions drawn from them",
    "Every measurement, figure and specification quoted",
    "The final read-through before publishing",
  ],
} as const;

type AiAssistedDialogProps = {
  /** Page title, echoed in the dialog so readers know which page is covered. */
  contentTitle: string;
};

function Section({
  icon,
  heading,
  items,
  tone = "default",
}: {
  icon: React.ReactNode;
  heading: string;
  items: readonly string[];
  tone?: "default" | "warning";
}) {
  return (
    <section className="grid gap-2.5">
      <h3
        className={`flex items-center gap-2 text-xs font-semibold tracking-wide uppercase ${
          tone === "warning" ? "text-amber-600 dark:text-amber-500" : "text-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`grid size-5 place-items-center rounded-md ${
            tone === "warning"
              ? "bg-amber-500/12 text-amber-600 dark:text-amber-500"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </span>
        {heading}
      </h3>
      <ul className="grid gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-6 text-ink-soft"
          >
            <span
              aria-hidden="true"
              className="mt-2 size-1 shrink-0 rounded-full bg-border"
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AiAssistedDialog({ contentTitle }: AiAssistedDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/8 px-2.5 py-1 font-mono text-[10px] tracking-wider text-primary uppercase transition-colors hover:border-primary/60 hover:bg-primary/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="What does AI assisted mean on this page?"
      >
        <Sparkles aria-hidden="true" className="size-3" />
        AI assisted
      </DialogTrigger>

      <DialogPopup className="sm:max-w-xl">
        <DialogHeader className="pe-12">
          <span
            aria-hidden="true"
            className="mb-1 grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <Sparkles className="size-4.5" />
          </span>
          <DialogTitle>About AI assistance</DialogTitle>
          <DialogDescription>
            How AI tools were involved in producing “{contentTitle}”, and what
            that means for you as a reader.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="grid gap-6">
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-ink-soft">
            This page carries the{" "}
            <span className="font-medium text-ink">AI assisted</span> badge
            because AI tools were used somewhere in producing it. The badge is a
            disclosure, not a warning; it tells you where to read a little more
            carefully, not that the page is unreliable.
          </p>

          <Section
            icon={<PenLine className="size-3" />}
            heading="AI was used for"
            items={AI_DISCLOSURE.usedFor}
          />

          <Section
            icon={<ShieldCheck className="size-3" />}
            heading="Kept human"
            items={AI_DISCLOSURE.humanKept}
          />

          <section className="grid gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/6 p-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-500">
              <AlertTriangle
                aria-hidden="true"
                className="size-3.5 text-amber-600 dark:text-amber-500"
              />
              Read with care
            </h3>
            <p className="text-sm leading-6 text-ink-soft">
              Language models can state something incorrect with complete
              confidence, and they are weakest exactly where technical writing
              is most useful like precise numbers, version-specific behaviour and
              citations. Verify anything you are about to build on and treat a
              claim without a source as unverified.
            </p>
          </section>

          <section className="flex items-start gap-2.5 rounded-xl border border-border p-4">
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <p className="text-sm leading-6 text-ink-soft">
              Spotted an error?{" "}
              <a
                href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(
                  `Correction: ${contentTitle}`,
                )}`}
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Send a correction
              </a>{" "}
              - fixes can be credited and published.
            </p>
          </section>
        </DialogPanel>

        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline" />}>
            Got it
          </DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
