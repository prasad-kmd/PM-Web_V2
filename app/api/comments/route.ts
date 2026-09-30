import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { isDisposableEmail } from "fakeout";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import {
  CONTENT_TYPES,
  getContentIndex,
  type ContentType,
} from "@/lib/notion-cms";
import {
  cleanHandle,
  formatGuestComment,
  validProfile,
  type GuestProfile,
} from "@/lib/guest-comments";

export const runtime = "nodejs";
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});
const attempts = new Map<string, number[]>();
const WINDOW = 60_000;
const LIMIT = 3;

function notion() {
  const auth = process.env.NOTION_API_KEY || process.env.NOTION_AUTH_TOKEN;
  return auth
    ? new Client({
        auth,
        notionVersion: process.env.NOTION_API_VERSION || "2026-03-11",
      })
    : null;
}

async function publishedPage(type: string | null, slug: string | null) {
  if (
    !type ||
    !slug ||
    !CONTENT_TYPES.includes(type as ContentType) ||
    slug.length > 200
  )
    return null;
  const { items } = await getContentIndex(type as ContentType);
  return items.find((item) => item.slug === slug) ?? null;
}

function response(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(req: NextRequest) {
  const page = await publishedPage(
    req.nextUrl.searchParams.get("type"),
    req.nextUrl.searchParams.get("slug"),
  );
  if (!page) return response("Published page not found.", 404);
  const client = notion();
  if (!client) return response("Comments are not configured.", 503);
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    if (cursor && (cursor.length > 300 || !/^[\w-]+$/.test(cursor)))
      return response("Invalid cursor.", 400);
    const list = await client.comments.list({
      block_id: page.id,
      start_cursor: cursor,
      page_size: 20,
    });
    return NextResponse.json(
      {
        results: list.results.map((entry) => ({
          id: entry.id,
          created_time: entry.created_time,
          text: entry.rich_text.map((part) => part.plain_text).join(""),
        })),
        next_cursor: list.next_cursor,
        has_more: list.has_more,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to read Notion comments", error);
    return response("Comments could not be loaded.", 502);
  }
}

export async function POST(req: NextRequest) {
  const client = notion();
  if (!client) return response("Comments are not configured.", 503);
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin)
    return response("Invalid request origin.", 403);
  if (Number(req.headers.get("content-length") || 0) > 10_000)
    return response("Request is too large.", 413);
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return response("Invalid request.", 400);
  }
  const { type, slug, content, turnstileToken } = payload;
  const profile = payload.profile as GuestProfile | undefined;
  if (
    !profile ||
    typeof profile !== "object" ||
    !(["name", "email", "github", "linkedin", "twitter"] as const).every(
      (key) => typeof profile[key] === "string",
    ) ||
    !validProfile(profile) ||
    typeof content !== "string" ||
    content.trim().length < 2 ||
    content.length > 1500 ||
    typeof turnstileToken !== "string" ||
    turnstileToken.length > 2048
  )
    return response(
      "Check your profile, comment, and security verification.",
      400,
    );
  if (matcher.hasMatch(content) || matcher.hasMatch(profile.name))
    return response("Inappropriate language detected.", 400);
  if (isDisposableEmail(profile.email))
    return response("Disposable email addresses are not accepted.", 400);
  const page = await publishedPage(
    typeof type === "string" ? type : null,
    typeof slug === "string" ? slug : null,
  );
  if (!page) return response("Published page not found.", 404);
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !turnstileToken)
    return response("Security verification is unavailable.", 503);
  try {
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: turnstileToken,
          remoteip: req.headers.get("x-real-ip") || "",
        }),
        cache: "no-store",
      },
    );
    const result = (await verification.json()) as {
      success?: boolean;
      hostname?: string;
    };
    if (
      !result.success ||
      (process.env.TURNSTILE_HOSTNAME &&
        result.hostname !== process.env.TURNSTILE_HOSTNAME)
    )
      return response("Security verification failed. Please retry.", 403);
  } catch {
    return response("Security verification failed. Please retry.", 502);
  }
  // Per-instance throttle, supplemented by mandatory single-use Turnstile tokens.
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  const now = Date.now();
  const keys = [`ip:${ip}`, `email:${profile.email.toLowerCase()}`];
  if (
    keys.some(
      (key) =>
        (attempts.get(key) || []).filter((time) => now - time < WINDOW)
          .length >= LIMIT,
    )
  )
    return response("Too many comments. Please wait a minute.", 429);
  for (const key of keys)
    attempts.set(key, [
      ...(attempts.get(key) || []).filter((time) => now - time < WINDOW),
      now,
    ]);
  if (attempts.size > 5000)
    for (const [entry, times] of attempts)
      if (times.every((t) => now - t >= WINDOW)) attempts.delete(entry);
  try {
    const normalized = {
      ...profile,
      github: cleanHandle(profile.github),
      linkedin: cleanHandle(profile.linkedin),
      twitter: cleanHandle(profile.twitter),
    };
    const created = await client.comments.create({
      parent: { page_id: page.id },
      rich_text: [
        { text: { content: formatGuestComment(normalized, content) } },
      ],
    });
    return NextResponse.json(
      { id: created.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to create Notion comment", error);
    return response("Your comment could not be saved.", 502);
  }
}
