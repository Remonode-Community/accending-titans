import { BRAND, CONTACT, DEFAULT_OG_IMAGE, SOCIAL_PROFILES, absoluteUrl } from './config';
import type { PortfolioItem, PublicPortfolio } from '@/types/portfolio.types';

/**
 * JSON-LD builders.
 *
 * Two rules govern everything here:
 *
 * 1. Nothing is invented. A field is emitted only when we have a real value
 *    for it. `null` in config means "omit", not "emit a blank".
 * 2. Structured data must describe content that is actually visible on the
 *    page. We do not emit ratings, review counts, opening hours or prices
 *    that a member has not supplied, because unverifiable schema is a manual
 *    -action risk and helps nobody.
 */

type Json = Record<string, unknown>;

/** Drops null/undefined/empty-array values so we never emit empty schema. */
function compact<T extends Json>(input: T): T {
  const out: Json = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    out[key] = value;
  }
  return out as T;
}

const ORG_ID = `${absoluteUrl('/')}#organization`;
const SITE_ID = `${absoluteUrl('/')}#website`;

/** The publishing organisation. Used on every page via @id references. */
export function organizationSchema(): Json {
  const address = CONTACT.address
    ? compact({
        '@type': 'PostalAddress',
        streetAddress: CONTACT.address.street,
        addressLocality: CONTACT.address.city,
        addressRegion: CONTACT.address.region,
        addressCountry: CONTACT.address.country,
      })
    : null;

  const contactPoints = [];
  if (CONTACT.email) {
    contactPoints.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: CONTACT.email,
      availableLanguage: ['en'],
    });
  }
  if (CONTACT.phone) {
    contactPoints.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: CONTACT.phone,
      availableLanguage: ['en'],
    });
  }

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND.name,
    url: absoluteUrl('/'),
    description: BRAND.description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(DEFAULT_OG_IMAGE),
    },
    ...(SOCIAL_PROFILES.length ? { sameAs: [...SOCIAL_PROFILES] } : {}),
    ...(contactPoints.length ? { contactPoint: contactPoints } : {}),
    ...(address ? { address } : {}),
    ...(CONTACT.foundingDate ? { foundingDate: CONTACT.foundingDate } : {}),
  });
}

/**
 * The site itself.
 *
 * No `potentialAction`/SearchAction: this app has no /search route, and
 * declaring a search box that does not exist produces a broken rich result.
 * The directory at /catalogue is a browse page, not a site search, so it is
 * advertised with a plain `ItemList` on that page instead.
 */
export function webSiteSchema(): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: BRAND.name,
    url: absoluteUrl('/'),
    description: BRAND.description,
    inLanguage: BRAND.language,
    publisher: { '@id': ORG_ID },
  });
}

/** Generic page wrapper so every page has a WebPage node for AI systems. */
export function webPageSchema(input: {
  path: string;
  name: string;
  description: string;
  breadcrumbId?: string;
}): Json {
  const url = absoluteUrl(input.path);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    // Absolute, so it resolves against the BreadcrumbList's own @id. A relative
    // reference here silently fails to link the two nodes.
    ...(input.breadcrumbId
      ? { breadcrumb: { '@id': absoluteUrl(input.breadcrumbId) } }
      : {}),
  });
}

/**
 * Breadcrumb trail. Each crumb is a real, crawlable URL — no fragment-only
 * links, because that is what makes breadcrumbs useful for discovery.
 */
export function breadcrumbSchema(
  crumbs: Array<{ name: string; path: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(crumbs.length ? { '@id': `${absoluteUrl(crumbs[crumbs.length - 1].path)}#breadcrumb` } : {}),
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/**
 * A member's public business page.
 *
 * Uses LocalBusiness because these are businesses trading products and
 * services. Contact details, addresses, opening hours and ratings are
 * included ONLY when the member has supplied them — see the portfolio type.
 */
export function localBusinessSchema(portfolio: PublicPortfolio): Json {
  const pageUrl = absoluteUrl(`/catalogue/${portfolio.id}`);

  const offers = (portfolio.items ?? [])
    .map((item) => {
      // A price is only published when the member actually set one; a null
      // price means "price on request", which is not a valid Offer price, so
      // those items are advertised as a plain Service/Product without an
      // Offer wrapper.
      const offered = compact({
        '@type': item.item_type === 'service' ? 'Service' : 'Product',
        name: item.title,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image_urls?.length ? { image: item.image_urls[0] } : {}),
      });

      if (item.price === null || item.price === undefined) return offered;

      return compact({
        '@type': 'Offer',
        name: item.title,
        price: item.price,
        priceCurrency: 'NGN',
        availability: item.is_active
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
        itemOffered: offered,
      });
    })
    .filter(Boolean);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${pageUrl}#business`,
    name: portfolio.business_name,
    url: pageUrl,
    ...(portfolio.business_description
      ? { description: portfolio.business_description }
      : {}),
    ...(portfolio.profile_image_url ? { image: portfolio.profile_image_url } : {}),
    ...(portfolio.business_category ? { category: portfolio.business_category } : {}),
    ...(portfolio.whatsapp_number
      ? {
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'sales',
              telephone: portfolio.whatsapp_number,
              // No contactOption here: a WhatsApp number is not a toll-free
              // line, and asserting one is invented data.
              availableLanguage: ['en'],
            },
          ],
        }
      : {}),
    ...(offers.length ? { makesOffer: offers } : {}),
    ...(SOCIAL_PROFILES.length ? { sameAs: [...SOCIAL_PROFILES] } : {}),
  });
}

/**
 * The directory listing itself, so the set of member businesses is
 * machine-readable rather than only being links in the HTML.
 */
export function itemListSchema(
  businesses: Array<{ id: number; business_name: string }>,
  name: string,
  path: string,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: businesses.length,
    itemListElement: businesses.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.business_name,
      url: absoluteUrl(`/catalogue/${b.id}`),
    })),
  };
}

/**
 * Wraps nodes in a single @graph so entity references (@id) resolve cleanly.
 *
 * The per-node @context is stripped because @graph already carries one at the
 * root; repeating it on every node is redundant noise in the payload.
 */
export function graph(nodes: Json[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean).map(({ '@context': _ctx, ...rest }) => rest),
  });
}
