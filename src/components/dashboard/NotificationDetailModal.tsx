'use client';

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Cake,
  Check,
  CheckCircle,
  Gift,
  Info,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notification.types';
import { formatRelativeTime } from '@/utils/format.utils';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; label: string; badgeBg: string; badgeText: string }> = {
  transaction: {
    icon: CheckCircle,
    label: 'Transaction',
    badgeBg: 'bg-blue-50 border-blue-100',
    badgeText: 'text-blue-700',
  },
  system: {
    icon: Zap,
    label: 'System',
    badgeBg: 'bg-amber-50 border-amber-100',
    badgeText: 'text-amber-700',
  },
  promotion: {
    icon: Gift,
    label: 'Promotion',
    badgeBg: 'bg-purple-50 border-purple-100',
    badgeText: 'text-purple-700',
  },
  update: {
    icon: Info,
    label: 'Update',
    badgeBg: 'bg-cyan-50 border-cyan-100',
    badgeText: 'text-cyan-700',
  },
  alert: {
    icon: AlertCircle,
    label: 'Alert',
    badgeBg: 'bg-red-50 border-red-100',
    badgeText: 'text-red-700',
  },
  birthday: {
    icon: Cake,
    label: 'Birthday',
    badgeBg: 'bg-[#FDFAF3] border-[#C9A84C]/20',
    badgeText: 'text-[#9A7B2E]',
  },
};

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  high: { dot: 'bg-red-400', label: 'High priority' },
  normal: { dot: 'bg-gray-300', label: 'Normal priority' },
  low: { dot: 'bg-gray-200', label: 'Low priority' },
};

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !notification) return null;

  const isUnread = !notification.read_at;
  const typeConfig = TYPE_CONFIG[notification.type] ?? {
    icon: Bell,
    label: notification.type,
    badgeBg: 'bg-gray-50 border-gray-100',
    badgeText: 'text-gray-600',
  };
  const priorityConfig =
    PRIORITY_CONFIG[notification.priority] ?? PRIORITY_CONFIG.normal;
  const TypeIcon = typeConfig.icon;
  const actionUrl =
    typeof notification.data?.url === 'string' ? notification.data.url : null;
  const showRawData =
    Boolean(notification.data) &&
    notification.data?.type !== 'birthday_community' &&
    Object.keys(notification.data ?? {}).length > 0;

  const handleMarkAsRead = async () => {
    if (isUnread && onMarkAsRead) await onMarkAsRead(notification.id);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm('Delete this notification?')) return;
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slides in from right on md+, bottom on mobile */}
      <div className="fixed inset-0 z-50 flex items-end md:items-start md:justify-end">
        <div
          className="flex h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200/80 bg-white shadow-xl md:h-screen md:max-w-md md:rounded-none md:rounded-l-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A84C]/20 bg-[#FDFAF3]">
                <Bell size={14} className="text-[#C9A84C]" />
              </div>
              <h2 className="text-sm font-black text-gray-900">Notification details</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Gold accent bar */}
          <div className="h-[2px] flex-shrink-0 bg-gradient-to-r from-[#C9A84C]/30 via-[#C9A84C] to-[#C9A84C]/30" />

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {/* Icon + title */}
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                <TypeIcon size={20} className="text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black leading-snug text-gray-900">
                  {notification.title}
                </h3>
                {isUnread && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#C9A84C]/20 bg-[#FDFAF3] px-2 py-0.5 text-[10px] font-semibold text-[#C9A84C]">
                    Unread
                  </span>
                )}
              </div>
            </div>

            {/* Body text */}
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {notification.body}
            </p>

            {/* Meta */}
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Type
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                >
                  {typeConfig.label}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Priority
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${priorityConfig.dot}`}
                  />
                  <span className="text-xs font-semibold text-gray-600">
                    {priorityConfig.label}
                  </span>
                </div>
              </div>

              {/* Received */}
              <div className="flex items-start justify-between gap-4">
                <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Received
                </span>
                <span className="text-right text-xs text-gray-600">
                  {new Date(notification.created_at).toLocaleString()}{' '}
                  <span className="text-gray-400">
                    ({formatRelativeTime(notification.created_at)})
                  </span>
                </span>
              </div>

              {/* Read at */}
              {notification.read_at && (
                <div className="flex items-start justify-between gap-4">
                  <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Read
                  </span>
                  <span className="text-right text-xs text-gray-600">
                    {new Date(notification.read_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Additional data */}
            {showRawData && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Additional data
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <pre className="text-xs text-gray-500">
                    {JSON.stringify(notification.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 space-y-2 border-t border-gray-100 p-5">
            {actionUrl && (
              <a
                href={actionUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
              >
                Open
                <ArrowRight size={15} />
              </a>
            )}

            {isUnread && (
              <button
                onClick={handleMarkAsRead}
                className={
                  actionUrl
                    ? 'flex w-full items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/25 bg-white py-2.5 text-sm font-semibold text-[#C9A84C] transition hover:bg-[#FDFAF3]'
                    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]'
                }
              >
                <Check size={15} />
                Mark as read
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {isDeleting ? 'Deleting…' : 'Delete notification'}
            </button>

            <button
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};