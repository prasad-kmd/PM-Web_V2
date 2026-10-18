import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content-metadata";
import { NON_INDEXABLE_ROUTES } from "@/lib/nav";

/**
 * `robots.txt`.
 *
 * Before v2.9.0 this file did not exist, so Next served a default that allowed
 * everything — including `/admin` and `/dashboard`. Those pages already set
 * `robots: { index: false }` on themselves and the sitemap already excluded
 * them, so nothing was being indexed; this closes the third door for
 * consistency rather than to fix a leak.
 *
 * **`Disallow` is not an access control.** A crawler that ignores it, or any
 * person who simply types the URL, is handled by `proxy.ts` and by the
 * `requireUser`/`requireAdmin` call inside each page. The rules below exist so
 * that honest crawlers do not spend budget on pages nobody may read.
 *
 * The list comes from `NON_INDEXABLE_ROUTES` for the same reason
 * `app/sitemap.ts` reads it: a page that declares `index: false` is a page
 * absent from the sitemap *and* disallowed here, and there is one list to edit.
 * `/api/` is added on top — it is not a page, so it has no metadata of its own
 * to state an intent with.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /**
         * Paths are emitted bare rather than with a trailing slash.
         *
         * robots.txt matches by literal prefix, so `Disallow: /admin/` would
         * block `/admin/users` while leaving `/admin` itself crawlable — exactly
         * the wrong way round. The bare form covers the page and everything
         * beneath it; the cost is that `/admin` also matches a hypothetical
         * `/administrator`, which is not a route and is not going to be one.
         */
        disallow: [...NON_INDEXABLE_ROUTES, "/api/"],
      },
    ],
    /**
     * `sitemap` is absolute, as the directive requires. `host` is deliberately
     * not emitted: it is a Yandex directive that wants a bare hostname, and
     * `SITE_URL` carries a scheme, so writing it would publish a malformed line.
     */
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
