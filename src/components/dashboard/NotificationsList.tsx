/* ──────────────────────────────────────────────────────────────────────
  NotificationsList Component
  ── Full-featured notification list with filtering, selection, grouping
  and dark mode support
  ────────────────────────────────────────────────────────────────────── */
'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import type { Notification, NotificationType } from '@/types/notification.types';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';

interface NotificationsListProps {
  compact?: boolean;
  limit?: number;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  compact = false,
  limit = 20,
}) => {
  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    getUnreadCount,
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications({
      page: currentPage,
      per_page: limit,
      type: (typeFilter as NotificationType) || undefined,
      priority: (priorityFilter as 'high' | 'normal' | 'low') || undefined,
      unread_only: unreadOnly,
    });
  }, [currentPage, typeFilter, priorityFilter, unreadOnly, limit, fetchNotifications]);

  const resetSelection = () => setSelectedIds(new Set());

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
    resetSelection();
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    setCurrentPage(1);
    resetSelection();
  };

  const handleUnreadToggle = (value: boolean) => {
    setUnreadOnly(value);
    setCurrentPage(1);
    resetSelection();
  };

  const clearFilters = () => {
    setTypeFilter('');
    setPriorityFilter('');
    setUnreadOnly(false);
    setCurrentPage(1);
    resetSelection();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} notification(s)?`)) return;
    setIsDeleting(true);
    try {
      await deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const count = getUnreadCount();
    if (count === 0) return;
    if (!window.confirm(`Mark all ${count} unread notification(s) as read?`)) return;
    await markAllAsRead();
  };

  const unreadCount = getUnreadCount();
  const hasActiveFilters = Boolean(typeFilter || priorityFilter || unreadOnly);

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact && notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:bg-gray-900 dark:text-white">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/20 dark:border-gray-600 bg-gray-800/20">
            <Bell size={16} className="text-gray-400 dark:text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No notifications</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-300">You're all caught up.</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-gray-900 dark:text-white">
        <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
        {notifications.length > 5 && (
          <div className="border-t border-gray-200/80 p-3">
            <a href="/dashboard/notifications"
              className="flex items-center justify-center rounded-xl border border-gray-200/25 bg-gray-50/20 px-4 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-300 transition hover:bg-gray-50/30">
              View all notifications
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500 dark:text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-500">Error loading notifications</p>
            <p className="mt-0.5 text-xs text-red-400 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main panel */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-gray-900 dark:text-white">
        <div className="h-[3px] bg-gradient-to-r from-gray-200/30 via-gray-200 to-gray-200/30" />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {/* Unread badge + bulk actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200/20 bg-gray-50/20 px-4 py-2">
              <Bell size={14} className="text-gray-400 dark:text-gray-300" />
              <span className="text-sm font-black text-gray-800 dark:text-gray-100">{unreadCount}</span>
              <span className="text-xs text-gray-400 dark:text-gray-300">unread</span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition hover:border-gray-300/30 hover:bg-gray-50 dark:hover:bg-gray-900 dark:text-gray-100"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting…' : `Delete ${selectedIds.size}`}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <Filter size={13} className="text-gray-400" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="h-9 rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 outline-none transition hover:border-gray-400 dark:hover:border-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-400/20"
            >
              <option value="">All types</option>
              <option value="transaction">Transaction</option>
              <option value="system">System</option>
              <option value="promotion">Promotion</option>
              <option value="update">Update</option>
              <option value="alert">Alert</option>
              <option value="birthday">Birthday</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityFilterChange(e.target.value)}
              className="h-9 rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 outline-none transition hover:border-gray-400 dark:hover:border-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-400/20"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:border-gray-400 dark:hover:bg-gray-900/30">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => handleUnreadToggle(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-500 accent-[#C9A84C]"
              />
              Unread only
            </label>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 transition hover:border-red-300 dark:hover:bg-red-400/10 dark:hover:text-red-400"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200/20 dark:border-gray-600 dark:bg-gray-800/20">
                <Loader2 size={20} className="animate-spin text-gray-400 dark:text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-300">Loading notifications…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/20 dark:border-gray-600 dark:bg-gray-800/20">
                <Inbox size={22} className="text-gray-300 dark:text-gray-400" />
              </div>
              <h3 className="font-black text-gray-800 dark:text-gray-100">No notifications found</h3>
              <p className="mt-1.5 max-w-sm text-sm text-gray-400 dark:text-gray-300">
                {hasActiveFilters
                  ? 'No notifications match your current filters.'
                  : 'New account updates and transaction activities will appear here.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#b8962e] dark:text-white shadow-sm dark:shadow-gray-700/20 transition-hover:bg-[#b8962E]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* List with selection capability */}
          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {/* Select all bar - show when there are multiple notifications */}
              {notifications.length > 1 && (
                <div
                  className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/20 p-4 dark:bg-gray-800/50 dark:border-gray-500/20"
                >
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === notifications.length && notifications.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#C9A84C]"
                    />
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </label>

                  {selectedIds.size > 0 && (
                    <span
                      className="rounded-full border border-gray-200/20 bg-gray-50/20 px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-300"
                    >
                      Bulk actions enabled
                    </span>
                  )}
                </div>
              )}

              {/* Cards */}
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3">
                  <NotificationCard
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    isSelected={selectedIds.has(notification.id)}
                    onToggleSelect={() => handleSelectOne(notification.id)}
                  />
                </div>
              ))}

              {selectedIds.size > 0 && (
                <div
                  className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/20 p-4 dark:bg-gray-800/50 dark:border-gray-500/20"
                >
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === notifications.length && notifications.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#C9A84C]"
                    />
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </label>

                  {selectedIds.size > 0 && (
                    <span
                      className="rounded-full border border-gray-200/20 bg-gray-50/20 px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-300"
                    >
                      Bulk actions enabled
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading &&
          pagination &&
          pagination.total &&
          pagination.total > notifications.length && (
          <div
            className="flex flex-col gap-3 border-t border-gray-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-600/50 dark:bg-gray-900/50"
          >
            <p className="text-xs text-gray-400 dark:text-gray-300">
              Page{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{currentPage}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{pagination.last_page}</span>
              {'  ·  '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{pagination.total}</span> total
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/20 bg-white dark:border-gray-600 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 transition hover:border-gray-400 dark:hover:text-gray-300 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === pagination.last_page}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white dark:bg-gray-800 shadow-sm dark:text-white transition hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};