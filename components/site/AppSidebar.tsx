"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Boxes,
  FolderKanban,
  Github,
  GraduationCap,
  Linkedin,
  Moon,
  Newspaper,
  PanelLeftIcon,
  Sun,
  Twitter,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import { siteConfig } from "@/lib/config";
import { applyTheme, getDocumentTheme, subscribeTheme } from "@/lib/theme";

const NAV_ITEMS: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Portfolio", href: "/portfolio", icon: FolderKanban },
  { name: "Blog", href: "/blog", icon: Newspaper },
  { name: "Projects", href: "/projects", icon: Boxes },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Tutorials", href: "/tutorials", icon: GraduationCap },
];

const SOCIALS = [
  { label: "GitHub", href: siteConfig.socialLinks.github, icon: Github },
  { label: "Twitter", href: siteConfig.socialLinks.twitter, icon: Twitter },
  { label: "LinkedIn", href: siteConfig.socialLinks.linkedin, icon: Linkedin },
] as const;

function SidebarNavLink({
  name,
  href,
  icon: Icon,
}: {
  name: string;
  href: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const active = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={name}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <Icon />
          <span>{name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ThemeRailButton() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getDocumentTheme,
    () => "light" as const,
  );
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Light mode" : "Dark mode";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <SidebarMenuButton
      tooltip={label}
      aria-label={`Switch to ${next} theme`}
      onClick={() => applyTheme(next)}
    >
      <Icon />
      <span>{label}</span>
    </SidebarMenuButton>
  );
}

function SidebarBrand() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeader className="group/brand relative">
      <div className="flex items-center gap-1">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="PrasadM"
              className="transition-opacity group-data-[collapsible=icon]:group-hover/brand:opacity-0"
            >
              <Link href="/">
                <span className="flex size-8 shrink-0 items-center justify-center bg-hazard font-display text-sm text-paper">
                  P
                </span>
                <span className="grid min-w-0 text-left leading-tight">
                  <span className="truncate font-display text-base tracking-wide">
                    {siteConfig.name}
                  </span>
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                    {siteConfig.revision}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger
          className="shrink-0 text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          aria-label="Collapse sidebar"
        />
      </div>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Expand sidebar"
        className="pointer-events-none absolute inset-1 z-10 hidden items-center justify-center text-sidebar-foreground opacity-0 group-data-[collapsible=icon]:flex group-hover/brand:pointer-events-auto group-hover/brand:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
      >
        <PanelLeftIcon className="size-4" />
      </button>
    </SidebarHeader>
  );
}

export function AppSidebar() {
  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="z-40 border-r-2 border-sidebar-border"
    >
      <SidebarBrand />

      <SidebarContent>
        <nav aria-label="Site">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarNavLink key={item.href} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeRailButton />
          </SidebarMenuItem>
        </SidebarMenu>
        <div
          role="group"
          aria-label="Social"
          className="flex items-center justify-center gap-1 px-1 group-data-[collapsible=icon]:flex-col"
        >
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              title={social.label}
              className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              <social.icon className="size-4" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
