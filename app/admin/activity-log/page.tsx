'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Globe,
  HandHeart,
  LogIn,
  LogOut,
  Monitor,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';
import { Modal } from '@/components/shared/Modal';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { formatDate, formatDateTime } from '@/utils/format.utils';
import { clsx } from 'clsx';
import { activityLogService } from '@/services/activity-log.service';
import type {
  ActivityLogFilters,
  AuditLogEntry,
  AuditLogStats,
} from '@/types/activity-log.types';

// ─── Action Helpers ─────────────────────────────────────────────────────

/*
 * Icon and colour are chosen from the REAL action strings the server writes.
 * Matching is done on the family prefix (`user.`, `ask.`, `security.`) rather
 * than on an exact verb list, so a new action is styled by its family without
 * this file needing to know it exists — and an unrecognised action still renders
 * with a sensible default instead of breaking.
 */
function getActionIcon(action: string): React.ElementType {
  if (action.startsWith('user.login')) return LogIn;
  if (action.startsWith('user.logout')) return LogOut;
  if (action.startsWith('user.role')) return Shield;
  if (action.startsWith('user.verify') || action.startsWith('user.create')) return UserCheck;
  if (action.startsWith('user.suspend')) return ShieldOff;
  if (action.startsWith('user.delete')) return UserX;

  // Member network: asks and moderation of them.
  if (action.startsWith('ask.fulfil')) return CheckCircle;
  if (action.startsWith('ask.claim')) return HandHeart;
  if (action.startsWith('ask.withdraw') || action.startsWith('ask.cancel')) return XCircle;
  if (action.startsWith('ask')) return HandHeart;
  if (action.startsWith('network')) return ShieldCheck;

  // Content moderation.
  if (action.startsWith('content.approve')) return CheckCircle;
  if (action.startsWith('content.reject')) return XCircle;
  if (action.startsWith('content')) return FileText;

  if (action.startsWith('security')) return AlertTriangle;
  return Activity;
}

/**
 * Colour by action family.
 *
 * No indigo or blue: the brand palette is gold on neutrals, and this screen is
 * part of that brand. Semantic green/amber/red are kept because status colour is
 * information rather than decoration, and they are already used for status
 * across the application.
 */
function getActionColor(action: string): string {
  if (action.startsWith('user.role')) return 'text-[#8A6F1F] bg-[#C9A84C]/10';
  if (action.startsWith('user.login') || action.startsWith('user.logout')) {
    return 'text-gray-700 bg-gray-100';
  }
  if (action.startsWith('user.verify') || action.startsWith('user.create')) {
    return 'text-emerald-700 bg-emerald-50';
  }
  if (action.startsWith('user.suspend') || action.startsWith('user.delete')) {
    return 'text-red-700 bg-red-50';
  }

  if (action.startsWith('ask.fulfil')) return 'text-emerald-700 bg-emerald-50';
  if (action.startsWith('ask.claim') || action.startsWith('ask.create')) {
    return 'text-[#8A6F1F] bg-[#C9A84C]/10';
  }
  if (action.startsWith('ask.withdraw') || action.startsWith('ask.cancel')) {
    return 'text-gray-600 bg-gray-100';
  }
  if (action.startsWith('ask')) return 'text-[#8A6F1F] bg-[#C9A84C]/10';

  if (action.startsWith('network')) return 'text-amber-700 bg-amber-50';

  if (action.startsWith('content.approve')) return 'text-emerald-700 bg-emerald-50';
  if (action.startsWith('content.reject')) return 'text-red-700 bg-red-50';
  if (action.startsWith('content')) return 'text-gray-700 bg-gray-100';

  if (action.startsWith('security')) return 'text-rose-700 bg-rose-50';

  return 'text-gray-600 bg-gray-100';
}

function getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    success: 'success',
    failure: 'danger',
    pending: 'warning',
  };
  return map[status] || 'info';
}

/**
 * Initials for the avatar.
 *
 * Null-safe on purpose. `actor_name` is null whenever the account has been
 * deleted — the audit row outliving the account is deliberate, so a null here is
 * an expected state and not an edge case. The previous code called
 * `.split()` unguarded because the mock always supplied a name, which would
 * have crashed the entire table on the first real deleted actor.
 */
