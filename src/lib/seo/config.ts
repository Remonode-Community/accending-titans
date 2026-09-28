/**
 * Single source of truth for SEO identity.
 *
 * Everything that could ever disagree between the root layout, robots.txt,
 * the sitemap and JSON-LD reads from here. If the domain, brand or contact
 * details change, this is the only file that should need editing.
 *
 * PLACEHOLDER NOTICE
 * ------------------
 * The contact details below are NOT verified. Rather than publish invented
 * values in structured data (which is a manual-action risk), the schema
 * builders in ./schema.ts OMIT any field left as `null`. So today the site
 * emits no phone, no address, no founding date and no social profiles, which
 * is both honest and acceptable to Google. Fill a field in here and it starts
 * appearing everywhere automatically.
 */

/** Canonical origin, no trailing slash. */
function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    // Fallback so build/SSR never throws when the env var is absent.
    'https://accedingtitans.com';

  return raw.replace(/\/+$/, '');
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
}

export const BRAND = {
  name: 'Acceding Titans',
  /** Used in titles: "<page> | Acceding Titans". */
  shortName: 'Acceding Titans',
  tagline: 'The business directory and community for African entrepreneurs',
  // Kept under ~160 characters: Google truncates the description in the SERP
  // around that point, so anything longer is cut mid-sentence.
  description:
    'Acceding Titans is a community platform and public business directory where African entrepreneurs showcase what they sell, find what they need, and connect.',
  locale: 'en_NG',
  language: 'en',
} as const;

export const CONTACT = {
  /** TODO(owner): confirm before launch. Null = omitted from structured data. */
  email: null as string | null,
  /** TODO(owner): confirm before launch. Null = omitted from structured data. */
  phone: null as string | null,
  /**
   * TODO(owner): add the registered business address. Null = omitted, which
   * also means no LocalBusiness address is published for member businesses
   * until they supply one themselves.
   */
  address: null as { street?: string; city?: string; region?: string; country?: string } | null,
  /** TODO(owner): confirm the real founding year. Null = omitted. */
  foundingDate: null as string | null,
} as const;

/**
 * Verified official profiles. Empty until confirmed — an unverified sameAs
 * link is worse than no link, so we publish nothing rather than guess.
 * TODO(owner): add e.g. 'https://www.linkedin.com/company/...'
 */
export const SOCIAL_PROFILES: readonly string[] = [];

/** Social handles used for OG/Twitter `site_name` / `creator`. */
export const SOCIAL = {
  twitter: '@accedingtitans', // TODO(owner): confirm the real handle
} as const;

/**
 * The favicon / PWA icon. NOT a social share image.
 *
 * This is 192x192 and square, so platforms letterbox it into a small
 * thumbnail. Social previews come from the generated 1200x630 cards in
 * app/opengraph-image.tsx, app/twitter-image.tsx and
 * app/catalogue/[id]/opengraph-image.tsx.
 */
export const SITE_ICON = '/icon.png';

/**
 * Indexability policy.
 *
 * Anything not listed in INDEXABLE must be protected from indexing. The
 * layouts for these areas set `robots: { index: false, follow: false }` in
 * addition to an X-Robots-Tag header, because robots.txt on its own is not a
 * security control and cannot enforce anything for a logged-in crawler.
 */
export const INDEXABLE_AREA = 'public' as const;

/** Paths that are thin, private or utility — never in the sitemap. */
export const NON_INDEXABLE_PATTERNS = [
  '/admin',
  '/agent',
  '/dashboard',
  '/auth',
  '/offline',
  '/api',
  '/_next',
] as const;

/**
 * Public static pages worth indexing, with the priority and change frequency
 * that genuinely reflects them. Paths that do not exist in the app must never
 * be added here — a sitemap entry that 404s is worse than no entry.
 */
export interface StaticRoute {
  path: string;
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastModified?: string;
}

export const STATIC_ROUTES: readonly StaticRoute[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/catalogue', priority: 0.9, changeFrequency: 'daily' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  // NOTE: /multi-currency is intentionally absent. It is a "Coming soon"
  // placeholder with no usable content, so it is noindex and must not be
  // advertised as a real page. Add it here when the feature ships.
  // VTU pages have real, written feature copy and are legitimate landing
  // pages for the product offering.
  { path: '/vtu', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/vtu/airtime', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/vtu/data', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/vtu/tv', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/vtu/bills', priority: 0.8, changeFrequency: 'weekly' },
  // Legal pages are indexed but deliberately low priority.
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
] as const;
