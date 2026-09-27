'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { portfolioService } from '@/services/portfolio.service';
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

export default function PublicCataloguePage() {
  const [portfolios, setPortfolios] = useState<PublicPortfolio[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await portfolioService.getCategories();
      if (res.success && res.data?.categories) setCategories(res.data.categories);
    } catch {
      // A missing category list must not break the page.
    }
  }, []);

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await portfolioService.browse({
          page: targetPage,
          per_page: PER_PAGE,
          category: category || undefined,
          search: debouncedSearch || undefined,
        });

        if (res.success && res.data) {
          const incoming = res.data.portfolios ?? [];
          setPortfolios((prev) => (append ? [...prev, ...incoming] : incoming));
          setLastPage(res.data.pagination?.last_page ?? 1);
          setTotal(res.data.pagination?.total ?? incoming.length);
        } else {
          setError(res.message || 'We could not load the directory.');
          if (!append) setPortfolios([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'We could not load the directory.',
        );
        if (!append) setPortfolios([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [category, debouncedSearch],
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(1);
    void load(1, false);
  }, [load]);

  const hasFilters = category !== '' || debouncedSearch !== '';

  // Null when unset or malformed, so the hero degrades to a single column
  // rather than rendering a broken player.
  const heroVideoId = parseYouTubeId(HERO_VIDEO.id);

  const clearFilters = () => {
    setCategory('');
    setSearch('');
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
              Discover businesses in the community
            </h1>

            <p className="mt-4 text-base leading-relaxed text-white/70">
              Browse products and services offered by fellow entrepreneurs. Find what you need, or
              reach out directly over WhatsApp.
            </p>

            {/* Search */}
            <div className="mt-8">
              <div className="relative mx-auto max-w-xl lg:mx-0">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search businesses, products or services…"
                  aria-label="Search the business directory"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3.5 pl-12 pr-11 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur transition focus:border-[#C9A84C]/50 focus:bg-white/15"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
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

      {/* ── Category filter ── */}
      {categories.length > 0 && (
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
            <div className="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
              <CategoryChip
                active={category === ''}
                onClick={() => setCategory('')}
                label="All businesses"
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c.name}
                  active={category === c.name}
                  onClick={() => setCategory(category === c.name ? '' : c.name)}
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
          <p className="text-sm text-gray-500">
            {isLoading
              ? 'Loading businesses…'
              : `${total} ${total === 1 ? 'business' : 'businesses'}${
                  category ? ` in ${category}` : ''
                }`}
          </p>

          {hasFilters && (
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

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void load(page, false)}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:self-auto"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="h-40 animate-pulse bg-gray-100" />
                <div className="space-y-2.5 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : portfolios.length === 0 ? (
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((business) => (
                <PublicBusinessCard key={business.id} business={business} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = page - 1;
                    setPage(next);
                    void load(next, false);
                  }}
                  disabled={page <= 1 || isLoadingMore}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-500">
                  Page {page} of {lastPage}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    void load(next, true);
                  }}
                  disabled={page >= lastPage || isLoadingMore}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoadingMore ? 'Loading…' : 'Next'}
                </button>
              </div>
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
            alt={business.business_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : business.profile_image_url ? (
          <Image
            src={business.profile_image_url}
            alt={business.business_name}
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
            {business.items_count}{' '}
            {business.items_count === 1 ? 'item' : 'items'}
          </span>
        </div>

        {business.business_description && (
          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
            {business.business_description}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C9A84C]">
          View catalogue
          <ArrowRight
            size={14}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
