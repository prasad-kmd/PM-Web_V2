"use client";

import { Github, Linkedin, Twitter } from "lucide-react";
import { parseComment } from "@/lib/comments/format";
import type { NotionComment, SocialPlatform } from "@/lib/comments/types";
import { CommentAvatar } from "./comment-avatar";

/** Renders one decoded Notion comment. */

const PROFILE_BASE: Record<SocialPlatform, string> = {
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/in/",
  twitter: "https://x.com/",
};

const PLATFORM_ICON: Record<SocialPlatform, typeof Github> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
};

/** Short, locale-aware relative time without pulling in date-fns. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, divisor] of units) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(-Math.round(seconds / divisor), unit);
    }
  }
  return "just now";
}

export function CommentItem({ comment }: { comment: NotionComment }) {
  const text = (comment.rich_text ?? [])
    .map((segment) => segment.plain_text)
    .join("");
  const parsed = parseComment(text);
  const { author, content } = parsed;
  const Icon = author.source ? PLATFORM_ICON[author.source] : null;
  const profileUrl =
    author.source && author.handle
      ? `${PROFILE_BASE[author.source]}${encodeURIComponent(author.handle)}`
      : null;

  return (
    <li className="flex gap-3">
      <CommentAvatar
        name={author.name}
        src={author.avatar}
        source={author.source}
        size={34}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {profileUrl ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {Icon ? <Icon className="size-3.5 opacity-70" /> : null}
              {author.name}
            </a>
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {author.name}
            </span>
          )}

          <span className="text-xs text-muted-foreground">
            <time dateTime={comment.created_time}>
              {relativeTime(comment.created_time)}
            </time>
          </span>

          {parsed.isExternal ? (
            <span className="rounded border border-border/70 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              via Notion
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm leading-6 break-words whitespace-pre-wrap text-ink-soft">
          {content}
        </p>
      </div>
    </li>
  );
}
