import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, getOriginHost } from "@/lib/comments/request-context";
import { recordHit } from "@/lib/comments/rate-limit";
import { verifyTurnstile } from "@/lib/comments/turnstile";
import { isDisposableEmail } from "@/lib/comments/disposable-email";
import { findBlockedWords } from "@/lib/comments/profanity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
]);
const formSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(120),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\+?[\d() .-]{7,25}$/),
  ]),
  message: z.string().trim().min(10).max(3400),
  website: z.string().max(0),
  turnstileToken: z.string().min(1).max(2048),
});

function reply(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function sendTelegram(
  method: "sendMessage" | "sendDocument",
  payload: Record<string, string> | FormData,
) {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) throw new Error("Telegram bot token missing");
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      ...(payload instanceof FormData
        ? { body: payload }
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    },
  );
  if (!response.ok || !((await response.json()) as { ok?: boolean }).ok)
    throw new Error(`Telegram ${method} failed`);
}

export async function POST(request: NextRequest) {
  const origin = await getOriginHost();
  const host = request.headers.get("host");
  if (origin && host && origin !== host)
    return reply("Cross-origin request blocked.", 403);
  if (Number(request.headers.get("content-length") || 0) > MAX_REQUEST_BYTES)
    return reply("Request is too large.", 413);
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!process.env.TELEGRAM_TOKEN || !chatId)
    return reply(
      "Contact form is not configured. Please use a direct contact link.",
      503,
    );

  const ip = await getClientIp();
  const limit = recordHit("contact:submit", ip, { limit: 3, window: 60_000 });
  if (limit.limited)
    return NextResponse.json(
      { error: "Too many messages. Please try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          "Cache-Control": "no-store",
        },
      },
    );

  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return reply("Could not read the form.", 400);
  }
  const field = (name: string) => {
    const value = body.get(name);
    return typeof value === "string" ? value : "";
  };
  const parsed = formSchema.safeParse({
    name: field("name"),
    email: field("email"),
    subject: field("subject"),
    phone: field("phone"),
    message: field("message"),
    website: field("website"),
    turnstileToken: field("turnstileToken"),
  });
  if (!parsed.success)
    return reply("Check the required fields and try again.", 400);
  const { name, email, phone, subject, message, turnstileToken } = parsed.data;
  if (isDisposableEmail(email))
    return reply("Disposable email addresses are not accepted.", 400);
  if (
    [name, subject, message].some((value) => findBlockedWords(value).length > 0)
  )
    return reply(
      "Please remove inappropriate language from your message.",
      400,
    );

  const attachment = body.get("attachment");
  if (attachment && typeof attachment !== "string" && attachment.size > 0) {
    if (attachment.size > MAX_FILE_BYTES || !ALLOWED_FILES.has(attachment.type))
      return reply(
        "Attachment must be a PDF, PNG, JPEG or plain text file under 8 MB.",
        400,
      );
  }
  if (!(await verifyTurnstile(turnstileToken)))
    return reply("Security verification failed. Please retry.", 403);

  // Plain text avoids HTML injection and Telegram's 4096-character message cap.
  const text = `New website contact\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nSubject: ${subject}\n\n${message}`;
  if (text.length > 4096)
    return reply("Message exceeds Telegram's text limit.", 400);
  try {
    await sendTelegram("sendMessage", { chat_id: chatId, text });
  } catch (error) {
    console.error("Unable to deliver contact message", error);
    return reply(
      "Message could not be delivered. Please use a direct contact link.",
      502,
    );
  }
  if (attachment && typeof attachment !== "string" && attachment.size > 0) {
    const upload = new FormData();
    upload.set("chat_id", chatId);
    upload.set("document", attachment, attachment.name.slice(0, 100));
    upload.set(
      "caption",
      `Attachment for: ${name.slice(0, 80)} / ${subject.slice(0, 120)}`,
    );
    try {
      await sendTelegram("sendDocument", upload);
    } catch (error) {
      console.error("Contact message delivered, but attachment failed", error);
      return NextResponse.json(
        {
          ok: true,
          warning:
            "Your message was delivered, but the attachment could not be sent. Please send the file separately.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
