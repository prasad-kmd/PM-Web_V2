/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict type checking during build
    ignoreBuildErrors: true,
  },
  /* Tree-shake the big barrel-export packages so a page only downloads the
     icons/components it actually uses instead of the whole entry point. */
  experimental: {
    // Only packages that are known to ship a single big barrel entry point and
    // that this project actually depends on — anything unknown here would just
    // produce a warning at build time.
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "radix-ui",
      "recharts",
      "sonner",
    ],
  },
  compiler: {
    // Strip debug logging from production bundles (keeps warnings/errors).
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  async rewrites() {
    const isEu = process.env.NEXT_PUBLIC_POSTHOG_HOST?.includes("eu");
    const ingestHost = isEu
      ? "https://eu.i.posthog.com"
      : "https://us.i.posthog.com";
    const assetsHost = isEu
      ? "https://eu-assets.i.posthog.com"
      : "https://us-assets.i.posthog.com";

    return [
      {
        source: "/ingest/static/:path*",
        destination: `${assetsHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${ingestHost}/:path*`,
      },
      {
        source: "/ingest/decide",
        destination: `${ingestHost}/decide`,
      },
    ];
  },
  images: {
    // Enable Next.js image optimization
    unoptimized: false, // Keeping true to avoid complex localPattern issues with query strings during build
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.notion.so",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      // Optional safety: older CheapShark thumbs sometimes used this
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "www.cheapshark.com" },
      // CheapShark thumbs can come from store CDNs; example shown in CheapShark docs:
      { protocol: "https", hostname: "cdn.fanatical.com" },
      // (Optional) seen in CheapShark usage examples in the wild:
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "prasadm.vercel.app" },
      { protocol: "https", hostname: "prasadm.vercel.app/img/*" },
      { protocol: "https", hostname: "ghchart.rshah.org/409ba5/prasad-kmd" },
      new URL("https://prasadm.vercel.app/img/**"),
    ],
    formats: ["image/webp", "image/avif"],
    dangerouslyAllowSVG: true, // For LQIP shimmers
    contentDispositionType: "attachment", // Security for downloads
  },
  // Add security headers including CSP
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://gist.github.com https://challenges.cloudflare.com https://turnstile.cloudflare.com https://va.vercel-scripts.com https://*.posthog.com;
      style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
      img-src 'self' blob: data: https://prasadm.vercel.app https://*.notion.so https://*.amazonaws.com https://i.pravatar.cc https://placehold.co https://images.unsplash.com https://*.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://avatar.vercel.sh https://*.githubusercontent.com https://*.googleusercontent.com https://challenges.cloudflare.com https://*.posthog.com https://image.tmdb.org https://ghchart.rshah.org/409ba5/prasad-kmd;
      font-src 'self' data:;
      connect-src 'self' blob: data: https://api.notion.com https://api.telegram.org https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.googleusercontent.com https://*.githubusercontent.com https://*.amazonaws.com https://i.pravatar.cc https://placehold.co https://images.unsplash.com https://*.unsplash.com https://challenges.cloudflare.com https://turnstile.cloudflare.com https://vitals.vercel-analytics.com https://api.vercel.com https://*.posthog.com http://localhost:3000 https://localhost:3000 ws://localhost:3000 wss://localhost:3000 https://cheapshark.com https://openlibrary.org https://api.codetabs.com https://export.arxiv.org;
      frame-src 'self' https://www.youtube.com https://challenges.cloudflare.com https://turnstile.cloudflare.com;
      worker-src 'self' blob: https://challenges.cloudflare.com;
      ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Tells agents which llms.txt describes the page they just loaded
            // (llmstxt.org recommends this link relation for discovery).
            key: "Link",
            value: '</llms.txt>; rel="describedby"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
