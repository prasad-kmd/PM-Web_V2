"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Shield,
  Users,
  Database,
  Receipt,
  Eye,
  Settings,
  Lock,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "invoice" | "analytics"
  >("overview");

  if (isPending) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Verifying administrative access...
          </p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as { role?: string })?.role || "user";

  if (!session?.user || userRole !== "admin") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-500">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold mb-2">Admin Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          This panel is restricted to users with the{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
            admin
          </code>{" "}
          role in the database. Sign in as an administrator or update your user
          role in Supabase PostgreSQL table{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
            "user"
          </code>
          .
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Return to User Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                Superuser
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage system metrics, role permissions, invoice engine, and
              platform features.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border/50 transition-colors"
        >
          User Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 space-x-4 overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Status", icon: Shield },
          { id: "users", label: "User Management", icon: Users },
          { id: "invoice", label: "Invoice Engine (Preview)", icon: Receipt },
          { id: "analytics", label: "Post View Counter (Preview)", icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Database Connected
              </span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">Supabase PG</p>
            <p className="text-xs text-muted-foreground">
              Managed with Drizzle ORM schema
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Session Architecture
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">Stateless JWT</p>
            <p className="text-xs text-muted-foreground">
              5-min cookieCache for zero DB strain
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active Admin
              </span>
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-lg font-bold truncate">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">
              Full Administrative Access
            </p>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">User Role Management</h3>
            <span className="text-xs text-muted-foreground">
              To grant Admin role, set{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                role = 'admin'
              </code>{" "}
              in DB
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-2">
            <p className="font-semibold text-foreground">
              Role Promotion Guide:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In your Supabase SQL Editor or Drizzle Studio (
              <code className="px-1 py-0.5 rounded bg-muted">
                pnpm db:studio
              </code>
              ), run:
            </p>
            <pre className="p-3 rounded-lg bg-background border border-border font-mono text-[11px] text-amber-600 dark:text-amber-400 overflow-x-auto">
              UPDATE "user" SET role = 'admin' WHERE email = '
              {session.user.email}';
            </pre>
          </div>
        </div>
      )}

      {activeTab === "invoice" && (
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Professional Invoice Generator
              </h3>
              <p className="text-xs text-muted-foreground">
                Reserved feature module from PMEngineerLK architecture.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            Invoice generation schema and PDF export pipelines can be mounted
            seamlessly under this admin section when enabled. See full
            implementation guide in{" "}
            <code className="px-1 py-0.5 rounded bg-muted">
              /docs/FUTURE_EXPANSIONS.md
            </code>
            .
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Real-Time Post View Counter
              </h3>
              <p className="text-xs text-muted-foreground">
                Firebase Realtime Database integration blueprint.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            Firebase Realtime DB provides zero-latency post view counters
            without consuming Supabase PostgreSQL write quotas. Detailed
            integration architecture is documented in{" "}
            <code className="px-1 py-0.5 rounded bg-muted">
              /docs/FUTURE_EXPANSIONS.md
            </code>
            .
          </div>
        </div>
      )}
    </div>
  );
}
