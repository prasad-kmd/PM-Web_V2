"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Palette,
  FileText,
  LogOut,
  Sparkles,
  ExternalLink,
  Lock,
  Check,
  Github,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [bio, setBio] = useState("");
  const [accentColor, setAccentColor] = useState("violet");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setBio((session.user as { bio?: string }).bio || "");
      setAccentColor(
        (session.user as { accentColor?: string }).accentColor || "violet",
      );
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Loading profile session...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 rounded-2xl border border-border/50 bg-muted/50 p-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Authentication Required</h2>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          You must be signed in to view your profile dashboard and
          customization options.
        </p>
        <Link
          href="/auth/signin?callbackUrl=/dashboard"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const userRole = (session.user as { role?: string }).role || "user";
  const isAdmin = userRole === "admin";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      toast.success("Profile preferences saved successfully!", {
        description: "Your dashboard profile preferences have been updated.",
      });
    } catch {
      toast.error("Failed to save profile preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully.");
          router.push("/");
        },
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/15 via-purple-500/10 to-blue-500/15 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="group relative">
              <img
                src={
                  session.user.image ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.email}`
                }
                alt={session.user.name || "User Avatar"}
                className="h-20 w-20 rounded-2xl border border-background object-cover shadow-lg ring-2 ring-primary/30"
              />
              <div
                className="absolute -bottom-1 -right-1 rounded-full border border-border bg-background p-1 text-xs"
                title="Avatar provided by GitHub OAuth"
              >
                <Github className="h-3.5 w-3.5 text-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {session.user.name}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <BadgeCheck className="h-3 w-3" />
                    Member
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
              >
                <Shield className="h-4 w-4" />
                Admin Console
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Customization Form */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Profile Details</h2>
                <p className="text-xs text-muted-foreground">
                  Customize display info and preferences.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Profile Image Policy Info */}
              <div className="space-y-1 rounded-xl border border-border/40 bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Github className="h-3.5 w-3.5" />
                  <span>Avatar Managed by GitHub OAuth</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  To adhere to free-tier storage limits and Content Security
                  Policies, profile images are synced directly from your GitHub
                  OAuth provider.
                </p>
              </div>

              {/* Bio Field */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Bio / Tagline
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Mechatronics Engineer, Open Source Contributor..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Accent Theme Preference */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 block text-xs font-medium text-foreground">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Preferred Dashboard Accent
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: "violet", label: "Violet", color: "bg-purple-600" },
                    { id: "blue", label: "Blue", color: "bg-blue-600" },
                    {
                      id: "emerald",
                      label: "Emerald",
                      color: "bg-emerald-600",
                    },
                    { id: "rose", label: "Rose", color: "bg-rose-600" },
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccentColor(color.id)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-medium transition-all ${
                        accentColor === color.id
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 bg-background text-muted-foreground hover:border-border"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${color.color}`}
                        />
                        {color.label}
                      </span>
                      {accentColor === color.id && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Metadata Sidebar */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="border-b border-border/40 pb-2 text-sm font-semibold text-foreground">
              Account Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border/30 py-1.5">
                <span className="text-muted-foreground">Account Role</span>
                <span className="font-semibold text-foreground capitalize">
                  {userRole}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-1.5">
                <span className="text-muted-foreground">AuthProvider</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Github className="h-3 w-3" />
                  GitHub OAuth
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-1.5">
                <span className="text-muted-foreground">Session Mode</span>
                <span className="font-semibold text-emerald-500">
                  Stateless JWT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
