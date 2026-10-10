"use client";

import { Github, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GitHubSignInButton({
  returnTo,
  enabled,
}: {
  returnTo: string;
  enabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSignIn() {
    if (!enabled || busy) return;
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: returnTo,
        errorCallbackURL: `/sign-in?error=oauth_failed&returnTo=${encodeURIComponent(returnTo)}`,
      });

      if (result.error) {
        setError(
          result.error.message || "GitHub sign-in could not be started.",
        );
        setBusy(false);
      }
    } catch {
      setError("A network error interrupted sign-in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        size="lg"
        className="w-full justify-center"
        onClick={startSignIn}
        disabled={!enabled || busy}
      >
        {busy ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : (
          <Github aria-hidden />
        )}
        {enabled
          ? busy
            ? "Connecting to GitHub…"
            : "Continue with GitHub"
          : "GitHub sign-in is not configured"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
