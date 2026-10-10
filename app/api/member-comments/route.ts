import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { and, count, desc, eq, lt, or } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { findBlockedWords } from "@/lib/comments/profanity";
import { getClientIp } from "@/lib/comments/request-context";
import { recordHit } from "@/lib/comments/rate-limit";
import { getDb } from "@/lib/db";
import { memberComment, user } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const PAGE_ID_RE = /^[0-9a-f-]{32,36}$/i;
const COMMENT_ID_RE = /^[0-9a-f-]{36}$/i;
const memberCommentSchema = z
  .object({
    pageId: z.string().trim().regex(PAGE_ID_RE),
    content: z
      .string()
      .trim()
      .min(3)
      .max(1000)
      .refine(
        (value) =>
          !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        "Remove unsupported control characters.",
      ),
  })
  .strict();

type MemberCommentCursor = { createdAt: Date; id: string };

function json(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

function isSameOriginMutation(request: Request): boolean {
  const source =
    request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function encodeCursor(value: MemberCommentCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: value.createdAt.toISOString(), id: value.id }),
  ).toString("base64url");
}

function decodeCursor(raw: string | null): MemberCommentCursor | null | false {
  if (!raw) return null;
  if (raw.length > 256) return false;
  try {
    const value = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (
      typeof value.createdAt !== "string" ||
      typeof value.id !== "string" ||
      !COMMENT_ID_RE.test(value.id)
    ) {
      return false;
    }
    const createdAt = new Date(value.createdAt);
    if (!Number.isFinite(createdAt.getTime())) return false;
    return { createdAt, id: value.id };
  } catch {
    return false;
  }
}

function rateLimitResponse(retryAfterMs: number): NextResponse {
  return json(
    { error: "You are posting too quickly. Please try again later." },
    429,
    { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) },
  );
}

