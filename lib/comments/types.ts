/**
 * Shared types for the comments subsystem.
 *
 * The comments feature is a guest system: PM-Web_V2 has no sign-in, so the
 * commenter supplies a name, an email and (optionally) one or more social
 * handles. That tuple is the "identity" everywhere below.
 */

/** Platforms we can resolve a profile image from. Order matters — see
 *  `AVATAR_PLATFORMS` in `./avatar.ts`. */
export type SocialPlatform = "github" | "linkedin" | "twitter";

/** Raw identity as typed by the user in the comment form. */
export type CommenterIdentity = {
  name: string;
  email: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
};

/** Identity after server-side normalisation + avatar resolution. */
export type ResolvedCommenter = {
  name: string;
  email: string;
  /** Resolved absolute image URL, or `null` when nothing could be resolved. */
  avatar: string | null;
  /** Which platform the avatar came from, or null for the generated fallback. */
  avatarSource: SocialPlatform | null;
  /** Handle belonging to `avatarSource`. */
  handle: string | null;
};

/** The subset of a Notion comment object the UI needs. */
export type NotionComment = {
  id: string;
  created_time: string;
  rich_text: Array<{ plain_text: string }>;
};

/** A Notion comment decoded back into author + body. */
export type ParsedComment = {
  author: {
    name: string;
    email: string | null;
    avatar: string | null;
    handle: string | null;
    source: SocialPlatform | null;
  };
  content: string;
  /** True when the comment was written directly in Notion, not through the site. */
  isExternal: boolean;
  /** True when the comment predates this system's format. */
  isLegacy: boolean;
};

export type BlockedWord = {
  word: string;
  startIndex: number;
  endIndex: number;
};

export type CommentErrorType =
  | "validation"
  | "turnstile"
  | "profanity"
  | "temp_mail"
  | "rate_limit"
  | "notion"
  | "unknown";

export type CommentError = {
  type: CommentErrorType;
  message: string;
  /** Field-level messages when `type === "validation"`. */
  fields?: Record<string, string[]>;
  blockedWords?: BlockedWord[];
};

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; error: CommentError };
