"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Section tabs for `/admin`.
 *
 * A client component for one reason: `aria-current` has to reflect the current
 * route, and a layout cannot know which page it is wrapping. `usePathname()` is
 * safe during static rendering, so nothing here needs a Suspense boundary — the
 * contrast with `SignInButton`, which does, is why that one carries its own.
 *
 * The links are real `<Link>`s rather than buttons, so each section is
 * bookmarkable and openable in a new tab.
 */

type Section = {
  href: string;
  label: string;
  /** `true` when only an exact match is active — needed for the index route. */
  exact?: boolean;
};

const SECTIONS: readonly Section[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections">
      <ul className="flex flex-wrap items-center gap-1">
        {SECTIONS.map((section) => {
          const active = section.exact
            ? pathname === section.href
            : pathname === section.href ||
              pathname.startsWith(`${section.href}/`);

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-ink-soft hover:bg-muted hover:text-ink",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
