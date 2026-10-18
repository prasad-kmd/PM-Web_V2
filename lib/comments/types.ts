/**
 * Shared types for the comments subsystem.
 *
 * The comments feature began as a guest-only system: the commenter supplies a
 * name, an email and (optionally) one or more social handles. That tuple is the
 * "identity" everywhere below.
 *
 * v2.9.0 added a signed-in path beside it — see {@link CommentRole} and
 * {@link CommentViewer}. The guest path is unchanged, and a visitor who is not
 * signed in never sees any difference.
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

/**
 * How a signed-in commenter is labelled, decided by the server.
 *
 * `owner` is an account with `role = 'admin'` — the person who owns the site.
 * `member` is any other signed-in account (only reachable if the seat limit is
 * raised). Guests have no role, and neither does anything written before
 * v2.9.0.
 *
 * **Assigned from the session in `app/api/comments`, never from the request
 * body.** A client cannot claim this.
 */
export type CommentRole = "owner" | "member";

/**
 * The signed-in visitor, as far as the comments UI is concerned.
 *
 * Built on the server from the session and handed to the comments panel, so the
 * form can lock its identity fields without the client ever having to ask who it
 * is. The email is the visitor's own, shown back to them and posted with the
 * comment — the route replaces it with the session value either way, so the
 * locked fields are a courtesy rather than the guarantee. The guarantee is
 * server-side.
 */
export type CommentViewer = {
  name: string;
  email: string;
  /** Avatar URL from the OAuth profile, or null. */
  image: string | null;
  role: CommentRole;
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
  /** Server-decided label, or null for a guest. */
  role: CommentRole | null;
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
    /** `owner` renders the badge; null renders exactly as before v2.9.0. */
    role: CommentRole | null;
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
