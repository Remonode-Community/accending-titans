import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPortfolioCategories, getPublicPortfolios, categorySlug } from '@/lib/catalogue.server';
import { BRAND } from '@/lib/seo/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { graph, itemListSchema, webPageSchema } from '@/lib/seo/schema';
import { CatalogueBrowser } from './CatalogueBrowser';

/**
 * The public business directory.
 *
 * This used to be a `'use client'` page that fetched in `useEffect`, which meant
 * the server-rendered HTML contained no businesses at all and the route could
 * not export metadata. Data is now fetched on the server (see
 * src/lib/catalogue.server.ts) and handed to the interactive shell as props, so
 * every business name and link is present in the initial response.
 */

const HEADING = 'Discover businesses in the community';
const INTRO =
  'Browse products and services offered by fellow entrepreneurs. Find what you need, or reach out directly over WhatsApp.';

interface SearchParams {
  page?: string;
  category?: string;
  q?: string;
}

/** Guards against ?page=1e999 or ?page=-5 producing a bad request. */
function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Single-value params may arrive as string[]; take the first. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const category = first(sp.category).trim();
  const query = first(sp.q).trim();
  const page = parsePage(first(sp.page));

  // A search is a private, ephemeral view: it must never enter the index, or
  // the site accumulates an unbounded set of near-duplicate result pages that
  // search engines are obliged to crawl. Canonicalise to the clean directory
  // URL so any equity flows there instead.
  if (query) {
    return buildMetadata({
      title: `${query} — businesses in the Acceding Titans directory`,
      description: `Member businesses matching “${query}”. Browse products and services, then contact the seller directly.`,
      path: '/catalogue',
      index: false,
      follow: true,
    });
  }

  if (category) {
    return buildMetadata({
      title: `${category} businesses in Nigeria`,
      description: `Find ${category.toLowerCase()} providers in the Acceding Titans community directory. Compare what member businesses offer and contact them directly on WhatsApp.`,
      // Canonical is the clean category URL, not the ?category= filter, so the
      // /catalogue/category/<slug> page is the single indexable version.
      path: `/catalogue/category/${categorySlug(category)}`,
    });
  }

  // Page 1 of the unfiltered directory is the canonical directory.
  // Deeper pages are self-canonical: each holds a distinct set of businesses
  // and is reachable via crawlable Next links, so all of them are indexable.
  const path = page > 1 ? `/catalogue?page=${page}` : '/catalogue';
  const description =
    page > 1
      ? `Page ${page} of member businesses in the Acceding Titans directory — products and services offered by African entrepreneurs.`
      : `Browse ${BRAND.name} member businesses by category. Find products and services offered by African entrepreneurs and contact sellers directly on WhatsApp.`;

  return buildMetadata({
    title: page > 1 ? `Business directory — page ${page}` : 'Business directory',
    description,
    path,
  });
}

export default async function PublicCataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const category = first(sp.category).trim();
  const query = first(sp.q).trim();
  const page = parsePage(first(sp.page));

  // Both are fetched together; the category list drives the filter chips.
  const [listing, categories] = await Promise.all([
    getPublicPortfolios({
      page,
      perPage: 12,
      category: category || undefined,
      search: query || undefined,
    }),
    getPortfolioCategories(),
  ]);

  
  /**
   * Only the default listing gets ItemList schema. A filtered or searched
   * result set is not a curated collection, and marking arbitrary query
   * results as an ItemList would be a mismatch between the markup and the
   * visible page.
   */
  const schemaNodes = [
    webPageSchema({
      path: '/catalogue',
      name: `${BRAND.name} business directory`,
      description: 'Public directory of member businesses, products and services.',
    }),
  ];

  if (!category && !query) {
    schemaNodes.push(
      itemListSchema(
        listing.portfolios.map((b) => ({ id: b.id, business_name: b.business_name })),
        'Member businesses',
        '/catalogue',
      ),
    );
  }

  return (
    <>
      <JsonLd data={graph(schemaNodes)} />
      <CatalogueBrowser
        portfolios={listing.portfolios}
        categories={categories}
        total={listing.total}
        currentPage={listing.currentPage}
        lastPage={listing.lastPage}
        activeCategory={category}
        searchQuery={query}
        heading={HEADING}
        intro={INTRO}
        breadcrumbs={
          <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
            <Breadcrumbs
              crumbs={[
                { name: 'Home', path: '/' },
                { name: 'Business directory', path: '/catalogue' },
              ]}
            />
          </div>
        }
      />
    </>
  );
}
