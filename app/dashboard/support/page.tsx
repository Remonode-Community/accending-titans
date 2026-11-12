'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  LifeBuoy,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import {
  PersonInitials,
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/support';
import { supportService } from '@/services/support.service';
import { formatRelativeTime } from '@/utils/format.utils';
import type {
  SupportCategory,
  SupportMemberStats,
  SupportTicket,
  SupportTicketFilters,
  SupportTicketStatus,
} from '@/types/support.types';

/**
 * Member support hub: every ticket the signed-in member raised, with
 * counters, filters, search and pagination. Failed loads render as an
 * explicit error state — never as a silent "no tickets yet".
 */

const STATUS_FILTERS: Array<{ value: SupportTicketStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_member', label: 'Awaiting your reply' },
  { value: 'awaiting_staff', label: 'Awaiting support' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function MemberSupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportMemberStats | null>(null);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SupportTicketFilters>({ status: '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  } | null>(null);

  const fetchTickets = useCallback(
    async (nextPage = 1, applied: SupportTicketFilters) => {
      try {
        const res = await supportService.getTickets(applied, nextPage, 10);

        if (!res.success || !res.data) {
          setError(res.message || 'Could not load your tickets.');
          setTickets([]);
          return;
        }

        setTickets(res.data.tickets);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setError('Could not load your tickets. Please try again.');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // `loading` starts as true, so the initial load renders the skeleton
    // without any synchronous state change here.
    fetchTickets(1, { status: '' });
  }, [fetchTickets]);

  useEffect(() => {
    // Categories power the filter dropdown; a failure here is non-fatal —
    // the status filters still work.
    supportService
      .getCategories()
      .then((res) => {
        if (res.success && res.data) setCategories(res.data.categories);
      })
      .catch(() => undefined);
  }, []);

  const applyFilters = (next: SupportTicketFilters) => {
    setFilters(next);
    setPage(1);
    setLoading(true);
    setError(null);
    fetchTickets(1, next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ ...filters, search: searchInput.trim() });
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    setLoading(true);
    setError(null);
    fetchTickets(next, filters);
  };

  const statChips = stats
    ? [
        { label: 'Unread', value: stats.unread, tone: 'gold' as const },
        { label: 'Open', value: stats.open, tone: 'blue' as const },
        { label: 'Awaiting you', value: stats.awaiting_member, tone: 'amber' as const },
        { label: 'Resolved', value: stats.resolved, tone: 'emerald' as const },
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Raise a request and follow its progress — our team replies here and by email.
          </p>
        </div>
        <Link
          href="/dashboard/support/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
        >
          <Plus size={16} />
          New ticket
        </Link>
      </div>

      {/* Counters */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statChips.map((chip) => (
            <div
              key={chip.label}
              className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800"
            >
              <p
                className={clsx(
                  'text-xl font-black',
                  chip.tone === 'gold' && 'text-[#B8962E] dark:text-[#D4B85A]',
                  chip.tone === 'blue' && 'text-blue-600 dark:text-blue-400',
                  chip.tone === 'amber' && 'text-amber-600 dark:text-amber-400',
                  chip.tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {chip.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {chip.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + search */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => applyFilters({ ...filters, status: option.value })}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filters.status === option.value
                    ? 'border-[#C9A84C] bg-[#C9A84C] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center gap-2 lg:max-w-xs lg:ml-auto">
            <select
              value={filters.category ?? ''}
              onChange={(e) => applyFilters({ ...filters, category: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-auto"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </form>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <PageSkeleton />
      ) : error ? (
        <EmptyState
          icon={XCircle}
          title="Something went wrong"
          description={error}
          action={{
            label: 'Try again',
            onClick: () => {
              setLoading(true);
              setError(null);
              fetchTickets(page, filters);
            },
            icon: RotateCcw,
          }}
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No tickets here"
          description={
            filters.status || filters.category || filters.search
              ? 'Nothing matches these filters. Try clearing them.'
              : 'When something needs our attention, raise a ticket and track it here.'
          }
          action={{
            label: 'New ticket',
            onClick: () => router.push('/dashboard/support/new'),
            icon: Plus,
          }}
        />
      ) : (
        <Card className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="block px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <PersonInitials
                      firstName={ticket.member?.first_name}
                      lastName={ticket.member?.last_name}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                          {ticket.subject}
                        </p>
                        {ticket.unread_for_member && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {ticket.ticket_number} · {ticket.category?.label ?? 'General'} ·{' '}
                        {formatRelativeTime(ticket.created_at)}
                      </p>
                      {ticket.latest_message && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                          {ticket.latest_message.author
                            ? `${ticket.latest_message.author.first_name}: `
                            : ''}
                          {ticket.latest_message.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <TicketStatusBadge
                      status={ticket.status}
                      label={ticket.status_label}
                      size="sm"
                    />
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-700">
              <p className="text-xs text-gray-400">
                Page {pagination.current_page} of {pagination.last_page} ·{' '}
                {pagination.total} ticket{pagination.total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.current_page <= 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reassure on first visit */}
      {!loading && !error && tickets.length === 0 && !filters.status && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#C9A84C]/20 bg-[#FDFAF3] px-4 py-3.5 dark:bg-[#C9A84C]/5">
          <LifeBuoy size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
          <p className="text-xs leading-relaxed text-[#8a7434] dark:text-[#D4B85A]">
            Most tickets receive a first response within one business day. You&apos;ll get a
            notification and an email whenever we reply.
          </p>
        </div>
      )}
    </div>
  );
}
