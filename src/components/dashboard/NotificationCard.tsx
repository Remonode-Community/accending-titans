/**
 * NotificationCard Component
 * Displays a single notification with actions
 * Optimized: Uses consistent formatting, supports selection state
 */

'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, Bell, Cake, CheckCircle, Gift, Info, Trash2, Zap } from 'lucide-react';
import { formatNotificationDate, getNotificationTypeColor, getPriorityColor } from '@/utils/notification.utils';
import { Notification, NotificationType } from '@/types/notification.types';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (notification: Notification) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = 'h-6 w-6';

  const typeIcons: Record<NotificationType, React.ReactNode> = {
    transaction: <CheckCircle className={`${iconProps} text-blue-500`} />,
    system: <Zap className={`${iconProps} text-yellow-500`} />,
    promotion: <Gift className={`${iconProps} text-purple-500`} />,
    update: <Info className={`${iconProps} text-cyan-500`} />,
    alert: <AlertCircle className={`${iconProps} text-red-500`} />,
    birthday: <Cake className={`${iconProps} text-[#C9A84C]`} />,
  };

  return typeIcons[type] || <Bell className={`${iconProps} text-gray-500`} />;
};

const getTypeBadgeStyles = (type: NotificationType) => {
  const styles: Record<NotificationType, string> = {
    transaction: 'bg-blue-100 dark:bg-blue-200 text-blue-700',
    system: 'bg-yellow-100 dark:bg-yellow-200 text-yellow-700',
    promotion: 'bg-purple-100 dark:bg-purple-200 text-purple-700',
    update: 'bg-cyan-100 dark:bg-cyan-200 text-cyan-700',
    alert: 'bg-red-100 dark:bg-red-200 text-red-700',
    birthday: 'bg-[#FDFAF3] dark:bg-[#1a1a1a] text-[#9A7B2E]',
  };
  return styles[type] || styles.system;
};

const getPriorityDot = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500',
    normal: 'bg-slate-400',
    low: 'bg-gray-300',
  };
  return colors[priority] || colors.normal;
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onView,
  isSelected,
  onToggleSelect,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isUnread = !notification.read_at;
  const formattedDate = formatNotificationDate(notification.created_at);

  const handleMarkAsRead = async () => {
    if (isUnread && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this notification?')) {
      setIsDeleting(true);
      try {
        await onDelete(notification.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleSelect = () => {
    onToggleSelect?.(notification.id);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer hover:border-gray-300 dark:border-gray-500"
      onClick={() => onView?.(notification)}
    >
      <div className="flex gap-4 p-4">
        {/* Icon container */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-800 text-sm">
                  {notification.title}
                </h3>
                {!notification.read_at && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1 break-words">
                {notification.body}
              </p>
            </div>

            {/* Selection checkbox (for list views) */}
            {isSelected !== undefined && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleToggleSelect}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#C9A84C]"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-500">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium capitalize ${getTypeBadgeStyles(
                notification.type
              )}`} style={{ color: getNotificationTypeColor(notification.type) }}
            >
              {notification.type}
            </div>

            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(notification.priority)}`}
              />
              <span className="text-xs text-gray-500 capitalize">
                {notification.priority}
              </span>
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};