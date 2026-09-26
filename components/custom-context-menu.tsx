"use client";

import React, { useCallback, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Copy,
  ExternalLink,
  Link2,
  Info,
  Mail,
  Github,
  FileCode,
  Moon,
  Sun,
  Clipboard,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useSyncExternalStore } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPanel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroupLabel,
  ContextMenuGroup,
} from "@/components/animate-ui/components/base/context-menu";
import BorderGlowTheme from "@/components/reactbits/BorderGlowTheme";
import { getDocumentTheme, subscribeTheme, applyTheme } from "@/lib/theme";
import { siteConfig } from "@/lib/config";

export function CustomContextMenu({ children }: { children: React.ReactNode }) {
  const [targetLink, setTargetLink] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [isSmall, setIsSmall] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getDocumentTheme, () => "light" as const);

  React.useEffect(() => {
    const check = () => setIsSmall(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isSmall) return;

    const target = e.target as HTMLElement;
    const linkEl = target.closest("a") as HTMLAnchorElement | null;
    const imgEl = target.closest("img") as HTMLImageElement | null;

    if (linkEl && linkEl.href) {
      setTargetLink(linkEl.href);
    } else {
      setTargetLink(null);
    }

    if (imgEl && imgEl.src) {
      setTargetImage(imgEl.src);
    } else {
      setTargetImage(null);
    }
  }, [isSmall]);

  if (isSmall) {
    return <>{children}</>;
  }

  const copyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full min-h-screen" onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>

      <ContextMenuPanel className="w-[300px] p-0 overflow-visible rounded-[14px] border-0 bg-transparent shadow-none">
        {/* BorderGlow shell — theme-aware glow around the menu */}
        <BorderGlowTheme
          borderRadius={14}
          glowIntensity={0.9}
          edgeSensitivity={32}
          variant="violet"
          className="w-full"
        >
          <div className="relative rounded-[14px] overflow-hidden bg-popover/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Header — page info */}
          {/* <div className="px-3.5 pt-3 pb-2.5 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[11px] font-medium">
                P
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium tracking-tight leading-none truncate">PrasadM • Portfolio</p>
                
              </div>
              <button
                onClick={() => {
                  const next = theme === "dark" ? "light" : "dark";
                  applyTheme(next);
                  toast.success(`Switched to ${next} mode`);
                }}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-card text-ink-soft hover:text-ink hover:border-border-strong transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </button>
            </div>
          </div> */}

          <div className="p-1.5">
            {targetLink && (
              <>
                <ContextMenuGroup>
                  <ContextMenuGroupLabel>Link • {new URL(targetLink).hostname}</ContextMenuGroupLabel>
                  <ContextMenuItem
                    onClick={() => {
                      window.open(targetLink, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="size-4" />
                    Open in new tab
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => copyText(targetLink, "Link copied")}>
                    <Link2 className="size-4" />
                    Copy link address
                  </ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
              </>
            )}

            {targetImage && (
              <>
                <ContextMenuGroup>
                  <ContextMenuGroupLabel>Image</ContextMenuGroupLabel>
                  <ContextMenuItem
                    onClick={() => {
                      window.open(targetImage, "_blank");
                    }}
                  >
                    <ExternalLink className="size-4" />
                    Open image in new tab
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => copyText(targetImage, "Image URL copied")}>
                    <Copy className="size-4" />
                    Copy image URL
                  </ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
              </>
            )}

            <ContextMenuGroup>
              <ContextMenuGroupLabel>Navigation</ContextMenuGroupLabel>
              <ContextMenuItem onClick={() => window.history.back()}>
                <ArrowLeft className="size-4" />
                Back
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">Alt+←</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => window.history.forward()}>
                <ArrowRight className="size-4" />
                Forward
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">Alt+→</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => window.location.reload()}>
                <RotateCw className="size-4" />
                Reload
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">⌘R</span>
              </ContextMenuItem>
            </ContextMenuGroup>

            <ContextMenuSeparator />

            <ContextMenuGroup>
              <ContextMenuGroupLabel>Page</ContextMenuGroupLabel>
              <ContextMenuItem onClick={() => (window.location.href = "/")}>
                <Home className="size-4" />
                Go to home
              </ContextMenuItem>
              <ContextMenuItem onClick={() => copyText(window.location.href, "Page URL copied")}>
                <Clipboard className="size-4" />
                Copy page URL
              </ContextMenuItem>
              <ContextMenuItem
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: document.title, url: window.location.href });
                    } catch {}
                  } else {
                    copyText(window.location.href, "Page URL copied for sharing");
                  }
                }}
              >
                <Share2 className="size-4" />
                Share page
              </ContextMenuItem>
            </ContextMenuGroup>

            {/* <ContextMenuSeparator /> */}

            {/* <ContextMenuGroup>
              <ContextMenuGroupLabel>Explore</ContextMenuGroupLabel>
              <ContextMenuItem onClick={() => (window.location.href = "/projects")}>
                <FileCode className="size-4" />
                View projects
              </ContextMenuItem>
              <ContextMenuItem onClick={() => (window.location.href = "/blog")}>
                <Copy className="size-4" />
                Read blog
              </ContextMenuItem>
              <ContextMenuItem onClick={() => window.open(siteConfig.socialLinks.github, "_blank")}>
                <Github className="size-4" />
                GitHub • prasad-kmd
              </ContextMenuItem>
            </ContextMenuGroup> */}

            {/* <ContextMenuSeparator /> */}

            {/* <ContextMenuGroup>
              <ContextMenuItem onClick={() => (window.location.href = "/about")}>
                <Info className="size-4" />
                About site
              </ContextMenuItem>
              <ContextMenuItem onClick={() => (window.location.href = "/contact")}>
                <Mail className="size-4" />
                Contact developer
              </ContextMenuItem>
            </ContextMenuGroup> */}
          </div>

          {/* <div className="px-3 py-2 border-t border-border/60 bg-muted/20 flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">PM-Web_V2 • Studio Clean</span>
            <span className="font-mono text-[10px] text-muted-foreground">{theme}</span>
          </div> */}
          </div>
        </BorderGlowTheme>
      </ContextMenuPanel>
    </ContextMenu>
  );
}
