"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message || "Could not sign out. Try again.");
        setBusy(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("A network error interrupted sign-out. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid justify-items-end gap-1.5">
      <Button type="button" variant="outline" onClick={signOut} disabled={busy}>
        {busy ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        {busy ? "Signing out…" : "Sign out"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
