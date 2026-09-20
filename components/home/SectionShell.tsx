import type { ReactNode } from "react";

interface SectionShellProps {
  id: string;
  label: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
}

/**
 * Full-viewport chapter with a pinned (non-scrolling) photo background under
 * a paper wash so carbon ink stays legible on every substrate.
 */
export default function SectionShell({
  id,
  label,
  image,
  imageAlt,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      aria-label={label}
      className="snap-section relative min-h-dvh md:h-dvh md:overflow-hidden"
    >
      <div
        role="img"
        aria-label={imageAlt}
        className="fixed-bg absolute inset-0"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="paper-wash absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 py-14 md:px-12">
        <p className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft md:mb-10">
          <span className="inline-block h-2 w-2 bg-hazard" aria-hidden />
          {label}
        </p>
        {children}
      </div>
    </section>
  );
}
