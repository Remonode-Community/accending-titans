'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
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
import { useAuthStore } from '@/store/auth.store';
import { supportService } from '@/services/support.service';
import { formatRelativeTime } from '@/utils/format.utils';
import type {
  SupportAdminStats,
  SupportCategory,
  SupportTicket,
  SupportTicketFilters,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/support.types';

/**
 * The staff support queue: every member ticket with counters, filters
 * (status, priority, assignment, category), search and pagination. Follows
 * the house admin-page pattern — in-page admin guard with redirect.
 */

const STATUS_FILTERS: Array<{ value: SupportTicketStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_staff', label: 'Awaiting support' },
  { value: 'awaiting_member', label: 'Awaiting member' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: Array<{ value: SupportTicketPriority | ''; label: string }> = [
  { value: '', label: 'Any priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function AdminSupportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // House admin-page guard: bounce non-admins to the dashboard.
  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((r) => r === 'admin')),
    [user],
  );

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportAdminStats | null>(null);
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

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  const fetchTickets = useCallback(
    async (nextPage = 1, applied: SupportTicketFilters) => {
      try {
        const res = await supportService.getAdminTickets(applied, nextPage, 15);

        if (!res.success || !res.data) {
          setError(res.message || 'Could not load the ticket queue.');
          setTickets([]);
          return;
        }

        setTickets(res.data.tickets);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching support queue:', err);
        setError('Could not load the ticket queue. Please try again.');
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
    if (isAdmin) fetchTickets(1, { status: '' });
  }, [isAdmin, fetchTickets]);

  useEffect(() => {
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

  if (!isAdmin) return null;

  const statChips = stats
    ? [
        { label: 'Needs attention', value: stats.unread, tone: 'gold' as const },
        { label: 'Unassigned', value: stats.unassigned, tone: 'amber' as const },
        { label: 'Urgent & active', value: stats.urgent, tone: 'red' as const },
        { label: 'Awaiting member', value: stats.awaiting_member, tone: 'blue' as const },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support Desk</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Triage, answer and resolve the tickets members raise from their dashboard.
          </p>
        </div>
      </div>

      {/* Counters */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statChips.map((chip) => (
            <div
              key={chip.label}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <p
                className={clsx(
                  'text-xl font-black',
                  chip.tone === 'gold' && 'text-[#B8962E] dark:text-[#D4B85A]',
                  chip.tone === 'amber' && 'text-amber-600 dark:text-amber-400',
                  chip.tone === 'red' && 'text-red-600 dark:text-red-400',
                  chip.tone === 'blue' && 'text-blue-600 dark:text-blue-400',
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

      {/* Filters */}
      <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
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

          <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
            <select
              value={filters.priority ?? ''}
              onChange={(e) =>
                applyFilters({
                  ...filters,
                  priority: e.target.value as SupportTicketPriority | '',
                })
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.category ?? ''}
              onChange={(e) => applyFilters({ ...filters, category: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={filters.assigned_to ?? ''}
              onChange={(e) => applyFilters({ ...filters, assigned_to: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Anyone</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ticket, subject, member…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 outline-none focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </form>
          </div>
        </div>
      </Card>

      {/* Queue */}
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
          title="Queue is clear"
          description="No tickets match the current filters."
        />
      ) : (
        <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:border-gray-700">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Assigned</th>
                  <th className="px-5 py-3 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {ticket.unread_for_staff && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900 dark:text-gray-100">
                            {ticket.subject}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {ticket.ticket_number} · {ticket.category?.label ?? 'General'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <PersonInitials
                          firstName={ticket.member?.first_name}
                          lastName={ticket.member?.last_name}
                          className="h-7 w-7 text-[10px]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {ticket.member
                              ? `${ticket.member.first_name} ${ticket.member.last_name}`
                              : '—'}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">
                            {ticket.member?.email ?? ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <TicketStatusBadge
                        status={ticket.status}
                        label={ticket.status_label}
                        size="sm"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.assigned_to
                        ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`
                        : 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-gray-400">
                      {formatRelativeTime(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-700">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="block px-4 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {ticket.unread_for_staff && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" />
                      )}
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                        {ticket.subject}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {ticket.ticket_number} ·{' '}
                      {ticket.member
                        ? `${ticket.member.first_name} ${ticket.member.last_name}`
                        : '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <TicketStatusBadge status={ticket.status} size="sm" />
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
                Page {pagination.current_page} of {pagination.last_page} · {pagination.total}{' '}
                ticket{pagination.total === 1 ? '' : 's'}
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
    </div>
  );
}
