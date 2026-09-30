"use client";

import { Loader2, PencilLine, Send, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_COMMENT_LENGTH } from "@/lib/comments/format";
import type {
  BlockedWord,
  CommenterIdentity,
  NotionComment,
} from "@/lib/comments/types";
import { CommentAvatar } from "./comment-avatar";
import { IdentityFields } from "./identity-fields";
import { TurnstileWidget, type TurnstileWidgetRef } from "./turnstile-widget";

/**
 * Guest comment composer.
 *
 * Two states:
 *  - identity known  → avatar + name row with an "Edit" affordance, then the
 *    textarea. This is the fast path for a returning visitor whose details are
 *    already in the `pm_commenter` cookie.
 *  - identity unknown → the full identity form above the textarea.
 *
 * A honeypot `website` field and the Turnstile challenge gate submission; the
 * server re-checks both, plus the disposable-email and profanity filters.
 */

const EMPTY_IDENTITY: CommenterIdentity = {
  name: "",
  email: "",
  github: "",
  linkedin: "",
  twitter: "",
};

type CommentFormProps = {
  pageId: string;
  identity: CommenterIdentity | null;
  onIdentitySave: (identity: CommenterIdentity) => void;
  onPosted: (comment: NotionComment) => void;
};

export function CommentForm({
  pageId,
  identity,
  onIdentitySave,
  onPosted,
}: CommentFormProps) {
  const [draft, setDraft] = useState<CommenterIdentity>(EMPTY_IDENTITY);
  const [editingIdentity, setEditingIdentity] = useState(!identity);
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Prefill the editable copy whenever the stored identity arrives (the cookie
  // is read after mount) or changes after a successful post. This is the
  // render-time "adjust state when a prop changes" pattern — React discards the
  // in-progress render and restarts, so there is no flash of a stale draft.
  const [syncedIdentity, setSyncedIdentity] = useState(identity);
  if (identity !== syncedIdentity) {
    setSyncedIdentity(identity);
    setDraft(identity ? { ...EMPTY_IDENTITY, ...identity } : EMPTY_IDENTITY);
    setEditingIdentity(!identity);
  }

  const active = editingIdentity ? draft : (identity ?? EMPTY_IDENTITY);
  const trimmedContent = content.trim();
  const overLimit = trimmedContent.length > MAX_COMMENT_LENGTH;
  const identityComplete =
    active.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(active.email.trim());

  const canSubmit =
    trimmedContent.length >= 3 &&
    !overLimit &&
    identityComplete &&
    Boolean(token) &&
    !submitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Honeypot: a filled value means a bot. Bail silently.
    if (!canSubmit || honeypot) return;

    setSubmitting(true);
    setBlockedWords([]);
    setFieldErrors({});

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pageId,
          content: trimmedContent,
          name: active.name.trim(),
          email: active.email.trim(),
          github: active.github?.trim() || null,
          linkedin: active.linkedin?.trim() || null,
          twitter: active.twitter?.trim() || null,
          website: honeypot,
          turnstileToken: token,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        comment?: NotionComment;
        identity?: CommenterIdentity;
        error?: string;
        type?: string;
        fields?: Record<string, string[]>;
        blockedWords?: BlockedWord[];
      } | null;

      if (!response.ok || !data?.comment) {
        if (data?.type === "profanity") {
          setBlockedWords(data.blockedWords ?? []);
          toast.error(
            `Comment blocked — ${data.blockedWords?.length ?? 0} inappropriate word(s) detected.`,
          );
          return;
        }
        if (data?.type === "validation" && data.fields) {
          setFieldErrors(data.fields);
          setEditingIdentity(true);
        }
        toast.error(data?.error ?? "Could not post your comment.");
        return;
      }

      if (data.identity) onIdentitySave(data.identity);

      setContent("");
      setBlockedWords([]);
      setFieldErrors({});
      setToken(null);
      turnstileRef.current?.reset();
      onPosted(data.comment);
      toast.success("Comment posted.");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {/* Honeypot — visually hidden, never announced, never tabbable. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="commenter-website">Website</label>
        <input
          id="commenter-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {editingIdentity || !identity ? (
        <IdentityFields
          value={draft}
          onChange={setDraft}
          errors={fieldErrors}
          disabled={submitting}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
          <CommentAvatar name={identity.name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{identity.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {identity.email}
              {identity.github || identity.linkedin || identity.twitter
                ? ` · @${identity.github ?? identity.linkedin ?? identity.twitter}`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setDraft({ ...EMPTY_IDENTITY, ...identity });
              setEditingIdentity(true);
            }}
          >
            <PencilLine />
            Edit
          </Button>
        </div>
      )}

      {editingIdentity && identity ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              setDraft({ ...EMPTY_IDENTITY, ...identity });
              setEditingIdentity(false);
            }}
          >
            Keep {identity.name.split(" ")[0]}
          </Button>
        </div>
      ) : null}

      {editingIdentity && !identity ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={submitting || !identityComplete}
            onClick={() => {
              onIdentitySave({
                name: draft.name.trim(),
                email: draft.email.trim(),
                ...(draft.github?.trim()
                  ? { github: draft.github.trim() }
                  : {}),
                ...(draft.linkedin?.trim()
                  ? { linkedin: draft.linkedin.trim() }
                  : {}),
                ...(draft.twitter?.trim()
                  ? { twitter: draft.twitter.trim() }
                  : {}),
              });
              setEditingIdentity(false);
              toast.success("Details saved on this device.");
            }}
          >
            Save details
          </Button>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="comment-body" className="text-xs font-medium">
          Comment
        </Label>
        <textarea
          id="comment-body"
          value={content}
          disabled={submitting}
          rows={4}
          maxLength={MAX_COMMENT_LENGTH + 50}
          placeholder="Share something useful — a correction, a question, a result you reproduced…"
          aria-invalid={overLimit || blockedWords.length > 0}
          onChange={(event) => setContent(event.target.value)}
          className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm leading-6 text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-xs">
          {blockedWords.length > 0 ? (
            <span className="text-destructive">
              Blocked: {blockedWords.map((w) => `“${w.word}”`).join(", ")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Checked for spam and language before posting.
            </span>
          )}
          <span
            className={overLimit ? "text-destructive" : "text-muted-foreground"}
          >
            {trimmedContent.length}/{MAX_COMMENT_LENGTH}
          </span>
        </div>
      </div>

      {trimmedContent.length > 0 ? (
        <TurnstileWidget
          ref={turnstileRef}
          onVerify={setToken}
          onExpire={() => setToken(null)}
          onError={() => {
            setToken(null);
            toast.error("Security verification failed. Please try again.");
          }}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] leading-4 text-muted-foreground">
          Comments are stored in Notion and reviewed by the site owner.
        </p>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          Post comment
        </Button>
      </div>
    </form>
  );
}
