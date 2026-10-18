/**
 * The route registry — the one module that knows which URLs this site has.
 *
 * Four separate navigation surfaces (floating navbar, sidebar, mobile dock,
 * footer) each used to hold their own copy of the link list, which is how
 * `/tools` came to be linked from four places while no `/tools` route existed.
 * Nothing caught it because nothing compared the two. Now there is one list, and
 * `verification/nav.test.mjs` resolves every entry against the filesystem — so a
 * link to a page that does not exist fails a check instead of a reader.
 *
 * **Dependency-free on purpose.** `proxy.ts` imports `PROTECTED_ROUTES` from
 * here, and the proxy runs in Next's edge runtime; pulling a component or an
 * icon into this module would drag the React tree into that bundle. Plain data
 * only. Surfaces map `icon` names to components themselves.
 */

/** A link in a navigation surface. `href` must be a route that exists. */
export type NavItem = {
  readonly label: string;
  readonly href: string;
};

/**
 * A link that points at a page which is **planned but not built**. Kept visible
 * so the intended information architecture does not get lost, and listed
 * separately so the dead-link check can tell "planned" from "broken".
 *
 * When you build one of these pages, delete its entry — `nav.test.mjs` asserts
 * that a pending route still does *not* resolve, so building it turns the check
 * red until you clean up the list.
 */
export type PendingNavItem = NavItem & {
  /** Which phase is expected to build it. */
  readonly phase: string;
};

/** Floating navbar and the mobile dock. Both are icon-only, so no icons here. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Tools", href: "/tools" },
];

/** The desktop sidebar rail. */
export const SIDEBAR_NAV: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Articles", href: "/articles" },
  { label: "Projects", href: "/projects" },
  { label: "Tools", href: "/tools" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Glossary", href: "/glossary" },
  { label: "Saved", href: "/bookmarks" },
  { label: "Contact", href: "/contact" },
];

/** Footer column 1 — every target exists. */
export const FOOTER_EXPLORE: readonly NavItem[] = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "Tools", href: "/tools" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Glossary", href: "/glossary" },
];

/**
 * Footer column 2 — the "about the site" group.
 *
 * Only `/about` is a page today. The rest were live links to pages that were
 * never built; they are marked pending rather than silently 404-ing a reader who
 * clicks one.
 *
 * **Phase 5 removed `/roadmap` and `/changelog` from this list.** Both describe
 * the repository, not the site, and the only reason to build them was to render
 * `CHANGELOG.md` and the planning pack on a page — which means Markdown to HTML,
 * which means `dangerouslySetInnerHTML`, which `RULES.md` §4 forbids and which
 * no convenience is worth re-opening. A reader who wants them gets them from the
 * repository, where they already are, exactly as written.
 *
 * The three that remain are waiting on content only the owner can write. The
 * label is a promise the footer is careful not to dress up as a link.
 */
export const FOOTER_PLATFORM: readonly PendingNavItem[] = [
  { label: "About Me", href: "/about", phase: "shipped" },
  { label: "What's Now", href: "/now", phase: "pending" },
  { label: "Setup / Uses", href: "/uses", phase: "pending" },
  { label: "Open Source", href: "/open-source", phase: "pending" },
];

/**
 * Footer column 3 — governance.
 *
 * `SECURITY.md`, `CONTRIBUTING.md` and the rest (Phase 6) are repository files,
 * not pages. A reader clicking "Security" expects a page, so either these become
 * pages rendering the same content or the links move to the repository itself.
 */
export const FOOTER_LEGAL: readonly PendingNavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy", phase: "Phase 6" },
  { label: "Terms of Service", href: "/terms-and-conditions", phase: "Phase 6" },
  { label: "Disclaimer", href: "/disclaimer", phase: "Phase 6" },
  { label: "Accessibility", href: "/accessibility", phase: "shipped" },
  { label: "Security", href: "/security", phase: "Phase 6" },
];

/** Auth and private routes. Named so no surface hand-writes a path. */
export const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  notAuthorized: "/not-authorized",
  dashboard: "/dashboard",
  admin: "/admin",
} as const;

/** Where a reader goes after signing in when their origin is unknown. */
export const DEFAULT_SIGNED_IN_PATH = AUTH_ROUTES.dashboard;

/** Where a reader goes after signing out. */
export const DEFAULT_SIGNED_OUT_PATH = "/";

export type ProtectedRoute = {
  readonly path: string;
  readonly scope: "user" | "admin";
};

/**
 * Routes `proxy.ts` gates. Kept short and explicit on purpose — a broad matcher
 * that accidentally covers a public page locks readers out of the site, and that
 * failure is much worse than a missing convenience redirect.
 *
 * This is a convenience gate, not the security boundary: each page calls
 * `requireUser` / `requireAdmin` from `lib/auth/server.ts` as well.
 */
export const PROTECTED_ROUTES: readonly ProtectedRoute[] = [
  { path: AUTH_ROUTES.dashboard, scope: "user" },
  { path: AUTH_ROUTES.admin, scope: "admin" },
];

/**
 * Never indexed, never in the sitemap.
 *
 * `/tools` is here because it is deliberately a thin "coming soon" page: it
 * should not rank, but links to it should still pass signal (`follow: true`).
 * Every other entry is a private or auth route that has no business in a search
 * index at all (`follow: false`).
 */
export const NON_INDEXABLE_ROUTES: readonly string[] = [
  AUTH_ROUTES.signIn,
  AUTH_ROUTES.signUp,
  AUTH_ROUTES.notAuthorized,
  AUTH_ROUTES.dashboard,
  AUTH_ROUTES.admin,
  "/tools",
];

/** Pending routes, flattened — consumed by the dead-link check. */
export const PENDING_ROUTES: readonly PendingNavItem[] = [
  ...FOOTER_PLATFORM,
  ...FOOTER_LEGAL,
].filter((item) => item.phase !== "shipped");