/**
 * Public read endpoint for the distinct, account-backed member-comment feed.
 * The session is used only to mark the signed-in visitor's own entries.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  if (!pageId || !PAGE_ID_RE.test(pageId)) {
    return json({ error: "Missing or invalid pageId." }, 400);
  }

  const cursor = decodeCursor(searchParams.get("cursor"));
  if (cursor === false) return json({ error: "Invalid comment cursor." }, 400);

  const ip = await getClientIp();
  const readLimit = recordHit("member-comments:read", ip, {
    limit: 120,
    window: 60_000,
  });
  if (readLimit.limited) return rateLimitResponse(readLimit.retryAfterMs);

  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    const conditions = [eq(memberComment.pageId, pageId)];
    if (cursor) {
      conditions.push(
        or(
          lt(memberComment.createdAt, cursor.createdAt),
          and(
            eq(memberComment.createdAt, cursor.createdAt),
            lt(memberComment.id, cursor.id),
          ),
        )!,
      );
    }

    const db = getDb();
    const [rows, [{ totalCount }]] = await Promise.all([
      db
        .select({
          id: memberComment.id,
          content: memberComment.content,
          createdAt: memberComment.createdAt,
          userId: memberComment.userId,
          name: user.name,
          displayName: user.displayName,
          image: user.image,
        })
        .from(memberComment)
        .innerJoin(user, eq(memberComment.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(memberComment.createdAt), desc(memberComment.id))
        .limit(PAGE_SIZE + 1),
      db
        .select({ totalCount: count() })
        .from(memberComment)
        .where(eq(memberComment.pageId, pageId)),
    ]);

    const hasMore = rows.length > PAGE_SIZE;
    const page = rows.slice(0, PAGE_SIZE);
    const results = page.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      author: {
        name: row.displayName?.trim() || row.name,
        avatar:
          row.image &&
          (() => {
            try {
              const image = new URL(row.image);
              return image.protocol === "https:" &&
                image.hostname === "avatars.githubusercontent.com"
                ? image.href
                : null;
            } catch {
              return null;
            }
          })(),
      },
      isOwner: row.userId === session?.user.id,
    }));

    const last = page.at(-1);
    return json({
      results,
      totalCount,
      viewerSignedIn: Boolean(session),
      nextCursor: hasMore && last ? encodeCursor(last) : null,
      hasMore,
    });
  } catch (error) {
    console.error("[member-comments] failed to list comments:", error);
    return json({ error: "Member comments are unavailable right now." }, 503);
  }
}

/** Create a member comment. A guest cannot choose or impersonate its author. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginMutation(request)) {
    return json({ error: "Cross-origin request blocked." }, 403);
  }

  const rawLength = Number(request.headers.get("content-length") ?? 0);
  if (rawLength > 8_192) return json({ error: "Comment is too large." }, 413);

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    return json({ error: "Sign in to post a member comment." }, 401);

  const ip = await getClientIp();
  const limits = [
    recordHit("member-comments:user:burst", session.user.id, {
      limit: 3,
      window: 60_000,
    }),
    recordHit("member-comments:user:daily", session.user.id, {
      limit: 12,
      window: 24 * 60 * 60 * 1000,
    }),
    recordHit("member-comments:ip:burst", ip, {
      limit: 20,
      window: 60_000,
    }),
  ];
  const limited = limits.find((result) => result.limited);
  if (limited) return rateLimitResponse(limited.retryAfterMs);

  const rawBody = await request.text();
  if (rawBody.length > 8_192)
    return json({ error: "Comment is too large." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Malformed request body." }, 400);
  }

  const parsed = memberCommentSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "Use a valid page and a comment between 3 and 1,000 characters.",
      },
      400,
    );
  }

  const blocked = findBlockedWords(parsed.data.content);
  if (blocked.length) {
    return json({ error: "Please revise the language in your comment." }, 400);
  }

  try {
    const [created] = await getDb()
      .insert(memberComment)
      .values({
        id: randomUUID(),
        pageId: parsed.data.pageId,
        userId: session.user.id,
        content: parsed.data.content,
      })
      .returning({
        id: memberComment.id,
        content: memberComment.content,
        createdAt: memberComment.createdAt,
      });

    const [author] = await getDb()
      .select({
        name: user.name,
        displayName: user.displayName,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!created || !author) {
      return json({ error: "Could not save your comment." }, 500);
    }

    const avatar = (() => {
      if (!author.image) return null;
      try {
        const image = new URL(author.image);
        return image.protocol === "https:" &&
          image.hostname === "avatars.githubusercontent.com"
          ? image.href
          : null;
      } catch {
        return null;
      }
    })();

    return json({
      comment: {
        ...created,
        createdAt: created.createdAt.toISOString(),
        author: { name: author.displayName?.trim() || author.name, avatar },
        isOwner: true,
      },
    });
  } catch (error) {
    console.error("[member-comments] failed to create comment:", error);
    return json(
      { error: "Could not post your comment. Please try again." },
      500,
    );
  }
}

/** Delete only a row owned by the current signed-in account. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginMutation(request)) {
    return json({ error: "Cross-origin request blocked." }, 403);
  }

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return json({ error: "Sign in to manage your comments." }, 401);

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !COMMENT_ID_RE.test(id)) {
    return json({ error: "Missing or invalid comment id." }, 400);
  }

  const limit = recordHit("member-comments:delete", session.user.id, {
    limit: 20,
    window: 60_000,
  });
  if (limit.limited) return rateLimitResponse(limit.retryAfterMs);

  try {
    const [deleted] = await getDb()
      .delete(memberComment)
      .where(
        and(
          eq(memberComment.id, id),
          eq(memberComment.userId, session.user.id),
        ),
      )
      .returning({ id: memberComment.id });

    if (!deleted) {
      return json({ error: "Comment not found or cannot be deleted." }, 404);
    }

    return json({ deleted: true });
  } catch (error) {
    console.error("[member-comments] failed to delete comment:", error);
    return json(
      { error: "Could not delete this comment. Please try again." },
      500,
    );
  }
}
