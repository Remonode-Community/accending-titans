'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

interface TopbarProps {
  onMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle,
  mobileMenuOpen = false,
}) => {
  const { user, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMounted]);

  const userInitials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
        .toUpperCase()
    : '?';

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Menu toggle */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Center/Right section - Flex spacer and user menu */}
          <div className="flex-1" />

          {/* Role Switcher - Only shows if user has multiple roles */}
          <RoleSwitcher />

          {/* Notification Bell */}
          <NotificationBell className="mr-2" />

          {/* User Profile Menu */}
          {user && isMounted ? (
            <div className="relative" ref={menuRef}>
              {/* User Profile Button */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-[#c9a84c] flex items-center justify-center text-xs font-bold text-white">
                  {user.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
                <span className="hidden sm:inline">{user.first_name}</span>
                <ChevronDown
                  size={16}
                  className={`transition ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200 shadow-lg z-50 overflow-hidden">
                  {/* User Email and Phone Status */}
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-600 mb-3">Account Status</p>
                    <div className="space-y-3">
                      {/* Email Status */}
                      <div className="flex flex-col items-start">
                        <span
                          className={`text-xs font-semibold mb-1 ${
                            user.email_verified_at
                              ? 'text-green-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {user.email_verified_at ? '✓ Verified' : '⚠ Pending'}
                        </span>
                        <span className="text-xs text-gray-700 truncate">{user.email}</span>
                      </div>
                      
                      {/* Phone Status */}
                      <div className="flex flex-col items-start">
                        <span
                          className={`text-xs font-semibold mb-1 ${
                            user.phone_verified_at
                              ? 'text-green-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {user.phone_verified_at ? '✓ Verified' : '⚠ Pending'}
                        </span>
                        <span className="text-xs text-gray-700">Phone</span>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
