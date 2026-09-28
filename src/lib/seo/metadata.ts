import type { Metadata } from 'next';
import { BRAND, SOCIAL, absoluteUrl } from './config';
import { OG_SIZE } from './og';

export interface PageSeoInput {
  /** Page-specific title. The brand suffix is appended automatically. */
  title: string;
  description: string;
  /**
   * Site-relative path used to build the canonical URL. Pass an absolute URL
   * only when the canonical lives on another origin.
   */
  path: string;
  /**
   * Social share image.
   *
   * LEAVE UNSET on any route that has an `opengraph-image.tsx` /
   * `twitter-image.tsx` file. Next.js's file convention emits `og:image` with
   * the correct width/height/type automatically, but an explicit
   * `openGraph.images` in page metadata takes precedence and would silently
   * replace the generated 1200x630 card with the value passed here.
   *
   * Only pass this for an external image Next.js knows nothing about, e.g. a
   * member's own cover photo. The dimensions must match the real file or the
   * platform will crop it wrongly.
   */
  image?: string | { url: string; width: number; height: number };
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
 * The generated 1200x630 card route for a page path.
 *
 * WHY THIS IS DERIVED RATHER THAN LEFT TO THE FILE CONVENTION
 * ----------------------------------------------------------
 * Next.js injects `og:image` from app/opengraph-image.tsx, but a page that
 * exports its own `openGraph` (i.e. every page using buildMetadata) *replaces*
 * the field rather than merging with it. Relying on the convention therefore
 * produced a card on the homepage and NOTHING on /about, /catalogue and every
 * other page — verified in the rendered HTML.
 *
 * So the image is set explicitly from one place, which also means a new page
 * cannot forget it.
 */
function generatedCardFor(path: string): string {
  // Paginated variants pass "?page=2", which the route patterns must not see.
  const clean = path.split('?')[0];

  // Business pages have their own dynamic card showing the member's cover
  // photo, name, category and description.
  if (/^\/catalogue\/\d+$/.test(clean)) return `${clean}/opengraph-image`;

  // Category pages get a card with the category name and how many businesses
  // sit behind it.
  if (/^\/catalogue\/category\/[\w-]+$/.test(clean)) return `${clean}/opengraph-image`;

  // Everything else uses the branded default card.
  return '/opengraph-image';
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

  /**
   * An explicit `image` wins; otherwise the generated card is resolved from the
   * route. Declared at 1200x630 with matching width/height, because the earlier
   * setup pointed at a 192x192 square icon while claiming those dimensions —
   * platforms crop against the declared size, so a lie here is what produced
   * the small letterboxed previews.
   */
  const card =
    typeof image === 'string'
      ? { url: absoluteUrl(image) }
      : image ?? { url: absoluteUrl(generatedCardFor(path)) };

  const ogImages = [
    {
      url: card.url,
      width: 'width' in card && card.width ? card.width : OG_SIZE.width,
      height: 'height' in card && card.height ? card.height : OG_SIZE.height,
      alt: title,
    },
  ];

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
      images: ogImages,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: SOCIAL.twitter,
      title,
      description,
      images: ogImages.map((i) => i.url),
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
