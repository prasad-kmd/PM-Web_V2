"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Paperclip, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  TurnstileWidget,
  type TurnstileWidgetRef,
} from "@/components/comments/turnstile-widget";

const fieldClass =
  "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const widgetRef = useRef<TurnstileWidgetRef>(null);
  const [token, setToken] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!token) {
      toast.error("Complete the security check before sending.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const file = data.get("attachment");
    if (file instanceof File && file.size > 8 * 1024 * 1024) {
      toast.error("Attachments must be under 8 MB.");
      return;
    }
    data.set("turnstileToken", token);
    setBusy(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        warning?: string;
      };
      if (!response.ok || !result.ok) {
        toast.error(result.error || "Your message could not be sent.");
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success("Message delivered. Thank you for getting in touch.");
      formRef.current?.reset();
      setMessageLength(0);
    } catch {
      toast.error(
        "Connection interrupted. Please try again or use the direct email link.",
      );
    } finally {
      setBusy(false);
      setToken("");
      widgetRef.current?.reset();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
      encType="multipart/form-data"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-ink">
          Name <span className="text-primary">*</span>
          <input
            name="name"
            type="text"
            minLength={2}
            maxLength={80}
            required
            autoComplete="name"
            placeholder="Your name"
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-semibold text-ink">
          Email <span className="text-primary">*</span>
          <input
            name="email"
            type="email"
            maxLength={254}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
          />
        </label>
      </div>
      <label className="mt-5 block text-xs font-semibold text-ink">
        Phone <span className="font-normal text-ink-soft">(optional)</span>
        <input
          name="phone"
          type="tel"
          maxLength={25}
          autoComplete="tel"
          placeholder="+94 …"
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-xs font-semibold text-ink">
        Subject <span className="text-primary">*</span>
        <input
          name="subject"
          minLength={3}
          maxLength={120}
          required
          placeholder="What would you like to discuss?"
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-xs font-semibold text-ink">
        Message <span className="text-primary">*</span>
        <textarea
          name="message"
          minLength={10}
          maxLength={3400}
          onChange={(event) => setMessageLength(event.target.value.length)}
          required
          rows={6}
          placeholder="Share the context, timeline, and any useful links…"
          className={`${fieldClass} resize-y leading-6`}
        />
      </label>
      <p className="mt-1.5 text-right font-mono text-[10px] tabular-nums text-ink-soft">
        {messageLength} / 3,400 · Telegram-safe limit
      </p>
      <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-ink-soft transition-colors hover:border-primary/50">
        <Paperclip className="size-4 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          Optional attachment · PDF, PNG, JPEG or TXT · up to 8 MB
        </span>
        <input
          name="attachment"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
          className="max-w-[112px] text-[10px] file:mr-1 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-ink"
        />
      </label>
      {/* A honeypot for automated form fillers. Not a visitor-facing question. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-start gap-2 text-xs leading-5 text-ink-soft">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <p>
            Your email is used only to reply. This form is protected by
            Turnstile and sends your message privately through Telegram.
          </p>
        </div>
        <div className="mt-3">
          <TurnstileWidget
            ref={widgetRef}
            onVerify={setToken}
            onExpire={() => setToken("")}
            onError={() => {
              setToken("");
              toast.error("Security check failed. Please retry.");
            }}
          />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[11px] leading-5 text-ink-soft">
          All fields marked * are required.
        </p>
        <button
          disabled={busy || !token}
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send message"}
          {busy ? (
            <Send className="size-4 animate-pulse" aria-hidden />
          ) : (
            <ArrowUpRight className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </form>
  );
}
