"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "@/components/notion/content-listing.module.css";

/** On failure, reserve the grid's image space but remove media from list rows. */
export function ContentThumbnail({
  src,
  grid,
}: {
  src: string | null;
  grid: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const actual = src && src !== failedSource ? src : null;
  if (!actual && !grid) return null;
  return (
    <div className={styles.media} data-placeholder={!actual || undefined}>
      <Image
        src={actual ?? "/img/content-placeholder.svg"}
        alt=""
        fill
        sizes={
          grid
            ? "(min-width: 1200px) 360px, (min-width: 760px) 45vw, 90vw"
            : "(min-width: 760px) 110px, 66px"
        }
        unoptimized
        className={styles.image}
        onError={actual ? () => setFailedSource(actual) : undefined}
      />
    </div>
  );
}
