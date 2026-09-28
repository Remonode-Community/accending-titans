import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { categorySlug, getPublicPortfolio } from '@/lib/catalogue.server';
import { BRAND } from '@/lib/seo/config';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  graph,
  localBusinessSchema,
  webPageSchema,
} from '@/lib/seo/schema';
import { BusinessProfile } from './BusinessProfile';

/**
 * Public business page: /catalogue/<id>
 *
 * Server-rendered with per-business metadata and LocalBusiness structured
 * data. The id is an internal database key, not a marketing slug, but
 * changing the URL scheme now would break existing links, so the numeric URL
 * is kept and the business name is pushed into the title, description and
 * canonical instead. That is the low-risk option the brief asked for.
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  // Number() would accept "1.5" and "0x10"; require plain positive digits.
  if (!/^\d+$/.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Builds the meta description from what the member actually supplied.
 *
 * Falls back through the business description, then the item titles, then a
 * plain factual sentence. A description is never invented: if the member wrote
 * nothing, the page says what it is rather than padding with keywords.
 */
function describe(
  b: NonNullable<Awaited<ReturnType<typeof getPublicPortfolio>>>,
): string {
  const items = b.items ?? [];
  const category = b.business_category
    ? `${b.business_category} business`
    : 'business';

  // A member's own words lead, because they are the only accurate source. But a
  // 30-character description like "Working on the new world order" makes a
  // useless SERP snippet, so the directory context is always appended rather
  // than relying on the member having written a full paragraph.
  const own = b.business_description?.trim() ?? '';
  const tail = `Listed in the ${BRAND.name} directory — browse what they offer and contact them directly.`;

  if (own.length >= 80) {
    // Long enough to stand alone; trim to fit the snippet window.
    const budget = 158 - (tail.length + 1);
    return `${own.slice(0, budget).trimEnd()}… ${tail}`;
  }

  if (items.length > 0) {
    const titles = items
      .slice(0, 3)
      .map((i) => i.title)
      .filter(Boolean);
    return `${b.business_name} is a ${category} offering ${titles.join(', ')}${items.length > 3 ? ' and more' : ''}. ${tail}`;
  }

  const lead = own ? `${own}. ` : '';
  return `${lead}${b.business_name} is a ${category}. ${tail}`;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const businessId = parseId(id);

  if (!businessId) {
    return { title: 'Business not found', robots: { index: false, follow: true } };
  }

  const business = await getPublicPortfolio(businessId);
  if (!business) {
    return { title: 'Business not found', robots: { index: false, follow: true } };
  }

  const path = `/catalogue/${business.id}`;

  // No `image` passed: app/catalogue/[id]/opengraph-image.tsx generates a
  // 1200x630 card from the member's own cover photo, business name, category
  // and description. Handing a bare member image URL to the metadata instead
  // would override that card and lose the branding — and the member's photo
  // has no known dimensions, so any width/height declared would be a guess.
  return buildMetadata({
    title: `${business.business_name}${business.business_category ? ` — ${business.business_category}` : ''}`,
    description: describe(business),
    path,
    type: 'profile',
    // PublicPortfolio omits updated_at, so created_at is the honest signal.
    publishedTime: business.created_at,
  });
}

export default async function PublicBusinessDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const businessId = parseId(id);

  // A genuine 404 rather than an empty shell: search engines must drop
  // unpublished, hidden or malformed business URLs instead of indexing them.
  if (!businessId) notFound();

  const business = await getPublicPortfolio(businessId);
  if (!business) notFound();

  const path = `/catalogue/${business.id}`;

  /**
   * The category in the trail is only included when the category actually
   * exists as a page. Pointing breadcrumbs at /catalogue?category=… instead
   * would be a link to a non-canonical duplicate of the category page.
   */
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Business directory', path: '/catalogue' },
    ...(business.business_category
      ? [
          {
            name: business.business_category,
            path: `/catalogue/category/${categorySlug(business.business_category)}`,
          },
        ]
      : []),
    { name: business.business_name, path },
  ];

  return (
    <>
      {/*
        The BreadcrumbList itself is emitted by <Breadcrumbs>, which renders on
        this page. Emitting it here too would ship two identical
        BreadcrumbList nodes, and duplicated structured data is a signal
        validators flag. The WebPage below only *references* it by @id.
      */}
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: business.business_name,
            description: describe(business),
            breadcrumbId: `${path}#breadcrumb`,
          }),
          localBusinessSchema(business),
        ])}
      />

      <BusinessProfile business={business} breadcrumbs={<Breadcrumbs crumbs={crumbs} />} />
    </>
  );
}
