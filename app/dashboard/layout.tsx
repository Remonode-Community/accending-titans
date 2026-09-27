'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  FileText,
  Gift,
  Home,
  LogOut,
  Menu,
  Send,
  Settings,
  Users,
  X,
  Bell,
  ChevronDown,
  Wallet,
  ShoppingBag,
  Star,
  Upload,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Topbar } from '@/components/shared/Topbar';
import { AuthProtected } from '@/components/AuthProtected';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { RoleSwitcher } from '@/components/shared/RoleSwitcher';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();
  const { activeRole } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    if (!user.isEmailVerified) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    const dashboardSpecificPages = ['/dashboard/profile', '/dashboard/catalogue'];
    const isDashboardSpecificPage = dashboardSpecificPages.some((page) =>
      pathname?.startsWith(page)
    );

    if (isDashboardSpecificPage) {
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [user, router, pathname]);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    };

    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAvatarMenu]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/catalogue', label: 'Business Catalogue', icon: ShoppingBag },
    { href: '/dashboard/subscriptions', label: 'Subscription', icon: Star },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/rewards', label: 'Birthday Rewards', icon: Gift },
    { href: '/dashboard/content', label: 'Submit Content', icon: Upload },
    { href: '/dashboard/rankings', label: 'Rankings', icon: TrendingUp },
    { href: '/dashboard/referral', label: 'Referral Program', icon: Users },
    { href: '/dashboard/messages', label: 'Messages', icon: Send },
    { href: '/dashboard/opportunities', label: 'Opportunities', icon: Award },
  ];

  const isActive = (href: string) => pathname === href;

  const initials = user?.first_name
    ? user.first_name.slice(0, 1).toUpperCase() + (user?.last_name?.slice(0, 1).toUpperCase() ?? '')
    : 'AT';

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="border-b border-gray-100 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Acceding Titans Logo"
            width={36}
            height={36}
            className="h-9 w-9 flex-shrink-0 rounded-full object-contain"
          />
          {(sidebarOpen || mobile) && (
            <div>
              <p className="text-sm font-black tracking-tight text-gray-900 leading-tight">
                Acceding Titans
              </p>
              <p className="text-[11px] font-semibold text-gray-400 leading-tight">
                Payment Wallet
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={clsx(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                active
                  ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                size={17}
                className={clsx(
                  'flex-shrink-0',
                  active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {(sidebarOpen || mobile) && (
          <div className="mb-2 rounded-xl border border-[#C9A84C]/15 bg-[#FDFAF3] px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]/70">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-black text-gray-900">
              {user?.first_name || 'Acceding Titans User'}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            logout();
            if (mobile) setMobileMenuOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {(sidebarOpen || mobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <AuthProtected requireAuth>
      <div className="flex h-screen overflow-hidden bg-[#f8f8f8] text-gray-900">

        {/* Desktop Sidebar */}
        <aside
          className={clsx(
            'hidden shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 md:flex',
            sidebarOpen ? 'w-64' : 'w-[72px]'
          )}
        >
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <p className="hidden text-sm font-medium text-gray-400 sm:block">
                Good day, {user?.first_name || 'there'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Switcher - visible for admins/multi-role users */}
              <RoleSwitcher />

              {/* Notification Bell */}
              <NotificationBell className="mr-2" />

              {/* Avatar with dropdown */}
              <div className="relative" ref={avatarMenuRef}>
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C9A84C]/25 bg-[#FDFAF3] text-xs font-black text-[#B8962E] hover:bg-[#F0E5D3] transition-colors cursor-pointer"
                  title="Profile menu"
                >
                  {initials}
                </button>

                {/* Avatar dropdown menu */}
                {showAvatarMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {/* Profile Link */}
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowAvatarMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 rounded-t-lg transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>My Profile</span>
                      </div>
                    </Link>

                    {/* Settings Link */}
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowAvatarMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={16} />
                        <span>Settings</span>
                      </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        logout();
                        setShowAvatarMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors border-t border-gray-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut size={16} />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mobile overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile Sidebar */}
          <aside
            className={clsx(
              'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 md:hidden',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image
                  src="/icon.png"
                  alt="Acceding Titans Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 flex-shrink-0 rounded-full object-contain"
                />
                <div>
                  <p className="text-sm font-black tracking-tight text-gray-900 leading-tight">
                    Acceding Titans
                  </p>
                  <p className="text-[11px] font-semibold text-gray-400 leading-tight">
                    Payment Wallet
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                      active
                        ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon
                      size={17}
                      className={clsx(
                        'flex-shrink-0',
                        active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-100 p-3 space-y-1">
              <div className="mb-2 rounded-xl border border-[#C9A84C]/15 bg-[#FDFAF3] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]/70">
                  Signed in as
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-gray-900">
                  {user?.first_name || 'Acceding Titans User'}
                </p>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-[#f8f8f8] p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProtected>
  );
};

export default DashboardLayout;