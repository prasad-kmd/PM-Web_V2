import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().max(40),
    bio: z.string().trim().max(160),
  })
  .strict();

function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestOrigin = new URL(request.url).origin;
  const source = origin ?? referer;

  if (!source) return false;

  try {
    return new URL(source).origin === requestOrigin;
  } catch {
    return false;
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Cross-origin request blocked." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to update your profile." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > 8_192) {
    return NextResponse.json(
      { error: "Profile update is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Use a display name up to 40 characters and a bio up to 160 characters.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const displayName = parsed.data.displayName || null;
  const bio = parsed.data.bio || null;

  const [profile] = await getDb()
    .update(user)
    .set({ displayName, bio, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))
    .returning({ displayName: user.displayName, bio: user.bio });

  if (!profile) {
    return NextResponse.json(
      { error: "The account could not be found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { profile },
    { headers: { "Cache-Control": "no-store" } },
  );
}
