import type { CommentRole, CommentViewer } from "./types";

/**
 * The single place that decides what an account looks like to the comments
 * system.
 *
 * Two call sites need this — the POST handler in `app/api/comments`, which
 * stamps the role into the stored comment, and `ContentDetailPage`, which hands
 * the form a locked identity — and they must never disagree. A comment labelled
 * `owner` while the composer shows "member", or the reverse, would be a bug that
 * only shows up on the live site.
 *
 * `role` is the Better Auth `user.role` value: `'admin'` or `'user'`, with
 * `'user'` the column default. Anything unrecognised is treated as a member
 * rather than as an owner, so a typo in the database degrades to "not the site
 * owner" instead of silently granting the badge.
 */
export function commentRoleFor(role: string | null | undefined): CommentRole {
  return role === "admin" ? "owner" : "member";
}

/** The subset of a Better Auth session user this module needs. */
export type SessionUserLike = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

/**
 * Builds the viewer handed to the comments panel.
 *
 * Returns `null` when the session user has no usable name or email — those are
 * the two fields a comment is attributed with, and a comment signed by nothing
 * is worse than the guest form.
 */
export function toCommentViewer(
  user: SessionUserLike | null | undefined,
): CommentViewer | null {
  if (!user?.name || !user.email) return null;
  return {
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: commentRoleFor(user.role),
  };
}
