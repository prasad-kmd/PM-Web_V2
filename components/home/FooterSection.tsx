"use client";

import Link from "next/link";
import Image from "next/image";
import {
  GitBranch,
  AtSign,
  Briefcase,
  Mail,
  ArrowUpRight,
  Globe,
  Shield,
  Terminal,
  Rss,
} from "lucide-react";
import { siteConfig } from "@/lib/config";

const EXPLORE_LINKS = [
  { name: "Portfolio", href: "/portfolio" },
  { name: "Blog", href: "/blog" },
  { name: "Projects", href: "/projects" },
  { name: "Tools", href: "/tools" },
  { name: "Tutorials", href: "/tutorials" },
  { name: "Glossary", href: "/glossary" },
] as const;

const PROJECT_LINKS = [
  { name: "About Me", href: "/about" },
  { name: "What's Now", href: "/now" },
  { name: "Setup / Uses", href: "/uses" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Changelog", href: "/changelog" },
  { name: "Open Source", href: "/open-source" },
] as const;

const LEGAL_LINKS = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-and-conditions" },
  { name: "Disclaimer", href: "/disclaimer" },
  { name: "Accessibility", href: "/accessibility" },
  { name: "Security", href: "/security" },
] as const;

const SOCIALS = [
  { icon: GitBranch, href: siteConfig.socialLinks.github, label: "GitHub" },
  { icon: AtSign, href: siteConfig.socialLinks.twitter, label: "Twitter" },
  { icon: Briefcase, href: siteConfig.socialLinks.linkedin, label: "LinkedIn" },
  { icon: Rss, href: "/feed.xml", label: "RSS Feed" },
  { icon: Mail, href: "/contact", label: "Contact" },
] as const;

function FooterColumn({
  icon: Icon,
  title,
  links,
}: {
  icon: typeof Terminal;
  title: string;
  links: ReadonlyArray<{ readonly name: string; readonly href: string }>;
}) {
  return (
    <div>
      <h3 className="mozilla-headline mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} /> {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="google-sans group flex items-center text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              {link.name}
              <ArrowUpRight className="ml-1 h-3 w-3 -translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Section 06 — footer adapted from the PMEngineerLK reference footer,
 * compacted to sit inside one viewport on desktop.
 */
export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      aria-label="Site footer"
      className="snap-section relative overflow-hidden border-t-2 border-ink bg-card/40 backdrop-blur-md md:h-dvh md:overflow-hidden"
    >
      {/* Decorative background elements with animations */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
        <div
          className="animate-blob absolute left-[-10%] top-[-10%] h-[60%] w-[40%] rounded-full bg-primary/15 blur-[120px]"
          style={{ animationDuration: "25s" }}
        />
        <div
          className="animate-blob absolute bottom-[-10%] right-[-10%] h-[70%] w-[50%] rounded-full bg-primary/10 blur-[140px]"
          style={{ animationDuration: "30s", animationDelay: "-10s" }}
        />
        <div
          className="animate-blob absolute right-[10%] top-[20%] h-[40%] w-[30%] rounded-full bg-primary/10 blur-[100px]"
          style={{ animationDuration: "35s", animationDelay: "-20s" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10 md:flex md:h-full md:flex-col md:justify-center md:pt-0">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8 lg:grid-cols-5">
          {/* Logo and brand identity */}
          <div className="md:col-span-2 lg:col-span-2">
            <Link href="/" className="group mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 p-1.5 shadow-sm transition-all group-hover:bg-primary">
                <Image
                  src="/svg/pm4.svg"
                  alt="PrasadM logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="mozilla-headline text-2xl font-bold tracking-tight">
                  PrasadM
                </span>
                <p className="google-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  Engineering Portfolio
                </p>
              </div>
            </Link>
            <p className="google-sans mb-5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <social.icon className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>

          <FooterColumn icon={Terminal} title="Explore" links={EXPLORE_LINKS} />
          <FooterColumn icon={Globe} title="Project" links={PROJECT_LINKS} />
          <FooterColumn icon={Shield} title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:mt-8">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="google-sans text-xs text-muted-foreground">
              © {currentYear} PrasadM. Documenting Engineering Excellence.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground/60">
              Built with Next.js 16 &amp; Tailwind CSS 4 — local type only
            </p>
          </div>

          <Link
            href="/status"
            className="flex items-center gap-4 rounded-full border border-border/50 bg-muted/30 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-muted/50"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="google-sans text-[10px] font-medium uppercase tracking-tighter text-muted-foreground">
              Systems Operational
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