function getInitials(name: string | null): string {
  if (!name || !name.trim()) return '?';

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * What to show in place of a deleted actor.
 *
 * Deliberately not a blank cell. A row with no name is unreadable, and
 * "deleted" is more informative than a dash — it tells the reader that the
 * person is gone, which is usually exactly what they are looking for.
 */
function getActorLabel(name: string | null, email: string | null): string {
  if (name && name.trim()) return name;
  if (email) return email;
  return 'Deleted member';
}

function getDeviceIcon(device?: string): React.ElementType {
  if (device === 'mobile') return Smartphone;
  if (device === 'api') return Globe;
  return Monitor;
}

function formatActionLabel(action: string): string {
  return action
    .replace(/\./g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Filter Fields ──────────────────────────────────────────────────────

/**
 * The filter fields are built at render time rather than being a module constant,
 * because the Action Type list is loaded from the server.
 *
 * The previous version hardcoded `kyc`, `offer_code`, `reward` and `transaction`
 * — verbs this product never recorded. An administrator selecting "KYC Events"
 * was given an empty result and no indication the filter was nonsense. The
 * options are now the actions that actually exist in the log.
 */
const buildFilterFields = (actions: string[]): FilterField[] => [
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Actor, action, description...',
    helpText: 'Search across actors, actions, descriptions and IP addresses',
  },
  {
    id: 'action',
    label: 'Action Type',
    type: 'select',
    placeholder: 'All Actions',
    options: actions.length
      ? actions.map((action) => ({ value: action, label: formatActionLabel(action) }))
      : [{ value: '', label: 'No actions recorded yet' }],
    helpText: actions.length
      ? 'Only actions that have actually been recorded are listed'
      : 'Nothing has been recorded yet',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: 'success', label: 'Success' },
      { value: 'failure', label: 'Failure' },
      { value: 'pending', label: 'Pending' },
    ],
  },
  {
    id: 'date_from',
    label: 'From Date',
    type: 'date',
    helpText: 'Filter events from this date',
  },
  {
    id: 'date_to',
    label: 'To Date',
    type: 'date',
    helpText: 'Filter events to this date',
  },
];

// ─── Component ──────────────────────────────────────────────────────────

