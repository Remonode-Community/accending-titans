'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { LandingTopbar } from '@/components/LandingTopbar';
import { Footer } from '@/components/shared/Footer';
import { EmptyState } from '@/components/shared/EmptyState';
import { YouTubeEmbed, parseYouTubeId } from '@/components/shared/YouTubeEmbed';
import type { PortfolioCategory, PublicPortfolio } from '@/types/portfolio.types';

const PER_PAGE = 12;

/**
 * Hero video, configured in .env.local so it can be swapped without a code
 * change. Accepts a bare YouTube id or any YouTube URL — see parseYouTubeId().
 * Leave it blank and the video is hidden, letting the hero span full width.
 */
const HERO_VIDEO = {
  id: process.env.NEXT_PUBLIC_CATALOGUE_VIDEO_ID ?? '',
  title: 'How the Acceding Titans member directory works',
  caption: 'See how members showcase what they sell and reach customers.',
};

export interface CatalogueBrowserProps {
  /** Server-fetched, so the business names and links exist in the HTML. */
  portfolios: PublicPortfolio[];
  categories: PortfolioCategory[];
  total: number;
  currentPage: number;
  lastPage: number;
  /** Current filter, mirrored from the URL by the server page. */
  activeCategory: string;
  searchQuery: string;
  /** Read-only view on a category page: the filter cannot be cleared. */
  pinnedCategory?: boolean;
  /** Page heading, which differs on a category page. */
  heading: string;
  intro: string;
  /**
   * Rendered between the hero and the results. Passed in rather than rendered
   * by the caller so it lands inside the topbar's offset instead of behind it.
   */
  breadcrumbs?: React.ReactNode;
}

/**
 * Interactive shell around the server-fetched listing.
 *
 * Filtering and pagination are expressed in the URL rather than in component
 * state. That is what makes the directory crawlable: `/catalogue?page=3` and
 * `/catalogue?category=Food%20%26%20Beverages` are real, linkable, server-
 * rendered documents, instead of views that only exist after a click.
 */
