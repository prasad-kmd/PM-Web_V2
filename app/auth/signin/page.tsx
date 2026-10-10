"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Github,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Lock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Failed to initiate GitHub Sign-In", {
        description:
          error.message || "Please check your network and try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to PM-Web
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Sign in to customize your profile, leave managed comments, and access
          developer tools.
        </p>
      </div>

      {/* Redirect Info Banner */}
      {callbackUrl && callbackUrl !== "/dashboard" && (
        <div className="mb-6 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            You will automatically return to{" "}
            <strong className="font-semibold text-primary">
              {callbackUrl}
            </strong>{" "}
            after authentication.
          </span>
        </div>
      )}

      {/* Auth Actions */}
      <div className="space-y-4">
        <button
          onClick={handleGitHubSignIn}
          disabled={loading}
          className="w-full relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            <>
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </>
          )}
        </button>

        {/* Email Notice */}
        <div className="mt-6 p-3.5 rounded-xl bg-muted/50 border border-border/40 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Why GitHub only?</span>
          </div>
          <p className="leading-relaxed">
            Email registration is currently unavailable to avoid unverified spam
            and maintain lightweight free-tier infrastructure. GitHub provides
            instant, safe OAuth authentication.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t border-border/40 text-center">
        <Link
          href={callbackUrl}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to previous page
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground">
            Loading authentication portal...
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </div>
  );
}
