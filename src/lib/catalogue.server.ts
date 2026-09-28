import type {
  CatalogueBrowseData,
  PortfolioCategory,
  PublicPortfolio,
} from '@/types/portfolio.types';

/**
 * Server-side reader for the PUBLIC business catalogue.
 *
 * Why this exists instead of reusing `portfolioService`:
 *
 *  - `/catalogue` and `/catalogue/[id]` were client components that fetched in
 *    `useEffect`. That put zero business links in the server-rendered HTML, so
 *    crawlers (and any AI agent that does not execute JS) saw an empty
 *    skeleton. It also made `generateMetadata` impossible: Next.js forbids
 *    metadata exports from a `'use client'` file.
 *  - `apiClient` is built around browser concerns (localStorage token, 401 →
 *    `window.location`, client-side retry). None of that is wanted in a server
 *    render, and importing it would pull axios into the server graph.
 *
 * This module uses plain `fetch` with ISR, so catalogue pages are served as
 * cached HTML that revalidates automatically as members add or edit listings.
 *
 * These endpoints are public on the backend: the `auth:sanctum` middleware is
 * only applied to the mutating routes, not to index/show/categories.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bb.remonode.com/api/v1';

/** Listing pages are cheap to rebuild and change often. */
const REVALIDATE_LIST = 300; // 5 minutes
/** A single business page is more stable. */
const REVALIDATE_DETAIL = 600; // 10 minutes

interface Envelope<T> {
  status?: boolean;
  success?: boolean;
  data?: T;
}

/**
 * The backend answers HTTP 200 even for logical failures (the `status: false`
 * + error code convention), so `res.ok` alone is not a success check — the
 * envelope flag has to be inspected too or a failed request reads as an empty
 * catalogue and quietly produces a thin indexable page.
 */
async function apiGet<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });

    if (!res.ok) return null;

    const body = (await res.json()) as Envelope<T>;
    const ok = body?.status ?? body?.success;
    if (ok === false) return null;

    return body?.data ?? (body as unknown as T);
  } catch {
    // A catalogue outage must not take the page down: the route still renders
    // its shell and copy, and the next revalidation will repopulate it.
    return null;
  }
}

export interface PublicListing {
  portfolios: PublicPortfolio[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export async function getPublicPortfolios(params: {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
} = {}): Promise<PublicListing> {
  const { page = 1, perPage = 12, category, search } = params;

  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (category) qs.set('category', category);
  if (search) qs.set('search', search);

  const data = await apiGet<CatalogueBrowseData>(
    `/portfolios?${qs.toString()}`,
    REVALIDATE_LIST,
  );

  return {
    portfolios: data?.portfolios ?? [],
    currentPage: data?.pagination?.current_page ?? page,
    lastPage: data?.pagination?.last_page ?? 1,
    total: data?.pagination?.total ?? 0,
  };
}

export async function getPublicPortfolio(id: number): Promise<PublicPortfolio | null> {
  const data = await apiGet<{ portfolio: PublicPortfolio }>(
    `/portfolios/${id}`,
    REVALIDATE_DETAIL,
  );
  return data?.portfolio ?? null;
}

export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
  const data = await apiGet<{ categories: PortfolioCategory[] }>(
    '/portfolios/categories',
    REVALIDATE_LIST,
  );
  return data?.categories ?? [];
}

/**
 * Slug for a category name, used to build readable category URLs.
 * "Food & Beverages" -> "food-beverages"
 */
export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Walks every public listing so the sitemap can enumerate them.
 *
 * Hard-capped at 5,000 URLs because that is the per-sitemap-file protocol
 * limit. If a directory ever exceeds that it must be split into numbered
 * segments (sitemap-N.xml) rather than silently truncated — see the note in
 * app/sitemap-businesses.xml/route.ts.
 */
export async function getAllPublicPortfolios(
  maxUrls = 5000,
): Promise<PublicPortfolio[]> {
  const perPage = 100;
  const all: PublicPortfolio[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await getPublicPortfolios({ page, perPage });
    if (batch.portfolios.length === 0) break;

    all.push(...batch.portfolios);
    if (all.length >= maxUrls || page >= batch.lastPage) break;
    page += 1;
  }

  return all.slice(0, maxUrls);
}
