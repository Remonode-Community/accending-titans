import { categorySlug, getPortfolioCategories } from '@/lib/catalogue.server';
import { toUrlSetXml, xmlResponse } from '@/lib/seo/sitemap-xml';

/**
 * Catalogue categories — GET /sitemap-categories.xml
 *
 * These are real pages at /catalogue/category/<slug>, each with its own title,
 * description, canonical, breadcrumb trail and ItemList schema. Previously
 * categories were only reachable through a ?category= query filter, which
 * could not be given a unique title and competed with /catalogue for the same
 * canonical slot.
 *
 * Categories with zero businesses are skipped: they would be thin pages with
 * no content, which is worse than being absent.
 */
export const revalidate = 3600;

export async function GET() {
  const categories = await getPortfolioCategories();

  return xmlResponse(
    toUrlSetXml(
      categories
        .filter((c) => c.count > 0)
        .map((c) => ({
          url: `/catalogue/category/${categorySlug(c.name)}`,
          changeFrequency: 'daily' as const,
          priority: 0.6,
        })),
    ),
  );
}
