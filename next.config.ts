import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
