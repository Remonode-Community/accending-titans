/* ──────────────────────────────────────────────────────────────────────
  NotificationBell Component
  ── Header notification bell with unread badge, grouped dropdown,
  and quick access to notification management
  ────────────────────────────────────────────────────────────────────── */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { formatNotificationDate, groupNotificationsByDate } from '@/utils/notification.utils';
import type { Notification } from '@/types/notification.types';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
}) => {
  const { notifications, loading, error, getUnreadCount, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = getUnreadCount();

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications({ per_page: 10, unread_only: true });
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Group notifications by date for the dropdown
  const groupedNotifications = groupNotificationsByDate(notifications);

  const renderDesktopDropdown = () => {
    const todayClass = 'bg-blue-50';
    const yesterdayClass = 'bg-white';
    const otherClass = 'bg-gray-50';

    // Compute the grouped sections
    const sections = Object.entries(groupedNotifications)
      .reverse()
      .filter(([_, items]) => items.length > 0)
      .map(([period, periodNotifications]) => {
        const showHeader =
          period === 'today'
            ? 'Today'
            : period === 'yesterday'
              ? 'Yesterday'
              : period === 'thisWeek'
                ? 'This week'
                : 'Older';
        const periodClass = period === 'today' ? todayClass : period === 'yesterday' ? yesterdayClass : otherClass;
        return { period, showHeader, periodNotifications, periodClass };
      });

    return (
      <div className="hidden sm:block absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-3 sm:p-4 text-center text-red-600 text-xs sm:text-sm">
              <p>Failed to load notifications</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs sm:text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {sections.map((section) => (
                <div key={section.period} className={`p-3 sm:p-4 border-b ${section.periodClass}`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{section.showHeader}</p>
                  {section.periodNotifications.slice(0, 3).map((notification: Notification) => (
                    <div key={notification.id} className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm cursor-pointer transition-colors">
                      <div className="font-medium text-gray-900 line-clamp-1">{notification.title}</div>
                      <p className="text-gray-600 line-clamp-2 mt-0.5 text-xs sm:text-sm">{notification.body}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">{notification.type}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}

                  {section.periodNotifications.length > 3 && (
                    <a href="/dashboard/notifications" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 block text-right">
                      View all {section.period} notifications
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-t bg-gray-50 text-center">
          <Link href="/dashboard/notifications" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => setIsOpen(false)}>View all notifications</Link>
        </div>
      </div>
    );
  };

  const renderMobilePanel = () => {
    return (
      <div className="sm:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex-shrink-0 px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-3 text-center text-red-600 text-xs">
              <p>Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="h-6 w-6 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="px-3 py-2 text-xs cursor-pointer transition-colors">
                  <div className="font-medium text-gray-900 line-clamp-1">{notification.title}</div>
                  <p className="text-gray-600 line-clamp-2 mt-0.5 text-xs">{notification.body}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">{notification.type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-3 py-2 border-t bg-gray-50 text-center">
          <Link href="/dashboard/notifications" className="text-xs text-blue-600 hover:text-blue-700 font-medium" onClick={() => setIsOpen(false)}>View all notifications</Link>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`relative p-2 rounded-lg transition-colors ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`} title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <>
          {renderDesktopDropdown()}
          {renderMobilePanel()}
        </>
      )}
    </div>
  );
};