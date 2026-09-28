import type { Metadata } from 'next';
import { BRAND, DEFAULT_OG_IMAGE, SOCIAL, absoluteUrl } from './config';

export interface PageSeoInput {
  /** Page-specific title. The brand suffix is appended automatically. */
  title: string;
  description: string;
  /**
   * Site-relative path used to build the canonical URL. Pass an absolute URL
   * only when the canonical lives on another origin.
   */
  path: string;
  /** Absolute or site-relative social share image. */
  image?: string;
  /** Override the OG/Twitter type, e.g. 'profile' or 'article'. */
  type?: 'website' | 'article' | 'profile';
  /** ISO date; when present, Google may show the date in the result. */
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /**
   * Set false for utility/private pages. The page is then excluded from the
   * index but still passes link equity through.
   */
  index?: boolean;
  /** Also withhold link equity. Use for pages with no useful outbound links. */
  follow?: boolean;
  /** Extra keywords are not emitted: Google has ignored the keywords meta
   *  tag since 2009 and including it is a thin-content signal. */
}

/**
 * Builds a consistent Metadata object so no page has to hand-roll titles,
 * canonicals, Open Graph or Twitter cards.
 *
 * The root layout defines `title.template`, so passing a bare title here
 * renders "Page title | Acceding Titans" in the SERP and on the tab.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  index = true,
  follow = true,
}: PageSeoInput): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type,
      url: canonical,
      siteName: BRAND.name,
      title,
      description,
      locale: BRAND.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: SOCIAL.twitter,
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Metadata for authenticated/private areas.
 *
 * Applied at the layout level so every nested page inherits it and no screen
 * can accidentally ship without it. `follow: false` stops crawlers wasting
 * budget on member-only URLs, and the X-Robots-Tag header in next.config.ts
 * repeats the instruction for crawlers that ignore the meta tag.
 */
export function noIndexMetadata(title: string, path?: string): Metadata {
  return {
    title,
    // Without this the page inherits the root layout's `canonical: '/'`, which
    // would point a noindex admin URL at the homepage. A noindex page is
    // dropped rather than consolidated, so the canonical is largely moot — but
    // an explicit one avoids a contradictory signal in the HTML.
    ...(path ? { alternates: { canonical: absoluteUrl(path) } } : {}),
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, 'noarchive': true },
    },
  };
}
