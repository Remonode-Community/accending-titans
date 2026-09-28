import { getAllPublicPortfolios } from '@/lib/catalogue.server';
import { toUrlSetXml, xmlResponse } from '@/lib/seo/sitemap-xml';

/**
 * Member business pages — GET /sitemap-businesses.xml
 *
 * This segment was entirely missing before, which meant the most valuable
 * content in the application (every published member business) was
 * undiscoverable except by following links from the directory.
 *
 * Privacy: only portfolios the public API already exposes are included. The
 * endpoint returns the approved, public projection — it has no owner email,
 * no user id, no WhatsApp number beyond the business's own published contact,
 * and no moderation flags — so enumerating it reveals nothing that is not
 * already on the public page.
 *
 * Scale: hard-capped at 5,000 URLs (getAllPublicPortfolios). The protocol
 * allows 50,000 per file, but a 50k-entry file is ~5MB and slower to fetch
 * than a crawler will wait. Past that point this route must be split into
 * numbered files and each listed in app/sitemap.ts.
 */
export const revalidate = 3600;

export async function GET() {
  const portfolios = await getAllPublicPortfolios();

  return xmlResponse(
    toUrlSetXml(
      portfolios.map((p) => ({
        url: `/catalogue/${p.id}`,
        // The public projection omits updated_at, so created_at is the only
        // honest lastmod available. Better a creation date than a fabricated one.
        lastModified: p.created_at ?? undefined,
        changeFrequency: 'weekly' as const,
        priority: p.is_featured ? 0.9 : 0.7,
      })),
    ),
  );
}
