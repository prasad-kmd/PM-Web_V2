import type { ReactNode } from "react";

interface SectionShellProps {
  id: string;
  label: string;
  children: ReactNode;
}

/**
 * Chapter frame: one viewport tall on desktop, where a scroll snaps
 * chapter-to-chapter. On mobile it stacks, grows to fit its content and
 * scrolls normally. The pinned photograph behind it is owned by
 * <SectionBackdrops />; the shell stays transparent over it.
 */
export default function SectionShell({ id, label, children }: SectionShellProps) {
  return (
    <section
      id={id}
      aria-label={label}
      className="snap-section relative min-h-dvh md:h-dvh md:overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-16 md:h-full md:justify-center md:px-12 md:py-12">
        <p className="mb-8 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft md:mb-10">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {label}
        </p>
        {children}
      </div>
    </section>
  );
}
