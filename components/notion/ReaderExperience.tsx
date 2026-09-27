"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";

type ReaderFont = "sans" | "serif";
type ReaderStyle = CSSProperties & {
  "--reader-font": string;
  "--reader-size": string;
  "--reader-code-size": string;
  "--reader-leading": number;
};

export function ReaderExperience({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [font, setFont] = useState<ReaderFont>("sans");
  const [lineHeight, setLineHeight] = useState(1.8);
  const [highContrast, setHighContrast] = useState(false);

  const style: ReaderStyle = {
    "--reader-font":
      font === "serif"
        ? "var(--font-anthropic-serif-text)"
        : "var(--font-noto-sans-display)",
    "--reader-size": `${(1.125 * scale).toFixed(3)}rem`,
    "--reader-code-size": `${(0.875 * scale).toFixed(3)}rem`,
    "--reader-leading": lineHeight,
  };

  const reset = () => {
    setScale(1);
    setFont("sans");
    setLineHeight(1.8);
    setHighContrast(false);
  };

  return (
    <section className="mt-7" aria-label="Reading options">
      <div className="mb-3 rounded-lg border border-border bg-card">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="reader-options-panel"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="inline-flex items-center gap-2">
            <Accessibility aria-hidden="true" className="size-4 text-primary" />
            Reading options
          </span>
          <span aria-hidden="true" className="font-mono text-xs text-ink-soft">
            {open ? "−" : "+"}
          </span>
        </button>
        <div
          id="reader-options-panel"
          hidden={!open}
          className={`${open ? "grid" : "hidden"} gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4`}
        >
          <fieldset>
            <legend className="text-xs font-medium text-ink">Text size</legend>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease text size"
                disabled={scale <= 0.85}
                onClick={() =>
                  setScale((value) =>
                    Math.max(0.85, Number((value - 0.1).toFixed(2))),
                  )
                }
                className="inline-flex size-9 items-center justify-center rounded-md border border-border text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <output
                aria-live="polite"
                className="min-w-12 text-center font-mono text-xs tabular-nums text-ink-soft"
              >
                {Math.round(scale * 100)}%
              </output>
              <button
                type="button"
                aria-label="Increase text size"
                disabled={scale >= 1.5}
                onClick={() =>
                  setScale((value) =>
                    Math.min(1.5, Number((value + 0.1).toFixed(2))),
                  )
                }
                className="inline-flex size-9 items-center justify-center rounded-md border border-border text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-ink">
              Reading font
            </legend>
            <div
              className="mt-2 flex gap-2"
              role="group"
              aria-label="Choose a reading font"
            >
              {(["sans", "serif"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={font === option}
                  onClick={() => setFont(option)}
                  className={`min-h-9 rounded-md border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${font === option ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-ink-soft hover:bg-muted"}`}
                >
                  {option === "sans" ? "Sans" : "Serif"}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-ink">
              Line spacing
            </legend>
            <div
              className="mt-2 flex gap-2"
              role="group"
              aria-label="Choose line spacing"
            >
              {[1.65, 1.8, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={lineHeight === value}
                  onClick={() => setLineHeight(value)}
                  className={`min-h-9 rounded-md border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${lineHeight === value ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-ink-soft hover:bg-muted"}`}
                >
                  {value === 1.65
                    ? "Compact"
                    : value === 1.8
                      ? "Relaxed"
                      : "Wide"}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col justify-between gap-3">
            <label className="inline-flex min-h-9 items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(event) => setHighContrast(event.target.checked)}
                className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              Higher contrast
            </label>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md px-2 text-xs text-ink-soft transition-colors hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Reset reading options
            </button>
          </div>
        </div>
      </div>

      <div
        className={`notion-content reader-content min-w-0 rounded-xl border border-border bg-card p-5 md:p-8 ${highContrast ? "reader-high-contrast" : ""}`}
        style={style}
      >
        {children}
      </div>
    </section>
  );
}
