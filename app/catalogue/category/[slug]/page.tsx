import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  categorySlug,
  getPortfolioCategories,
  getPublicPortfolios,
} from '@/lib/catalogue.server';
import { BRAND } from '@/lib/seo/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { graph, itemListSchema, webPageSchema } from '@/lib/seo/schema';
import { CatalogueBrowser } from '../../CatalogueBrowser';

/**
 * Crawlable category pages: /catalogue/category/<slug>
 *
 * The directory previously exposed categories only as a `?category=` query
 * filter, which is weak for discovery — the category is not in the URL, the
 * title could not be unique per category, and every filtered view competed
 * with /catalogue for the same canonical slot.
 *
 * This route makes each category a real, linkable document with its own
 * title, description, canonical, breadcrumb trail and ItemList schema, and
 * gives the sitemap something meaningful to enumerate. The slug form is
 * canonical: /catalogue?category=Food%20%26%20Beverages canonicalises here.
 */

const PER_PAGE = 12;

/** Reverse lookup: the API stores the display name, the URL stores a slug. */
function resolveCategory(slug: string, categories: { name: string }[]): string | null {
  const match = categories.find((c) => categorySlug(c.name) === slug);
  return match?.name ?? null;
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateStaticParams() {
  const categories = await getPortfolioCategories();
  return categories.map((c) => ({ slug: categorySlug(c.name) }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);

  const categories = await getPortfolioCategories();
  const name = resolveCategory(slug, categories);

  // An unknown slug has no page to describe. Returning a bare title keeps the
  // not-found response honest instead of inventing copy for a non-existent
  // category.
  if (!name) {
    return { title: 'Category not found', robots: { index: false, follow: true } };
  }

  const page = parsePage(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const path = page > 1 ? `/catalogue/category/${slug}?page=${page}` : `/catalogue/category/${slug}`;

  return buildMetadata({
    title:
      page > 1
        ? `${name} businesses — page ${page}`
        : `${name} businesses in Nigeria`,
    description:
      page > 1
        ? `Page ${page} of ${name.toLowerCase()} providers in the ${BRAND.name} community directory. Browse what they offer and contact them directly.`
        : `Browse ${name.toLowerCase()} providers in the ${BRAND.name} directory. See what each business offers and contact them directly on WhatsApp.`,
    path,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);

  const categories = await getPortfolioCategories();
  const name = resolveCategory(slug, categories);

  // A real 404 (not a soft one) so search engines drop the URL instead of
  // indexing an empty page under a category-looking slug.
  if (!name) notFound();

  const page = parsePage(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const query = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? '';

  const listing = await getPublicPortfolios({
    page,
    perPage: PER_PAGE,
    category: name,
    search: query || undefined,
  });

  const basePath = `/catalogue/category/${slug}`;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Business directory', path: '/catalogue' },
    { name, path: basePath },
  ];

  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path: basePath,
            name: `${name} businesses`,
            description: `Member businesses offering ${name.toLowerCase()} in the ${BRAND.name} directory.`,
            breadcrumbId: `${basePath}#breadcrumb`,
          }),
          // BreadcrumbList itself is emitted by <Breadcrumbs> below; only the
          // reference belongs here, or the page ships two identical nodes.
          itemListSchema(
            listing.portfolios.map((b) => ({ id: b.id, business_name: b.business_name })),
            `${name} businesses`,
            basePath,
          ),
        ])}
      />

      <CatalogueBrowser
        portfolios={listing.portfolios}
        categories={categories}
        total={listing.total}
        currentPage={listing.currentPage}
        lastPage={listing.lastPage}
        activeCategory={name}
        searchQuery={query}
        pinnedCategory
        heading={`${name} businesses`}
        intro={`Products and services from ${name.toLowerCase()} businesses in the ${BRAND.name} community. Open a listing to see what they offer and contact them directly.`}
        breadcrumbs={
          <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
            <Breadcrumbs crumbs={crumbs} />
          </div>
        }
      />
    </>
  );
}
