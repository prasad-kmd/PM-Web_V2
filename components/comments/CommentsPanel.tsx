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
import {
  MessageSquare,
  User,
  LogIn,
  Trash2,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const COOKIE = "pm-comment-profile";
const query = "(min-width: 768px)";
const subscribe = (callback: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", callback);
  return () => m.removeEventListener("change", callback);
};
const desktop = () => window.matchMedia(query).matches;

type Comment = {
  id: string;
  text: string;
  created_time: string;
  userId?: string;
};

export function CommentsPanel({
  type,
  slug,
}: {
  type: ContentType;
  slug: string;
}) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isDesktop = useSyncExternalStore(subscribe, desktop, () => false);
  const [open, setOpen] = useState(false);

  // Comment Mode: "auth" or "guest"
  const [commentMode, setCommentMode] = useState<"auth" | "guest">("auth");

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

  const user = session?.user;

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

    const activeProfile: GuestProfile = user
      ? {
          name: user.name || "Authenticated User",
          email: user.email || "auth@user.com",
          github: user.name || "",
          linkedin: "",
          twitter: "",
        }
      : profile;

    if (!siteKey || !token || !validProfile(activeProfile) || !content.trim()) {
      setStatus("Complete your comment and security check.");
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
          profile: activeProfile,
          content,
          turnstileToken: token,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to post comment.");
      setContent("");
      setStatus("Comment posted successfully.");
      toast.success("Comment posted!");
      await load();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unable to post comment.";
      setStatus(msg);
      toast.error(msg);
    } finally {
      setToken("");
      captcha.current?.reset();
      setBusy(false);
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted successfully.");
    } catch {
      toast.error("Failed to delete comment.");
    }
  };

  const fields = ["name", "email", "github", "linkedin", "twitter"] as const;

  const body = (
    <div className="space-y-6 pb-10 text-sm">
      {/* Mode Selector / Auth Status */}
      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  user.image ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`
                }
                alt={user.name || "User Avatar"}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30"
              />
              <div>
                <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  {user.name}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary/10 text-primary font-medium">
                    Verified Member
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  You can delete your comments at any time.
                </p>
              </div>
            </div>
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Signed In
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              Choose how to comment:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                  commentMode === "auth"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in to comment
              </Link>
              <button
                type="button"
                onClick={() => setCommentMode("guest")}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  commentMode === "guest"
                    ? "bg-muted text-foreground border-border font-semibold"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Continue as Guest
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guest Profile Form (if Guest mode selected and not signed in) */}
      {!user && commentMode === "guest" && (
        <>
          {editing ? (
            <form
              onSubmit={saveProfile}
              className="space-y-3 p-4 rounded-xl border border-border bg-card"
            >
              <p className="text-xs text-muted-foreground">
                Guest comments require profile verification. Saved locally in
                your browser cookies.
              </p>
              {fields.map((field) => (
                <label
                  key={field}
                  className="block space-y-1 font-medium text-xs capitalize"
                >
                  {field}
                  {field === "github" ||
                  field === "linkedin" ||
                  field === "twitter"
                    ? " (optional)"
                    : ""}
                  <input
                    required={field === "name" || field === "email"}
                    type={field === "email" ? "email" : "text"}
                    maxLength={
                      field === "email" ? 254 : field === "name" ? 80 : 39
                    }
                    value={profile[field]}
                    onChange={(event) =>
                      setProfile((old) => ({
                        ...old,
                        [field]: event.target.value,
                      }))
                    }
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-primary text-xs"
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
              <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground cursor-pointer">
                Save Guest Profile
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3 bg-muted/30">
              {profileLinks(profile).avatar ? (
                <img
                  src={profileLinks(profile).avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs"
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs">
                Commenting as Guest:{" "}
                <strong className="text-foreground">{profile.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-primary underline cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}
        </>
      )}

      {/* Main Comment Form */}
      {(user || (!user && commentMode === "guest" && !editing)) && (
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1.5 text-xs font-medium">
            <span>Your comment</span>
            <textarea
              required
              minLength={2}
              maxLength={1500}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                user ? "Write your thoughts..." : "Share your feedback..."
              }
              rows={4}
              className="block w-full resize-y rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary placeholder:text-muted-foreground/60"
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
            <p className="text-xs text-muted-foreground">
              Comments security check active.
            </p>
          )}
          <button
            disabled={busy || !token}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {busy ? "Posting…" : "Post Comment"}
          </button>
        </form>
      )}

      {status && (
        <p role="status" className="text-xs text-primary font-medium">
          {status}
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
          Recent Comments ({comments.length})
        </h3>
        {loading && !loaded && (
          <p role="status" className="text-xs text-muted-foreground">
            Loading discussion...
          </p>
        )}
        {comments.map((comment) => {
          const parsed = parseGuestComment(comment.text);
          const isOwnComment =
            user && (comment.userId === user.id || parsed.name === user.name);

          return (
            <article
              key={comment.id}
              className="rounded-xl border border-border/80 p-4 bg-card/50 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {parsed.avatar &&
                  parsed.avatar.startsWith("https://github.com/") ? (
                    <img
                      src={parsed.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-7 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                    >
                      {parsed.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                      {parsed.name}
                      {isOwnComment && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold">
                          You
                        </span>
                      )}
                    </p>
                    <time
                      className="text-[10px] text-muted-foreground"
                      dateTime={comment.created_time}
                    >
                      {new Date(comment.created_time).toLocaleDateString()}
                    </time>
                  </div>
                </div>

                {isOwnComment && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                    title="Delete your comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="whitespace-pre-wrap break-words leading-relaxed text-xs text-foreground/90">
                {parsed.body}
              </p>
            </article>
          );
        })}
        {loaded && !comments.length && (
          <p className="text-xs text-muted-foreground">
            No comments posted yet. Be the first!
          </p>
        )}
        {cursor && (
          <button
            disabled={loading}
            onClick={() => void load(cursor)}
            className="text-xs text-primary underline cursor-pointer"
          >
            {loading ? "Loading…" : "Load more comments"}
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
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
      >
        <MessageSquare className="size-4 text-primary" aria-hidden />
        Discussion & Comments
      </button>
      {isDesktop ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetPopup side="right">
            <SheetHeader>
              <SheetTitle>Community Discussion</SheetTitle>
              <SheetDescription>
                Share feedback or ask questions about this content.
              </SheetDescription>
            </SheetHeader>
            <SheetPanel>{body}</SheetPanel>
          </SheetPopup>
        </Sheet>
      ) : (
        <Drawer open={open} onOpenChange={setOpen} position="bottom">
          <DrawerPopup showCloseButton className="max-h-[85dvh]">
            <DrawerHeader>
              <DrawerTitle>Community Discussion</DrawerTitle>
              <DrawerDescription>
                Share feedback or ask questions about this content.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>{body}</DrawerPanel>
          </DrawerPopup>
        </Drawer>
      )}
    </section>
  );
}
