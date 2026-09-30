import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "@/app/about/about.module.css";

interface AboutChapterProps {
  id: string;
  /** Ambient layer pinned inside the viewport-tall section: it never scrolls. */
  backdrop?: ReactNode;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * One chapter of /about — exactly one viewport tall on desktop, where the
 * page snaps chapter to chapter, and a normal content-sized block on mobile
 * or on displays too short to pin a full screen.
 */
export default function AboutChapter({
  id,
  backdrop,
  children,
  className,
  containerClassName,
}: AboutChapterProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("snap-section", styles.chapter, className)}
    >
      {backdrop ? (
        <div className={styles.backdrop} aria-hidden>
          {backdrop}
        </div>
      ) : null}
      <div className={cn(styles.container, containerClassName)}>{children}</div>
    </section>
  );
}

export function AboutChapterLabel({
  number,
  children,
  className,
}: {
  number: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn(styles.eyebrow, className)}>
      <span className="font-mono text-primary">{number}</span>
      <span aria-hidden className="h-px w-6 bg-primary/40" />
      {children}
    </p>
  );
}
