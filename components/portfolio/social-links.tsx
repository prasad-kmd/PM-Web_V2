import { Github, Linkedin, Twitter, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/config";

const SOCIAL_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "GitHub", href: siteConfig.socialLinks.github, icon: Github },
  { label: "LinkedIn", href: siteConfig.socialLinks.linkedin, icon: Linkedin },
  { label: "Twitter / X", href: siteConfig.socialLinks.twitter, icon: Twitter },
];

/** External social profile links — plain anchors, opened in a new tab. */
export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition-colors hover:border-primary/40 hover:text-ink"
          >
            <link.icon className="size-3.5" aria-hidden />
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
