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
  },
};

export default nextConfig;
