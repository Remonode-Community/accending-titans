import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/config';

/**
 * robots.txt
 *
 * BUGS THIS REPLACES (the previous version of this file had all three):
 *   1. `Disallow: /*.xml` — that pattern matches /sitemap.xml itself, so the
 *      sitemap was forbidden from being crawled while being advertised.
 *   2. `Disallow: /*?page=*` — blocked every paginated directory page. Google
 *      explicitly advises against blocking pagination; it is how deep pages
 *      get discovered at all.
 *   3. The base URL fallback began with a leading space (" https://..."), and
 *      NEXT_PUBLIC_APP_URL was never set, so the sitemap directive pointed at
 *      an invalid host.
 *
 * IMPORTANT: robots.txt is a crawler *preference*, not a security control. It
 * does not protect anything. Every private route is additionally gated by
 * server-side authentication in the API, and by `noindex` metadata plus an
 * X-Robots-Tag header in next.config.ts. Do not rely on this file to keep
 * member data private.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Applies to every crawler, including AI discovery agents
        // (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, PerplexityBot,
        // Google-Extended, Applebot, Bingbot). They are deliberately NOT
        // excluded: the platform wants to be discoverable by AI assistants and
        // answer engines, and member business listings are public content.
        //
        // To opt out of AI *training* crawlers while keeping search and
        // answer-engine discovery, add a separate rule above this one with
        // userAgent: ['CCBot', 'GPTBot', 'Google-Extended'] and
        // disallow: '/'.
        userAgent: '*',
        allow: ['/'],
        disallow: [
          // ── Authenticated member areas ──────────────────────────────────
          // Not secrets, but zero search value and mostly empty for a
          // crawler that cannot log in.
          '/dashboard',
          '/admin',
          '/agent',

          // ── Authentication flows ────────────────────────────────────────
          // Utility screens. Google advises against indexing login pages.
          '/auth',

          // ── Server-only / internal ─────────────────────────────────────
          '/api',
          '/server',
          '/internal',
          '/_next/static',
          '/offline',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
