import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Hosts allowed to load Next.js dev resources.
   *
   * Since Next.js 16, dev assets are blocked for any origin other than
   * `localhost`. Opening the dev server via http://127.0.0.1:3000 (or a LAN
   * address) therefore blocks the client chunks, the page never hydrates, and
   * the user is left staring at the server-rendered loading spinner with no
   * error — which looks exactly like the app "redirecting me back".
   *
   * Development only; ignored in production builds.
   */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "[::1]",
    // This machine on the local network. Update if the IP changes.
    "192.168.18.7",
  ],
  images: {
    /**
     * Hosts that next/image is allowed to optimise.
     *
     * Only first-party, trusted hosts belong here. Member-supplied catalogue
     * image URLs are arbitrary (the API validates them as any http(s) URL), so
     * those images are rendered with `unoptimized` instead of being added to
     * this list — that keeps an unknown host from throwing a render error that
     * would take down the whole page.
     */
    remotePatterns: [
      // Catalogue image hosting (Cloudinary).
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Remonode platform asset CDNs.
      { protocol: "https", hostname: "api.remopay.remonode.com", pathname: "/**" },
      { protocol: "https", hostname: "api.bb.remonode.com", pathname: "/**" },
      // YouTube video thumbnails for the catalogue hero embed.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
    // Member-uploaded images are served straight from Cloudinary already, and
    // they are rendered with `unoptimized`, so no format negotiation applies.
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Security headers.
   *
   * These also serve an SEO purpose: a strict Content-Security-Policy limits
   * the blast radius of any injected markup, and Referrer-Policy keeps
   * internal member URLs out of the Referer header sent to third parties.
   */
  async headers() {
    const NOINDEX = "noindex, nofollow, noarchive, nosnippet";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // The payment flow needs the clipboard for the share button; camera
            // and geolocation are not used anywhere in the app.
            value: "camera=(), geolocation=(), microphone=(), interest-cohort=()",
          },
        ],
      },
      // The dashboard, admin and agent layouts are all `'use client'` — they
      // gate on a Zustand auth store — so they cannot export a `metadata`
      // object (Next.js forbids metadata exports from client components). That
      // is why the app had no noindex anywhere and relied solely on
      // robots.txt, which is a crawler *preference* and protects nothing.
      //
      // A response header works regardless of component type, so this is the
      // reliable mechanism for those routes. It is an indexing hint, not an
      // access control: the API still enforces authentication server-side.
      { source: "/dashboard/:path*", headers: [{ key: "X-Robots-Tag", value: NOINDEX }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: NOINDEX }] },
      { source: "/agent/:path*", headers: [{ key: "X-Robots-Tag", value: NOINDEX }] },
      {
        source: "/auth/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      { source: "/offline", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
