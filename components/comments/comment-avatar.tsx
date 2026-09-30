"use client";

import { Github, Linkedin, Twitter, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialPlatform } from "@/lib/comments/types";

/**
 * Avatar for a guest commenter.
 *
 * Renders the resolved platform image when there is one; otherwise draws a
 * deterministic initials chip whose hue is derived from the display name, so
 * the same person always gets the same colour without any network request or
 * external avatar service.
 */

const PLATFORM_ICON: Record<SocialPlatform, typeof Github> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
};

/** Stable 0-359 hue from a string (FNV-1a). */
function hueOf(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % 360;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export type CommentAvatarProps = {
  name: string;
  src?: string | null;
  source?: SocialPlatform | null;
  size?: number;
  className?: string;
};

export function CommentAvatar({
  name,
  src,
  source,
  size = 36,
  className,
}: CommentAvatarProps) {
  const label = name || "Anonymous";
  const hue = hueOf(label.toLowerCase());
  const Icon = source ? PLATFORM_ICON[source] : null;

  const badge = Icon ? (
    <span
      aria-hidden
      className="absolute -end-0.5 -bottom-0.5 grid size-3.5 place-items-center rounded-full border border-popover bg-popover text-muted-foreground"
    >
      <Icon className="size-2.5" strokeWidth={1.75} />
    </span>
  ) : null;

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        // A plain <img> rather than next/image: avatar hosts vary per platform
        // and the CSP already allowlists them, so there is no reason to run
        // every guest avatar through the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full rounded-full border border-border/60 bg-muted object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center rounded-full border border-border/60 font-semibold text-white"
          style={{
            fontSize: Math.max(11, Math.round(size * 0.38)),
            background: `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${(hue + 38) % 360} 58% 34%))`,
          }}
        >
          {initialsOf(label)}
        </span>
      )}
      {!src && !Icon ? (
        <span
          aria-hidden
          className="absolute -end-0.5 -bottom-0.5 grid size-3.5 place-items-center rounded-full border border-popover bg-popover text-muted-foreground"
        >
          <User className="size-2.5" strokeWidth={1.75} />
        </span>
      ) : (
        badge
      )}
    </span>
  );
}
