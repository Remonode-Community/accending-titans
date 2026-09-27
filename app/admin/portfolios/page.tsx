'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/shared/Badge';
import { useAlert } from '@/hooks/useAlert';
import { useAuth } from '@/hooks/useAuth';
import { portfolioService } from '@/services/portfolio.service';
import type {
  CatalogueAdminStats,
  CatalogueAdminStatus,
  Portfolio,
} from '@/types/portfolio.types';

type Tab = CatalogueAdminStatus | 'all';

const TABS: { key: Tab; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: 'All', icon: Building2 },
  { key: 'pending', label: 'Hidden', icon: EyeOff },
  { key: 'approved', label: 'Live', icon: CheckCircle },
  { key: 'featured', label: 'Featured', icon: Star },
];

const PER_PAGE = 20;

export default function AdminPortfoliosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useAlert();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState<CatalogueAdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((r) => r === 'admin')),
    [user],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await portfolioService.adminGetAll({
          page: targetPage,
          per_page: PER_PAGE,
          status: activeTab === 'all' ? undefined : activeTab,
          search: debouncedSearch || undefined,
        });

        if (res.success && res.data) {
          const incoming = res.data.portfolios ?? [];
          setPortfolios((prev) => (append ? [...prev, ...incoming] : incoming));
          setStats(res.data.stats ?? null);
          setLastPage(res.data.pagination?.last_page ?? 1);
          setTotal(res.data.pagination?.total ?? incoming.length);
        } else {
          setError(res.message || 'We could not load catalogues.');
          if (!append) setPortfolios([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'We could not load catalogues.');
        if (!append) setPortfolios([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeTab, debouncedSearch],
  );

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (user.isEmailVerified === false) return;
  }, [isAdmin, router, user]);

  useEffect(() => {
    if (!isAdmin) return;
    setPage(1);
    void load(1, false);
  }, [isAdmin, load]);

  const toggle = async (portfolio: Portfolio, patch: { is_approved?: boolean; is_featured?: boolean }) => {
    setBusyId(portfolio.id);

    try {
      const res = await portfolioService.adminUpdate(portfolio.id, patch);

      if (res.success && res.data?.portfolio) {
        setPortfolios((prev) =>
          prev.map((p) => (p.id === portfolio.id ? res.data!.portfolio : p)),
        );
        success(
          patch.is_approved !== undefined
            ? patch.is_approved
              ? 'Catalogue is now publicly visible'
              : 'Catalogue hidden from the public directory'
            : patch.is_featured
              ? 'Business featured'
              : 'Business unfeatured',
        );
        // Counts changed, so refresh the header numbers.
        void load(page, false);
      } else {
        showError(res.message || 'That change could not be saved.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'That change could not be saved.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return <PageSkeleton />;
  if (!isAdmin) return null;

  const hasFilters = activeTab !== 'all' || debouncedSearch !== '';

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
            <Building2 className="h-5 w-5 text-[#C9A84C]" />
            Business Catalogues
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderate member catalogues and promote standout businesses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load(page, false)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total catalogues" value={stats.total} icon={Building2} />
          <StatTile label="Live" value={stats.approved} icon={CheckCircle} tone="success" />
          <StatTile label="Hidden" value={stats.pending} icon={EyeOff} tone="warning" />
          <StatTile label="Catalogue items" value={stats.items} icon={Package} />
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.key === 'all'
              ? stats?.total
              : tab.key === 'approved'
                ? stats?.approved
                : tab.key === 'pending'
                  ? stats?.pending
                  : stats?.featured;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {typeof count === 'number' && (
                <span className="rounded-full bg-gray-100 px-1.5 text-[11px] text-gray-500">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business, owner or email…"
          aria-label="Search catalogues"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
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
        <PageSkeleton />
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={hasFilters ? Search : Building2}
          title={hasFilters ? 'No catalogues match' : 'No catalogues yet'}
          description={
            hasFilters
              ? 'Try a different search term or switch tabs.'
              : 'Member catalogues will appear here as soon as members create them.'
          }
          action={
            hasFilters
              ? {
                  label: 'Clear filters',
                  onClick: () => {
                    setSearch('');
                    setActiveTab('all');
                  },
                  icon: X,
                }
              : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {portfolios.length} of {total}
          </p>

          <div className="space-y-3">
            {portfolios.map((portfolio) => (
              <AdminPortfolioRow
                key={portfolio.id}
                portfolio={portfolio}
                isBusy={busyId === portfolio.id}
                onToggleApproved={(next) => toggle(portfolio, { is_approved: next })}
                onToggleFeatured={(next) => toggle(portfolio, { is_featured: next })}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
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
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  tone?: 'default' | 'success' | 'warning';
}) {
  const tones = {
    default: 'bg-gray-50 text-gray-500',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function AdminPortfolioRow({
  portfolio,
  isBusy,
  onToggleApproved,
  onToggleFeatured,
}: {
  portfolio: Portfolio;
  isBusy: boolean;
  onToggleApproved: (next: boolean) => void;
  onToggleFeatured: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:p-5">
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {portfolio.profile_image_url ? (
            <Image
              src={portfolio.profile_image_url}
              alt={portfolio.business_name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 size={18} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-gray-900">
              {portfolio.business_name ?? 'Unnamed business'}
            </p>
            {portfolio.is_featured && (
              <Badge variant="warning" size="sm">
                Featured
              </Badge>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs text-gray-500">
            {portfolio.owner?.name ?? 'Unknown owner'}
            {portfolio.owner?.email ? ` · ${portfolio.owner.email}` : ''}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            {portfolio.business_category && <span>{portfolio.business_category}</span>}
            <span className="inline-flex items-center gap-1">
              <Package size={11} />
              {portfolio.items_count} {portfolio.items_count === 1 ? 'item' : 'items'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={11} />
              {portfolio.views_count} views
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/catalogue/${portfolio.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <ExternalLink size={13} />
          View
        </Link>

        <button
          type="button"
          onClick={() => onToggleFeatured(!portfolio.is_featured)}
          disabled={isBusy}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
            portfolio.is_featured
              ? 'border-[#C9A84C]/40 bg-[#FDFAF3] text-[#C9A84C]'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Star size={13} className={portfolio.is_featured ? 'fill-[#C9A84C]' : ''} />
          {portfolio.is_featured ? 'Featured' : 'Feature'}
        </button>

        <button
          type="button"
          onClick={() => onToggleApproved(!portfolio.is_approved)}
          disabled={isBusy}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
            portfolio.is_approved ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : portfolio.is_approved ? (
            <EyeOff size={13} />
          ) : (
            <BadgeCheck size={13} />
          )}
          {portfolio.is_approved ? 'Hide' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