export function CatalogueBrowser({
  portfolios,
  categories,
  total,
  currentPage,
  lastPage,
  activeCategory,
  searchQuery,
  pinnedCategory = false,
  heading,
  intro,
  breadcrumbs,
}: CatalogueBrowserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The input is uncontrolled by the server so typing stays instant; it is
  // re-synced when the URL changes underneath us (back button, chip click).
  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => setSearchInput(searchQuery), [searchQuery]);

  /**
   * Navigates to a new filter/page. The base path is a category page when one
   * is pinned, so filters resolve to the correct route.
   */
  const navigate = (next: { category?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (next.category) params.set('category', next.category);
    if (next.search) params.set('q', next.search);
    if (next.page && next.page > 1) params.set('page', String(next.page));

    const qs = params.toString();
    startTransition(() => {
      router.push(`/catalogue${qs ? `?${qs}` : ''}`);
    });
  };

  // Debounced so typing does not fire a navigation per keystroke.
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return;

    const timer = setTimeout(() => {
      navigate({ category: activeCategory, search: trimmed, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
    // navigate is recreated each render; excluding it keeps the timer stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, searchQuery]);

  const hasFilters = activeCategory !== '' || searchQuery !== '';

  // Null when unset or malformed, so the hero degrades to a single column
  // rather than rendering a broken player.
  const heroVideoId = parseYouTubeId(HERO_VIDEO.id);

  const clearFilters = () => {
    setSearchInput('');
    startTransition(() => router.push('/catalogue'));
  };

  /** Real <Link> targets so pagination is crawlable, not JS-only. */
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `/catalogue${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <LandingTopbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0f1115] px-5 pb-14 pt-32 lg:px-8 lg:pb-20">
        {/* Soft brand glow behind the video column. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-0 hidden h-[460px] w-[680px] rounded-full bg-[#C9A84C]/[0.08] blur-3xl lg:block"
        />

        <div
          className={`relative mx-auto grid max-w-7xl items-center gap-10 lg:gap-16 ${
            heroVideoId
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)]'
              : 'lg:grid-cols-1'
          }`}
        >
          {/* Copy + search */}
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              {heading}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-white/70">{intro}</p>

            {/* Search */}
            <div className="mt-8">
              <div className="relative mx-auto max-w-xl lg:mx-0">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search businesses, products or services…"
                  aria-label="Search the business directory"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3.5 pl-12 pr-11 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur transition focus:border-[#C9A84C]/50 focus:bg-white/15"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      navigate({ category: activeCategory, page: 1 });
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Video — right column on desktop, full-width below the copy on mobile */}
          {heroVideoId && (
            <div className="w-full">
              <YouTubeEmbed
                videoId={heroVideoId}
                title={HERO_VIDEO.title}
                caption={HERO_VIDEO.caption}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Breadcrumb trail ── */}
      {breadcrumbs}

      {/* ── Category filter ──
          Hidden on a category page: there the category is already fixed by
          the route, and offering the other chips would create competing
          links pointing at /catalogue?category=… duplicates of the canonical
          category URL. */}
      {!pinnedCategory && categories.length > 0 && (
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
            <div className="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
              <CategoryChip
                active={activeCategory === ''}
                onClick={() => navigate({ page: 1 })}
                label="All businesses"
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c.name}
                  active={activeCategory === c.name}
                  onClick={() =>
                    navigate({
                      category: activeCategory === c.name ? '' : c.name,
                      page: 1,
                    })
                  }
                  label={c.name}
                  count={c.count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Results ── */}
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* aria-live so the result count is announced after filtering. */}
          <p aria-live="polite" className="text-sm text-gray-500">
            {isPending
              ? 'Loading businesses…'
              : `${total} ${total === 1 ? 'business' : 'businesses'}${
                  activeCategory ? ` in ${activeCategory}` : ''
                }`}
          </p>

          {hasFilters && !pinnedCategory && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>

        {portfolios.length === 0 ? (
          <EmptyState
            icon={hasFilters ? Search : Building2}
            title={hasFilters ? 'No businesses match' : 'No businesses listed yet'}
            description={
              hasFilters
                ? 'Try a different search term or clear the category filter.'
                : 'Be the first to publish a catalogue. Members can browse, search and contact you directly.'
            }
            action={
              hasFilters
                ? { label: 'Clear filters', onClick: clearFilters, icon: X }
                : {
                    label: 'Create your catalogue',
                    onClick: () => {
                      window.location.href = '/dashboard/catalogue';
                    },
                    icon: ArrowRight,
                  }
            }
          />
        ) : (
          <>
            <div
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
                isPending ? 'opacity-60 transition-opacity' : ''
              }`}
            >
              {portfolios.map((business) => (
                <PublicBusinessCard key={business.id} business={business} />
              ))}
            </div>

            {lastPage > 1 && (
              <nav
                aria-label="Catalogue pagination"
                className="mt-10 flex items-center justify-center gap-3"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1)}
                    scroll={false}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 opacity-50"
                  >
                    Previous
                  </span>
                )}

                <span className="text-sm text-gray-500">
                  Page {currentPage} of {lastPage}
                </span>

                {currentPage < lastPage ? (
                  <Link
                    href={pageHref(currentPage + 1)}
                    scroll={false}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 opacity-50"
                  >
                    Next
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[#C9A84C] bg-[#C9A84C] text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-[#C9A84C]/40 hover:text-gray-900'
      }`}
    >
      {label}
      {typeof count === 'number' && (
        <span
          className={`rounded-full px-1.5 text-[11px] ${
            active ? 'bg-white/25' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function PublicBusinessCard({ business }: { business: PublicPortfolio }) {
  return (
    <Link
      href={`/catalogue/${business.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A84C]/40 hover:shadow-lg"
    >
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-gray-50">
        {business.cover_image_url ? (
          <Image
            src={business.cover_image_url}
            // Alt describes the image's subject, not a keyword list.
            alt={`${business.business_name} cover image`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : business.profile_image_url ? (
          <Image
            src={business.profile_image_url}
            alt={`${business.business_name} logo`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/10">
            <Building2 className="h-10 w-10 text-[#C9A84C]/40" />
          </div>
        )}

        {business.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#C9A84C] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <Star size={11} className="fill-white" />
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-1 text-base font-bold text-gray-900">
          {business.business_name}
        </h2>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {business.business_category && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              {business.business_category}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Package size={11} />
            {business.items_count} {business.items_count === 1 ? 'item' : 'items'}
          </span>
        </div>

        {business.business_description && (
          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
            {business.business_description}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C9A84C]">
          View catalogue
          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
