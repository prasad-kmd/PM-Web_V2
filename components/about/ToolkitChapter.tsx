"use client";

import Image from "next/image";
import { DraftingCompass, Factory, Workflow } from "lucide-react";
import AboutChapter, {
  AboutChapterLabel,
} from "@/components/about/AboutChapter";
import TiltedTiles from "@/components/react-bits/tilted-tiles";
import {
  ABOUT_TILE_IMAGES,
  ENGINEERING_TOOLS,
  OTHER_TOOLS,
  TOOL_ICON_BASE,
  type AboutTool,
} from "@/lib/about-data";
import styles from "@/app/about/about.module.css";

/** Honest category marks for vendors with no open brand SVG. */
const FALLBACK_ICONS = {
  cad: DraftingCompass,
  automation: Workflow,
  factory: Factory,
};

function ToolItem({
  tool,
  compact = false,
}: {
  tool: AboutTool;
  compact?: boolean;
}) {
  const Icon = FALLBACK_ICONS[tool.fallback ?? "cad"];
  return (
    <li className={compact ? styles.secondaryTool : styles.engineeringTool}>
      <span className={styles.iconWell} aria-hidden>
        {tool.icon ? (
          <Image
            src={`${TOOL_ICON_BASE}/${tool.icon}`}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="size-6 object-contain"
          />
        ) : (
          <Icon className="size-5 text-zinc-700" strokeWidth={1.5} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-snug text-ink">
          {tool.name}
        </span>
        {!compact && (
          <span className="mt-0.5 block truncate text-[11px] leading-snug text-ink-soft">
            {tool.use}
          </span>
        )}
      </span>
    </li>
  );
}

/** Chapter 05 — engineering bench first, supporting stack second. */
export default function ToolkitChapter() {
  return (
    <AboutChapter
      id="about-stack"
      backdrop={
        <>
          <TiltedTiles
            className="absolute inset-0 h-full w-full opacity-30 dark:opacity-20"
            images={ABOUT_TILE_IMAGES}
            parallax={false}
            columns={12}
            tilesPerColumn={6}
            rowGap={14}
            columnGap={14}
            borderRadius={12}
            duration={38}
            saturation={0.9}
          />
          <div className="absolute inset-0 bg-paper/78 dark:bg-paper/82" />
        </>
      }
    >
      <AboutChapterLabel number="05">Tools &amp; stack</AboutChapterLabel>
      <div className={styles.toolsHeading}>
        <h2 id="about-stack-title" className={styles.display}>
          Tools I reach for.
        </h2>
        <p className={styles.bodyCopy}>
          Engineering comes first. Software, visual tools and documentation
          support the work around it.
        </p>
      </div>

      <div className={styles.toolsGrid}>
        <section
          aria-labelledby="engineering-toolkit-title"
          className={styles.engineeringPanel}
        >
          <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h3 id="engineering-toolkit-title" className={styles.panelTitle}>
              The engineering bench
            </h3>
            <p className="hidden font-mono text-[10px] text-primary sm:block">
              CAD / CONTROL / AUTOMATION
            </p>
          </div>
          <ul className={styles.engineeringList}>
            {ENGINEERING_TOOLS.map((tool) => (
              <ToolItem key={tool.name} tool={tool} />
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="other-toolkit-title"
          className={styles.otherPanel}
        >
          <h3 id="other-toolkit-title" className={styles.panelTitle}>
            The supporting stack
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
            Web development, visual work and everyday documentation.
          </p>
          <ul className={styles.otherList}>
            {OTHER_TOOLS.map((tool) => (
              <ToolItem key={tool.name} tool={tool} compact />
            ))}
          </ul>
        </section>
      </div>
    </AboutChapter>
  );
}
