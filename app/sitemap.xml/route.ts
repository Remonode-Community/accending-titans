import { toSitemapIndexXml, xmlResponse } from '@/lib/seo/sitemap-xml';

/**
 * XML sitemap index — GET /sitemap.xml
 *
 * The catalogue is user-generated and grows without bound, so the sitemap is
 * split into segments instead of being emitted as a single urlset.
 *
 * This is a route handler rather than a `MetadataRoute.Sitemap` export on
 * purpose: `app/sitemap.ts` always serialises to <urlset>, which declares the
 * wrong root element for an index and is rejected by stricter parsers. A
 * <sitemapindex> has to be written directly.
 *
 * Referenced from robots.txt as the single entry point.
 */
export const revalidate = 3600;

const SEGMENTS: Array<{ path: string; changeFrequency: 'daily' | 'weekly' }> = [
  // Businesses first: they are the content most worth discovering, and listing
  // them early makes the priority order legible to a crawler.
  { path: '/sitemap-businesses.xml', changeFrequency: 'daily' },
  { path: '/sitemap-categories.xml', changeFrequency: 'daily' },
  { path: '/sitemap-pages.xml', changeFrequency: 'weekly' },
];

export async function GET() {
  const now = new Date();

  return xmlResponse(
    toSitemapIndexXml(
      SEGMENTS.map((s) => ({
        url: s.path,
        lastModified: now,
        changeFrequency: s.changeFrequency,
      })),
    ),
  );
}
