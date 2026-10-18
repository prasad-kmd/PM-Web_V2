import type {
  CommentRole,
  ParsedComment,
  ResolvedCommenter,
  SocialPlatform,
} from "./types";

/**
 * Encoding of commenter attribution inside a Notion comment.
 *
 * Notion has no first-class author metadata for integration-created comments,
 * so attribution is folded into the comment text. The wire format is:
 *
 *   [PMc2|Name|email|source:handle|avatarUrl|role]: comment body
 *
 * `PMc2` is a version tag. It lets `parseComment` distinguish:
 *   1. comments written by this system, at either revision,
 *   2. legacy `[Name|userId|avatar]: body` comments from PMEngineerLK-NextJS,
 *   3. comments typed straight into Notion (rendered as "via Notion").
 *
 * ### PMc1 → PMc2
 *
 * v2.9.0 appended a sixth segment, `role`, which is `owner` for a comment left
 * through a signed-in administrator's session and `member` for any other
 * signed-in account. Guests and every pre-v2.9.0 comment carry an empty segment,
 * which is exactly how `/^\[PMc1\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\]:/` renders
 * them today — so **the change is additive and nothing already in Notion is
 * rewritten or re-parsed differently.**
 *
 * The segment is chosen by the server from the session in `app/api/comments`.
 * It is never read from the request body: a client that posts `role=owner` is
 * ignored, not trusted. See `docs/comments-system.md`.
 *
 * Keep the payload short: Notion caps a comment at {@link NOTION_COMMENT_LIMIT}
 * characters, and the meta eats into that budget.
 */
const FORMAT_TAG = "PMc2";
const SEP = "|";

/** Notion's hard limit for a comment's rich_text content. */
export const NOTION_COMMENT_LIMIT = 2000;
/** Product limit for the body a visitor may submit. */
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_NAME_LENGTH = 60;

const PLATFORMS: SocialPlatform[] = ["github", "linkedin", "twitter"];
/** The only two values the `role` segment may ever hold. */
const ROLES: CommentRole[] = ["owner", "member"];

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

/**
 * `owner`, `member`, or empty.
 *
 * Closing this over an allow-list rather than writing the value through means a
 * hand-edited Notion comment cannot invent a third role, and a `ResolvedCommenter`
 * built by some future caller cannot leak an unexpected string into storage.
 */
function encodeRole(role: CommentRole | null | undefined): string {
  return role && ROLES.includes(role) ? role : "";
}

function decodeRole(segment: string): CommentRole | null {
  const value = segment.trim() as CommentRole;
  return ROLES.includes(value) ? value : null;
}

/** Builds the `[PMc2|...]:` prefix for a resolved commenter. */
export function encodeCommentMeta(commenter: ResolvedCommenter): string {
  const parts = [
    FORMAT_TAG,
    sanitizeSegment(commenter.name, MAX_NAME_LENGTH) || "Anonymous",
    sanitizeSegment(commenter.email, 254),
    encodeSource(commenter.avatarSource, commenter.handle),
    sanitizeSegment(commenter.avatar ?? "", 300),
    encodeRole(commenter.role),
  ];
  return `[${parts.join(SEP)}]:`;
}

/**
 * Serialises a comment for storage in Notion.
 *
 * The body is truncated so meta + body always fit the Notion limit. The budget
 * is derived from the assembled meta rather than from a constant, so the sixth
 * segment added in v2.9.0 needs no arithmetic here. Its marginal cost is the
 * role text alone — 5 characters for `owner`, 6 for `member` — because the
 * separator is emitted whether or not the segment has anything in it.
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

/** `[PMc2|Name|email|source:handle|avatar|role]: body` — since v2.9.0. */
const PMc2_RE =
  /^\[PMc2\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\]:\s?([\s\S]*)$/;
/** `[PMc1|Name|email|source:handle|avatar]: body` — everything before v2.9.0. */
const PMc1_RE =
  /^\[PMc1\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\]:\s?([\s\S]*)$/;
/** Legacy PMEngineerLK format: `[Name|userId|avatar]: body`. */
const LEGACY_RE = /^\[([^|\]]*)\|([^|\]]*)\|([^|\]]*)\]:\s?([\s\S]*)$/;

/** Shared tail of both PMc revisions — only the role segment differs. */
function fromSeries(
  name: string,
  email: string,
  sourceSegment: string,
  avatar: string,
  body: string,
  role: CommentRole | null,
): ParsedComment {
  const { source, handle } = decodeSource(sourceSegment.trim());
  return {
    author: {
      name: name.trim() || "Anonymous",
      email: email.trim() || null,
      avatar: avatar.trim() || null,
      handle,
      source,
      role,
    },
    content: body.trim(),
    isExternal: false,
    isLegacy: false,
  };
}

/** Decodes a Notion comment back into author + body. */
export function parseComment(text: string): ParsedComment {
  const raw = text ?? "";

  const current = raw.match(PMc2_RE);
  if (current) {
    const [, name, email, sourceSegment, avatar, role, body] = current;
    // The segment is validated on the way out as well as on the way in: a
    // comment could have been edited by hand in Notion since it was written.
    return fromSeries(name, email, sourceSegment, avatar, body, decodeRole(role));
  }

  const v1 = raw.match(PMc1_RE);
  if (v1) {
    const [, name, email, sourceSegment, avatar, body] = v1;
    // Pre-v2.9.0 comments have no role segment and must keep rendering exactly
    // as they did — no badge, no inference from the email or the name.
    return fromSeries(name, email, sourceSegment, avatar, body, null);
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
        role: null,
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
      role: null,
    },
    content: raw.trim(),
    isExternal: true,
    isLegacy: false,
  };
}
