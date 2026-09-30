import { createHash } from "node:crypto";
import { z } from "zod";
import { commentConfig } from "./config";
import { isDisposableEmail } from "./disposable-email";
import { MAX_NAME_LENGTH } from "./format";
import { findBlockedWords } from "./profanity";
import { normalizeHandle } from "./avatar";
import type {
  BlockedWord,
  CommentError,
  CommenterIdentity,
  ValidationResult,
} from "./types";

/**
 * Request validation for the guest comment flow.
 *
 * Order matters — cheapest and most attacker-relevant checks first:
 *   1. shape (zod)
 *   2. disposable email (`fakeout`)
 *   3. profanity in the body (`obscenity`)
 *
 * Turnstile is verified by the route before this runs, because it is the only
 * network round-trip in the chain.
 */

/** Strips a pasted URL down to its handle: `github.com/x` → `x`. */
function handleFromUrlish(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const path = trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?/i, "")
    .replace(/^(github\.com|linkedin\.com|x\.com|twitter\.com)\//i, "")
    .replace(/^in\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
  return path || undefined;
}

export const commentPayloadSchema = z.object({
  pageId: z
    .string()
    .trim()
    .min(1, "Missing page id")
    // Notion UUIDs, with or without dashes.
    .regex(/^[0-9a-f-]{32,36}$/i, "Invalid page id"),
  content: z
    .string()
    .trim()
    .min(3, "Comment is too short")
    .max(1000, "Comment is too long"),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(MAX_NAME_LENGTH, `Name must be under ${MAX_NAME_LENGTH} characters`),
  email: z
    .email("Enter a valid email address")
    .transform((v) => v.toLowerCase()),
  github: z.string().trim().max(64).optional().nullable(),
  linkedin: z.string().trim().max(64).optional().nullable(),
  twitter: z.string().trim().max(64).optional().nullable(),
  /** Anti-spam field that real visitors never see or fill. */
  website: z.string().max(0).optional().nullable(),
});

export type CommentPayload = z.infer<typeof commentPayloadSchema>;

/** Normalises handles (accepts a pasted profile URL) and drops empties. */
export function normalizeIdentity(payload: CommentPayload): CommenterIdentity {
  const github = normalizeHandle(handleFromUrlish(payload.github ?? undefined));
  const linkedin = normalizeHandle(
    handleFromUrlish(payload.linkedin ?? undefined),
  );
  const twitter = normalizeHandle(
    handleFromUrlish(payload.twitter ?? undefined),
  );

  return {
    name: payload.name.replace(/\s{2,}/g, " ").trim(),
    email: payload.email,
    ...(github ? { github } : {}),
    ...(linkedin ? { linkedin } : {}),
    ...(twitter ? { twitter } : {}),
  };
}

/**
 * The email that ends up inside the Notion comment.
 * With `COMMENTS_STORE_EMAIL=false` a truncated SHA-256 is stored instead, so
 * repeat commenters can still be recognised without keeping the address.
 */
export function storedEmail(email: string): string {
  if (commentConfig.storeEmail) return email;
  return `sha256:${createHash("sha256").update(email).digest("hex").slice(0, 16)}`;
}

export function validateCommentPayload(
  payload: CommentPayload,
): ValidationResult<CommenterIdentity> {
  if (payload.website) {
    // Honeypot tripped — reject silently with a generic message so bots get
    // no signal about which field gave them away.
    return {
      success: false,
      error: { type: "validation", message: "Comment rejected." },
    };
  }

  if (isDisposableEmail(payload.email)) {
    return {
      success: false,
      error: {
        type: "temp_mail",
        message:
          "Please use a permanent email address — disposable addresses are not accepted.",
      },
    };
  }

  const blocked: BlockedWord[] = findBlockedWords(payload.content);
  if (blocked.length > 0) {
    return {
      success: false,
      error: {
        type: "profanity",
        message: "Inappropriate language detected.",
        blockedWords: blocked,
      },
    };
  }

  return { success: true, data: normalizeIdentity(payload) };
}

/** Turns a zod failure into the shared error shape. */
export function toFieldError(error: z.ZodError): CommentError {
  const flattened = error.flatten().fieldErrors as Record<string, string[]>;
  const honeypotOnly =
    Boolean(flattened.website) && Object.keys(flattened).length === 1;

  // Never name the honeypot field back to the caller — that would tell a bot
  // exactly which input gave it away.
  const fields = Object.fromEntries(
    Object.entries(flattened).filter(([key]) => key !== "website"),
  );

  if (honeypotOnly) {
    return { type: "validation", message: "Comment rejected." };
  }

  return {
    type: "validation",
    message: "Please check the highlighted fields.",
    fields,
  };
}
