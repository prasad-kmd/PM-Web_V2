/* eslint-disable @next/next/no-img-element -- avatars are user-supplied GitHub redirects and must not be optimized */
"use client";

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";
import { MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerPopup,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerPanel,
} from "@/components/ui/drawer";
import {
  emptyProfile,
  parseGuestComment,
  profileLinks,
  validProfile,
  type GuestProfile,
} from "@/lib/guest-comments";
import type { ContentType } from "@/lib/notion-cms";

const COOKIE = "pm-comment-profile";
const query = "(min-width: 768px)";
const subscribe = (callback: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", callback);
  return () => m.removeEventListener("change", callback);
};
const desktop = () => window.matchMedia(query).matches;

type Comment = { id: string; text: string; created_time: string };

export function CommentsPanel({
  type,
  slug,
}: {
  type: ContentType;
  slug: string;
}) {
  const isDesktop = useSyncExternalStore(subscribe, desktop, () => false);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<GuestProfile>(emptyProfile);
  const [editing, setEditing] = useState(true);
  const [content, setContent] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const captcha = useRef<TurnstileInstance>(null);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV === "development" ? "1x00000000000000000000AA" : "");

  function restoreProfile() {
    try {
      const value = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${COOKIE}=`))
        ?.slice(COOKIE.length + 1);
      if (!value || value.length > 1500) return;
      const saved = JSON.parse(decodeURIComponent(value)) as GuestProfile;
      if (saved && validProfile(saved)) {
        setProfile(saved);
        setEditing(false);
      }
    } catch {
      /* corrupt or old cookie: ask again */
    }
  }

  const load = useCallback(
    async (next?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type, slug });
        if (next) params.set("cursor", next);
        const res = await fetch(`/api/comments?${params}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load comments.");
        setComments((prev) =>
          next ? [...prev, ...data.results] : data.results,
        );
        setCursor(data.next_cursor);
        setLoaded(true);
        setStatus("");
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Unable to load comments.",
        );
      } finally {
        setLoading(false);
      }
    },
    [type, slug],
  );

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!validProfile(profile)) {
      setStatus("Please check your name, email and usernames.");
      return;
    }
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(profile))}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setEditing(false);
    setStatus("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!siteKey || !token || !validProfile(profile) || !content.trim()) {
      setStatus("Complete your profile, comment and security check.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          slug,
          profile,
          content,
          turnstileToken: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to post comment.");
      setContent("");
      setStatus("Comment posted.");
      await load();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to post comment.",
      );
    } finally {
      setToken("");
      captcha.current?.reset();
      setBusy(false);
    }
  }

  const fields = ["name", "email", "github", "linkedin", "twitter"] as const;
  const body = (
    <div className="space-y-6 pb-10 text-sm">
      {editing ? (
        <form onSubmit={saveProfile} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Your email is used for validation, not published. Your profile is
            saved in a cookie on this device and can be edited any time.
          </p>
          {fields.map((field) => (
            <label
              key={field}
              className="block space-y-1 font-medium capitalize"
            >
              {field}
              {field === "github" || field === "linkedin" || field === "twitter"
                ? " (optional)"
                : ""}
              <input
                required={field === "name" || field === "email"}
                type={field === "email" ? "email" : "text"}
                maxLength={field === "email" ? 254 : field === "name" ? 80 : 39}
                value={profile[field]}
                onChange={(event) =>
                  setProfile((old) => ({ ...old, [field]: event.target.value }))
                }
                className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "email"
                      ? "email"
                      : "off"
                }
              />
            </label>
          ))}
          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            Continue
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          {profileLinks(profile).avatar ? (
            <img
              src={profileLinks(profile).avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
            >
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">
            Commenting as {profile.name}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-primary underline"
          >
            Edit
          </button>
        </div>
      )}
      {!editing && (
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1">
            Your comment
            <textarea
              required
              minLength={2}
              maxLength={1500}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="block w-full resize-y rounded-lg border border-border bg-card p-3 text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
          {siteKey ? (
            <Turnstile
              ref={captcha}
              siteKey={siteKey}
              onSuccess={setToken}
              onExpire={() => setToken("")}
              onError={() => setToken("")}
            />
          ) : (
            <p>Comments are unavailable until Turnstile is configured.</p>
          )}
          <button
            disabled={busy || !token}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}
      {status && (
        <p role="status" className="text-primary">
          {status}
        </p>
      )}
      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="font-semibold">Recent comments</h3>
        {loading && !loaded && <p role="status">Loading comments…</p>}
        {comments.map((comment) => {
          const parsed = parseGuestComment(comment.text);
          return (
            <article
              key={comment.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-2">
                {parsed.avatar &&
                parsed.avatar.startsWith("https://github.com/") ? (
                  <img
                    src={parsed.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    {parsed.name[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-medium">
                    {parsed.profile.split(",")[0]?.startsWith("https://") ? (
                      <a
                        href={parsed.profile.split(",")[0]}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="hover:underline"
                      >
                        {parsed.name}
                      </a>
                    ) : (
                      parsed.name
                    )}
                  </p>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={comment.created_time}
                  >
                    {new Date(comment.created_time).toLocaleDateString()}
                  </time>
                </div>
              </div>
              {parsed.profile && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-primary">
                  {parsed.profile
                    .split(",")
                    .filter((url) =>
                      /^https:\/\/(github\.com|www\.linkedin\.com|x\.com)\//.test(
                        url,
                      ),
                    )
                    .map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="underline"
                      >
                        {url.includes("github.com")
                          ? "GitHub"
                          : url.includes("linkedin.com")
                            ? "LinkedIn"
                            : "X"}
                      </a>
                    ))}
                </div>
              )}
              <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">
                {parsed.body}
              </p>
            </article>
          );
        })}
        {loaded && !comments.length && (
          <p className="text-muted-foreground">No comments yet.</p>
        )}
        {cursor && (
          <button
            disabled={loading}
            onClick={() => void load(cursor)}
            className="text-primary underline"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section className="mt-8 border-t border-border pt-6">
      <button
        onClick={() => {
          restoreProfile();
          setOpen(true);
          if (!loaded) void load();
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        <MessageSquare className="size-4" aria-hidden />
        Comments
      </button>
      {isDesktop ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetPopup side="right">
            <SheetHeader>
              <SheetTitle>Comments</SheetTitle>
              <SheetDescription>
                Join the discussion on this post.
              </SheetDescription>
            </SheetHeader>
            <SheetPanel>{body}</SheetPanel>
          </SheetPopup>
        </Sheet>
      ) : (
        <Drawer open={open} onOpenChange={setOpen} position="bottom">
          <DrawerPopup showCloseButton className="max-h-[85dvh]">
            <DrawerHeader>
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription>
                Join the discussion on this post.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>{body}</DrawerPanel>
          </DrawerPopup>
        </Drawer>
      )}
    </section>
  );
}
