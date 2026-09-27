import { getFreshNotionImageUrl } from "@/lib/notion-cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const id = params.get("id");

  const validId =
    typeof id === "string" &&
    /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id);
  if ((type !== "page" && type !== "block") || !validId) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const imageUrl = await getFreshNotionImageUrl(type, id);
    if (!imageUrl) return new Response("Image not found", { status: 404 });

    return new Response(null, {
      status: 307,
      headers: {
        Location: imageUrl,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
