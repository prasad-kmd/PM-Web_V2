import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createNotionClient } from "@/lib/notion-cms";
import { commentConfig } from "@/lib/comments/config";
import { formatComment, MAX_COMMENT_LENGTH } from "@/lib/comments/format";
import { identitySetCookie } from "@/lib/comments/identity-cookie";
import { recordHit } from "@/lib/comments/rate-limit";
import { getClientIp, getOriginHost } from "@/lib/comments/request-context";
import { verifyTurnstile } from "@/lib/comments/turnstile";
import {
  commentPayloadSchema,
  storedEmail,
  toFieldError,
  validateCommentPayload,
} from "@/lib/comments/validate";
import { resolveCommenterAvatar } from "@/lib/comments/avatar";
import type {
  CommentError,
  NotionComment,
  ResolvedCommenter,
} from "@/lib/comments/types";

/**
 * Guest comments backed by Notion's native comment API.
 *
 * Ported from PMEngineerLK-NextJS `app/api/comments/route.ts`, with the
 * authentication requirement replaced by a guest identity (name + email +
 * optional social handles) captured in the request body and cached in a cookie.
 *
 * GET  /api/comments?pageId=…&cursor=…   → list comments for a Notion page
 * POST /api/comments                     → create one
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type CommentListResponse = {
  results: NotionComment[];
  next_cursor: string | null;
  has_more: boolean;
};

type RawNotionComment = {
  id: string;
  created_time: string;
  rich_text?: Array<{ plain_text?: string }>;
};

function slim(comment: RawNotionComment): NotionComment {
  return {
    id: comment.id,
    created_time: comment.created_time,
    rich_text: (comment.rich_text ?? []).map((segment) => ({
      plain_text: segment.plain_text ?? "",
    })),
  };
}

function failure(
  status: number,
  error: CommentError,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: error.message, ...error },
    { status, headers },
  );
}

/** Notion page ids are 32 hex chars, optionally dashed. */
function isValidPageId(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f-]{32,36}$/i.test(value));
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  const cursor = searchParams.get("cursor") ?? undefined;

  if (!isValidPageId(pageId)) {
    return failure(400, {
      type: "validation",
      message: "Missing or invalid pageId.",
    });
  }

  const ip = await getClientIp();
  const readLimit = recordHit("comments:read", ip, {
    limit: 120,
    window: 60_000,
  });
  if (readLimit.limited) {
    return failure(
      429,
      { type: "rate_limit", message: "Too many requests. Try again shortly." },
      { "Retry-After": String(Math.ceil(readLimit.retryAfterMs / 1000)) },
    );
  }

  try {
    // no-store: a comment posted seconds ago must show up immediately.
    const notion = createNotionClient("no-store");
    const response = (await notion.comments.list({
      block_id: pageId,
      ...(cursor ? { start_cursor: cursor } : {}),
      page_size: PAGE_SIZE,
    })) as unknown as {
      results: RawNotionComment[];
      next_cursor: string | null;
      has_more: boolean;
    };

    const payload: CommentListResponse = {
      results: (response.results ?? []).map(slim),
      next_cursor: response.next_cursor ?? null,
      has_more: Boolean(response.has_more),
    };

    return NextResponse.json(payload, {
      headers: {
        // Fresh enough to survive a page refresh, short enough to feel live.
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[comments] failed to list comments:", error);
    return failure(502, {
      type: "notion",
      message: "Comments are unavailable right now. Please try again later.",
    });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!commentConfig.enabled) {
    return failure(403, {
      type: "validation",
      message: "Comments are temporarily closed.",
    });
  }

  // Cheap CSRF guard: a guest form has no token, so require a same-origin POST.
  const origin = await getOriginHost();
  const host = (await headers()).get("host");
  if (origin && host && origin !== host) {
    return failure(403, {
      type: "validation",
      message: "Cross-origin request blocked.",
    });
  }

  const ip = await getClientIp();

  const burst = recordHit("comments:burst", ip, commentConfig.burst);
  if (burst.limited) {
    return failure(
      429,
      {
        type: "rate_limit",
        message: "You are posting too quickly. Please wait a moment.",
      },
      { "Retry-After": String(Math.ceil(burst.retryAfterMs / 1000)) },
    );
  }

  const daily = recordHit("comments:daily", ip, commentConfig.daily);
  if (daily.limited) {
    return failure(
      429,
      {
        type: "rate_limit",
        message: "Daily comment limit reached. Please come back tomorrow.",
      },
      { "Retry-After": String(Math.ceil(daily.retryAfterMs / 1000)) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(400, {
      type: "validation",
      message: "Malformed request body.",
    });
  }

  const parsed = commentPayloadSchema.safeParse(body);
  if (!parsed.success) return failure(400, toFieldError(parsed.error));

  const payload = parsed.data;

  const token = (body as { turnstileToken?: unknown }).turnstileToken;
  if (typeof token !== "string" || !token) {
    return failure(400, {
      type: "turnstile",
      message: "Security verification missing. Please complete the check.",
    });
  }

  if (!(await verifyTurnstile(token))) {
    return failure(400, {
      type: "turnstile",
      message: "Security verification failed. Please try again.",
    });
  }

  const validation = validateCommentPayload(payload);
  if (!validation.success) {
    // Log volume only — never the comment body.
    console.warn(
      `[comments] blocked (${validation.error.type}) ip=${ip} words=${
        validation.error.blockedWords?.length ?? 0
      }`,
    );
    return failure(400, validation.error);
  }

  const identity = validation.data;

  const avatar = await resolveCommenterAvatar(identity);
  const commenter: ResolvedCommenter = {
    name: identity.name,
    email: storedEmail(identity.email),
    avatar: avatar.avatar,
    avatarSource: avatar.avatar ? avatar.source : null,
    handle: avatar.handle,
  };

  const content = formatComment(commenter, payload.content).slice(
    0,
    MAX_COMMENT_LENGTH + 400,
  );

  try {
    const notion = createNotionClient("no-store");
    const created = (await notion.comments.create({
      parent: { page_id: payload.pageId },
      rich_text: [{ text: { content } }],
    })) as unknown as RawNotionComment;

    return NextResponse.json(
      {
        comment: slim(created),
        // Echo the normalised identity so the form can update the cookie
        // immediately instead of waiting for the next page load.
        identity,
        avatar,
      },
      { headers: { "Set-Cookie": identitySetCookie(identity) } },
    );
  } catch (error) {
    console.error("[comments] failed to create comment:", error);

    const code = (error as { code?: string })?.code;
    const message =
      code === "restricted_resource" || code === "unauthorized"
        ? "Comments are not enabled for this integration. Grant it comment access in Notion."
        : "Failed to post your comment. Please try again.";

    return failure(502, { type: "notion", message });
  }
}