export default function AdminActivityLogPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  /**
   * Server-side pagination, so the page size is the server's default rather than
   * a number this screen invented.
   */
  const perPage = 25;

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  /**
   * Rebuilt whenever the server's action list changes, so the Action Type
   * dropdown always offers verbs that actually exist rather than a hardcoded
   * list including ones this product never recorded.
   */
  const filterFields = useMemo(() => buildFilterFields(availableActions), [availableActions]);

  const {
    isOpen,
    filters,
    hasActiveFilters,
    getActiveFilterCount,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
  } = useFilters({
    fields: filterFields,
    onFiltersChange: () => setCurrentPage(1),
  });

  /**
   * A stable string describing the active filters, so the reload effect can
   * depend on it. `filters` is a fresh object on every render, and depending on
   * it directly would re-fetch in a loop.
   *
   * Declared after `useFilters` because it reads the value that returns it.
   */
  const appliedFiltersKey = JSON.stringify(filters);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  /**
   * Load one page of entries plus the summary counts, in parallel.
   *
   * Both requests carry the SAME filters. They used to disagree: the summary was
   * all-time while the table was filtered, which is how the header could claim
   * 15,420 events above three visible rows. Two calls over one filter set cannot
   * drift apart.
   *
   * On failure the table is emptied rather than left showing the previous result.
   * A stale audit list beside a fresh-looking header reads as current data,
   * which is the one thing an audit screen must never do.
   */
  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [listRes, statsRes] = await Promise.all([
        activityLogService.getLogs(filters as ActivityLogFilters, page, perPage),
        activityLogService.getStats(filters as ActivityLogFilters),
      ]);

      if (!listRes.success) {
        setLogs([]);
        setStats(null);
        setTotalPages(1);
        setTotalEvents(0);
        setError(listRes.message || 'Could not load the activity log.');
        return;
      }

      setLogs(listRes.data?.logs ?? []);
      setTotalPages(Math.max(1, listRes.data?.pagination.last_page ?? 1));
      setTotalEvents(listRes.data?.pagination.total ?? 0);
      setStats(statsRes.success ? statsRes.data ?? null : null);
    } catch (err) {
      console.error('Failed to load activity log:', err);
      setLogs([]);
      setStats(null);
      setTotalPages(1);
      setTotalEvents(0);
      setError('Could not reach the server to load the activity log.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load the real action list. Failure is not fatal: the screen still works and
   * the dropdown simply offers nothing to narrow by.
   */
  const loadActions = async () => {
    try {
      const res = await activityLogService.getActions();
      if (res.success) setAvailableActions(res.data?.actions ?? []);
    } catch (err) {
      console.error('Failed to load activity actions:', err);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadActions();
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Reload whenever the applied filters change, because filtering is now a
  // server concern rather than an in-memory one.
  useEffect(() => {
    if (!isAdmin) return;
    loadLogs(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, appliedFiltersKey]);

  /**
   * Auto-refresh, off by default.
   *
   * An audit screen that reloads itself every 30 seconds makes it impossible to
   * finish copying an IP address out of a row.
   */
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    const interval = setInterval(() => loadLogs(currentPage), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, isAdmin, currentPage]);

  /**
   * The server has already filtered and paged. These are the current page's
   * rows, nothing more.
   *
   * The previous implementation filtered `logs` again in the browser and sliced
   * it into pages. That is not merely redundant now — it is wrong, because it
   * re-filtered the rows of ONE page against the whole filter set, so applying a
   * filter would show fewer rows than the page held while the pagination
   * controls still believed a full page was present.
   */
  const paginatedLogs = logs;

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  if (!isAdmin) return null;

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
          <Activity className="h-3.5 w-3.5 text-[#C9A84C]" />
          Audit Trail
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Activity Log
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Monitor all system events, admin actions, and security-related activities
              across the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#C9A84C] peer-checked:after:translate-x-full relative" />
              <span className="text-xs font-semibold text-gray-500">Auto-refresh</span>
            </label>
            <Button
              onClick={() => loadLogs(currentPage)}
              variant="secondary"
              size="sm"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Total Events', value: stats.total_events.toLocaleString(), icon: Activity, color: 'text-blue-600 bg-blue-50' },
            { label: 'Successful', value: stats.successful_events.toLocaleString(), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Failed', value: stats.failed_events.toLocaleString(), icon: XCircle, color: 'text-red-600 bg-red-50' },
            { label: 'Today', value: stats.events_today.toLocaleString(), icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Unique Actors', value: stats.unique_actors.toString(), icon: Activity, color: 'text-purple-600 bg-purple-50' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                    <p className="mt-1.5 text-xl font-black text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl ${stat.color} p-2 shrink-0`}>
                    <Icon size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {hasActiveFilters ? (
            <span>
              Showing <strong className="text-gray-900">{paginatedLogs.length}</strong> of{' '}
              <strong className="text-gray-900">{logs.length}</strong> events
            </span>
          ) : (
            <span>
              <strong className="text-gray-900">{logs.length}</strong> events recorded
            </span>
          )}
        </div>
        <Button
          onClick={openFilters}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            hasActiveFilters
              ? 'bg-[#C9A84C] text-white shadow-lg shadow-[#C9A84C]/20'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={15} />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      <FilterPanel
        title="Filter Activity Log"
        description="Narrow down events by action type, status, date range, or search term"
        fields={filterFields}
        isOpen={isOpen}
        onClose={closeFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        position="right"
        mobilePosition="auto"
      />

      {/* ── Logs Table ──────────────────────────────────── */}
      <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : error ? (
          /**
           * A failed load is shown as a failure, never as an empty log.
           *
           * "No events found" on a screen whose job is to answer "did anything
           * happen?" is the most dangerous possible misreading: an administrator
           * would conclude nothing was done. The distinction has to be explicit.
           */
          <div className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-200 bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="mt-5 text-xl font-black text-gray-900">
              The activity log could not be loaded
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-600">{error}</p>
            <p className="mt-1 max-w-md text-xs text-gray-500">
              This is a loading failure, not an absence of activity. Nothing here
              should be read as meaning that no events occurred.
            </p>
            <button
              type="button"
              onClick={() => loadLogs(currentPage)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B8962E]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
              <Activity className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="mt-5 text-xl font-black text-gray-900">No events found</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              {hasActiveFilters
                ? 'No events match your current filters. Try adjusting your search criteria.'
                : 'No activity events have been recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {['Timestamp', 'Actor', 'Action', 'Description', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 ${
                          h === 'Status' ? 'text-center' : h === '' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const actionColor = getActionColor(log.action);
                    /**
                     * `channel` is recorded by LoginListener and is a real key;
                     * the mock's `device` key was invented here and would always
                     * have been undefined against live data.
                     */
                    const DeviceIcon = getDeviceIcon(
                      typeof log.metadata?.channel === 'string'
                        ? log.metadata.channel
                        : undefined
                    );

                    return (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-[#FDFAF3]/60 cursor-pointer"
                        onClick={() => handleViewDetails(log)}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-gray-300" />
                            <span className="text-xs font-mono text-gray-500">
                              {formatDateTime(log.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                              {getInitials(log.actor_name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{getActorLabel(log.actor_name, log.actor_email)}</p>
                              <p className="text-xs text-gray-400">{log.actor_email ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`rounded-lg ${actionColor} p-1.5`}>
                              <ActionIcon size={14} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 capitalize">
                              {formatActionLabel(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {log.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <DeviceIcon size={10} className="text-gray-300" />
                            <span className="text-[10px] font-mono text-gray-300">
                              {log.ip_address}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant={getStatusVariant(log.status)} size="sm">
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(log);
                            }}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-[#C9A84C]"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 lg:hidden">
              {paginatedLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const actionColor = getActionColor(log.action);
                return (
                  <div
                    key={log.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 cursor-pointer"
                    onClick={() => handleViewDetails(log)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl ${actionColor} p-2`}>
                          <ActionIcon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 capitalize">
                            {formatActionLabel(log.action)}
                          </p>
                          <p className="text-xs text-gray-500">{getActorLabel(log.actor_name, log.actor_email)}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(log.status)} size="sm">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">{log.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-300">
                        {formatDateTime(log.created_at)}
                      </span>
                      <span className="text-[10px] font-mono text-gray-300">
                        {log.ip_address}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* ── Pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
            {' '}&middot;{' '}
            <span className="font-semibold text-gray-700">{totalEvents}</span> total events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                    // Change the page AND fetch: filtering is server-side now,
                    // so moving page state alone would redisplay the same rows.
                    const next = Math.max(1, currentPage - 1);
                    setCurrentPage(next);
                    loadLogs(next);
                  }}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#C9A84C]/40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                    const next = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(next);
                    loadLogs(next);
                  }}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#C9A84C]/40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────── */}
      {showDetails && selectedLog && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Event Details"
          size="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Status Banner */}
            <div
              className={clsx(
                'rounded-2xl p-4',
                selectedLog.status === 'success' && 'bg-green-50 border border-green-200',
                selectedLog.status === 'failure' && 'bg-red-50 border border-red-200',
                selectedLog.status === 'pending' && 'bg-amber-50 border border-amber-200'
              )}
            >
              <div className="flex items-center gap-3">
                {selectedLog.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {selectedLog.status === 'failure' && <XCircle className="h-5 w-5 text-red-600" />}
                {selectedLog.status === 'pending' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedLog.status === 'success' ? 'Action Completed Successfully' :
                     selectedLog.status === 'failure' ? 'Action Failed' : 'Action Pending'}
                  </p>
                  <p className="text-xs text-gray-500">{selectedLog.description}</p>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Event ID</p>
                <p className="mt-1.5 font-mono text-sm font-semibold text-gray-900">{selectedLog.id}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Timestamp</p>
                <p className="mt-1.5 font-mono text-sm font-semibold text-gray-900">
                  {formatDateTime(selectedLog.created_at)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Action</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900 capitalize">
                  {formatActionLabel(selectedLog.action)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Resource</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900 capitalize">
                  {selectedLog.resource_type} #{selectedLog.resource_id}
                </p>
              </div>
            </div>

            {/* Actor Info */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Actor</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-sm font-bold text-[#C9A84C]">
                  {getInitials(selectedLog.actor_name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{getActorLabel(selectedLog.actor_name, selectedLog.actor_email)}</p>
                  <p className="text-xs text-gray-500">{selectedLog.actor_email}</p>
                  <p className="text-xs text-gray-400">ID: {selectedLog.actor_id}</p>
                </div>
              </div>
            </div>

            {/* Request Info */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Request Information</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">IP Address</span>
                  <span className="font-mono font-semibold text-gray-900">{selectedLog.ip_address}</span>
                </div>
                <div className="border-t border-gray-200" />
                <div>
                  <span className="text-gray-500">User Agent</span>
                  <p className="mt-1 font-mono text-xs text-gray-700 break-all">{selectedLog.user_agent}</p>
                </div>
                {typeof selectedLog.metadata?.channel === 'string' && (
                  <>
                    <div className="border-t border-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Channel</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {selectedLog.metadata.channel}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Raw Metadata */}
            {Object.keys(selectedLog.metadata).length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Metadata</p>
                <pre className="overflow-auto rounded-lg bg-white p-3 text-xs font-mono text-gray-700 max-h-40 border border-gray-200">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowDetails(false)}
                className="rounded-xl bg-gray-900 px-6 text-white hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
