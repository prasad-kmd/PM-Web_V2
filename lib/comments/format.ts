import type { ParsedComment, ResolvedCommenter, SocialPlatform } from "./types";

/**
 * Encoding of commenter attribution inside a Notion comment.
 *
 * Notion has no first-class author metadata for integration-created comments,
 * so attribution is folded into the comment text. The wire format is:
 *
 *   [PMc1|Name|email|source:handle|avatarUrl]: comment body
 *
 * `PMc1` is a version tag. It lets `parseComment` distinguish:
 *   1. comments written by this system,
 *   2. legacy `[Name|userId|avatar]: body` comments from PMEngineerLK-NextJS,
 *   3. comments typed straight into Notion (rendered as "via Notion").
 *
 * Keep the payload short: Notion caps a comment at {@link NOTION_COMMENT_LIMIT}
 * characters, and the meta eats into that budget.
 */
const FORMAT_TAG = "PMc1";
const SEP = "|";

/** Notion's hard limit for a comment's rich_text content. */
export const NOTION_COMMENT_LIMIT = 2000;
/** Product limit for the body a visitor may submit. */
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_NAME_LENGTH = 60;

const PLATFORMS: SocialPlatform[] = ["github", "linkedin", "twitter"];

/** Strips characters that would break the pipe-delimited meta segment. */
function sanitizeSegment(value: string, max: number): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[|[\]]/g, "/")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

/** `github:prasad-kmd`, or an empty segment when there is no handle. */
function encodeSource(
  source: SocialPlatform | null,
  handle: string | null,
): string {
  if (!source || !handle) return "";
  return `${source}:${sanitizeSegment(handle, 60)}`;
}

function decodeSource(segment: string): {
  source: SocialPlatform | null;
  handle: string | null;
} {
  const idx = segment.indexOf(":");
  if (idx < 1) return { source: null, handle: null };
  const candidate = segment.slice(0, idx) as SocialPlatform;
  const handle = segment.slice(idx + 1).trim();
  if (!PLATFORMS.includes(candidate) || !handle) {
    return { source: null, handle: null };
  }
  return { source: candidate, handle: handle };
}

/** Builds the `[PMc1|...]:` prefix for a resolved commenter. */
export function encodeCommentMeta(commenter: ResolvedCommenter): string {
  const parts = [
    FORMAT_TAG,
    sanitizeSegment(commenter.name, MAX_NAME_LENGTH) || "Anonymous",
    sanitizeSegment(commenter.email, 254),
    encodeSource(commenter.avatarSource, commenter.handle),
    sanitizeSegment(commenter.avatar ?? "", 300),
  ];
  return `[${parts.join(SEP)}]:`;
}

/**
 * Serialises a comment for storage in Notion.
 * The body is truncated so meta + body always fit the Notion limit.
 */
export function formatComment(
  commenter: ResolvedCommenter,
  content: string,
): string {
  const meta = encodeCommentMeta(commenter);
  const budget = NOTION_COMMENT_LIMIT - meta.length - 2;
  const body = content.trim().slice(0, Math.max(0, budget));
  return `${meta} ${body}`;
}

const CURRENT_RE =
  /^\[PMc1\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\]:\s?([\s\S]*)$/;
/** Legacy PMEngineerLK format: `[Name|userId|avatar]: body`. */
const LEGACY_RE = /^\[([^|\]]*)\|([^|\]]*)\|([^|\]]*)\]:\s?([\s\S]*)$/;

/** Decodes a Notion comment back into author + body. */
export function parseComment(text: string): ParsedComment {
  const raw = text ?? "";

  const current = raw.match(CURRENT_RE);
  if (current) {
    const [, name, email, sourceSegment, avatar, body] = current;
    const { source, handle } = decodeSource(sourceSegment.trim());
    return {
      author: {
        name: name.trim() || "Anonymous",
        email: email.trim() || null,
        avatar: avatar.trim() || null,
        handle,
        source,
      },
      content: body.trim(),
      isExternal: false,
      isLegacy: false,
    };
  }

  const legacy = raw.match(LEGACY_RE);
  if (legacy) {
    const [, name, id, avatar, body] = legacy;
    return {
      author: {
        name: name.trim() || "Anonymous",
        // The legacy format stored a Better-Auth user id, not an email.
        email: null,
        avatar: avatar.trim() || null,
        handle: id.trim() || null,
        source: null,
      },
      content: body.trim(),
      isExternal: false,
      isLegacy: true,
    };
  }

  return {
    author: {
      name: "Notion user",
      email: null,
      avatar: null,
      handle: null,
      source: null,
    },
    content: raw.trim(),
    isExternal: true,
    isLegacy: false,
  };
}
