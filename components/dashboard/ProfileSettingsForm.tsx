"use client";

import { Check, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type ProfileSettingsFormProps = {
  initialDisplayName: string;
  initialBio: string;
  fallbackName: string;
};

type ProfileResponse = {
  profile?: { displayName: string | null; bio: string | null };
  error?: string;
};

export function ProfileSettingsForm({
  initialDisplayName,
  initialBio,
  fallbackName,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [savedValues, setSavedValues] = useState({
    displayName: initialDisplayName,
    bio: initialBio,
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDirty =
    displayName !== savedValues.displayName || bio !== savedValues.bio;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || busy) return;

    setBusy(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const result = (await response
        .json()
        .catch(() => null)) as ProfileResponse | null;

      if (!response.ok || !result?.profile) {
        if (response.status === 401) {
          router.replace(
            `/sign-in?returnTo=${encodeURIComponent("/dashboard")}`,
          );
          return;
        }
        setError(result?.error ?? "Your profile could not be saved.");
        return;
      }

      const nextValues = {
        displayName: result.profile.displayName ?? "",
        bio: result.profile.bio ?? "",
      };
      setDisplayName(nextValues.displayName);
      setBio(nextValues.bio);
      setSavedValues(nextValues);
      setStatus("Profile saved.");
    } catch {
      setError("A network error interrupted the save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const publicName = displayName.trim() || fallbackName;

  return (
    <div className="grid gap-5">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
      >
        <div className="border-b border-border/70 bg-muted/30 px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Public profile
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold leading-tight text-foreground">
            Profile details
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Set how your name and short bio appear in member features.
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-1.5">
            <label
              htmlFor="profile-display-name"
              className="text-sm font-medium text-foreground"
            >
              Display name
            </label>
            <input
              id="profile-display-name"
              name="displayName"
              autoComplete="nickname"
              maxLength={40}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={fallbackName}
              disabled={busy}
              aria-describedby="profile-display-name-help"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
            />
            <p
              id="profile-display-name-help"
              className="text-xs leading-5 text-muted-foreground"
            >
              Leave blank to use your GitHub name. Up to 40 characters.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="profile-bio"
              className="text-sm font-medium text-foreground"
            >
              Short bio
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={4}
              maxLength={160}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="A little about what you work on…"
              disabled={busy}
              aria-describedby="profile-bio-help profile-bio-count"
              className="min-h-24 resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3 text-xs leading-5 text-muted-foreground">
              <p id="profile-bio-help">
                Keep it brief and suitable for a public profile.
              </p>
              <span id="profile-bio-count" aria-live="polite">
                {bio.length}/160
              </span>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {status ? (
            <p role="status" className="text-sm text-primary">
              {status}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <p className="text-xs text-muted-foreground">
              Your GitHub avatar is fixed and cannot be uploaded or replaced
              here.
            </p>
            <Button type="submit" disabled={!isDirty || busy}>
              {busy ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : status && !isDirty ? (
                <Check aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>
      </form>

      <section
        aria-labelledby="profile-preview-heading"
        className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Preview
            </p>
            <h2
              id="profile-preview-heading"
              className="mt-1 text-sm font-semibold text-foreground"
            >
              How your profile reads
            </h2>
          </div>
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Member profile
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-border/70 bg-background p-4">
          <p className="font-medium text-foreground">{publicName}</p>
          <p className="mt-1 min-h-5 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
            {bio.trim() || "Your short bio will appear here."}
          </p>
        </div>
      </section>
    </div>
  );
}
