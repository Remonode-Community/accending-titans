'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  Cake,
  FileText,
  Home,
  Layers,
  Lock,
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
import { useFeatureStore } from '@/store/feature.store';
import type {
  FeatureKey,
  FeatureUnavailableReason,
} from '@/types/platform-settings.types';

/**
 * Sidebar items that an administrator can switch off.
 *
 * Kept beside the navigation rather than inside each item so the nav array
 * (and its explanatory comments) stay untouched.
 */
const NAV_FEATURES: Record<string, FeatureKey> = {
  '/dashboard/catalogue': 'catalogue',
  '/dashboard/subscriptions': 'subscriptions',
  '/dashboard/wallet': 'wallet',
  '/dashboard/birthdays': 'birthdays',
  '/dashboard/network': 'network',
  '/dashboard/content': 'content',
  '/dashboard/rankings': 'rankings',
  '/dashboard/referral': 'referrals',
  '/dashboard/messages': 'messages',
  '/dashboard/opportunities': 'opportunities',
};

/**
 * Route prefixes owned by a switchable feature. Direct navigation is blocked
 * too, not just the link: hiding a menu item is not access control.
 */
const FEATURE_ROUTE_PREFIXES: Array<{
  prefix: string;
  feature: FeatureKey;
  label: string;
}> = [
  { prefix: '/dashboard/catalogue', feature: 'catalogue', label: 'Business Catalogue' },
  { prefix: '/dashboard/subscriptions', feature: 'subscriptions', label: 'Subscription' },
  { prefix: '/dashboard/wallet', feature: 'wallet', label: 'Wallet' },
  { prefix: '/dashboard/birthdays', feature: 'birthdays', label: 'Birthdays' },
  { prefix: '/dashboard/network', feature: 'network', label: 'Member Network' },
  { prefix: '/dashboard/content', feature: 'content', label: 'Submit Content' },
  { prefix: '/dashboard/rankings', feature: 'rankings', label: 'Rankings' },
  { prefix: '/dashboard/referral', feature: 'referrals', label: 'Referral Program' },
  { prefix: '/dashboard/messages', feature: 'messages', label: 'Messages' },
  { prefix: '/dashboard/opportunities', feature: 'opportunities', label: 'Opportunities' },
];

function FeatureUnavailable({
  label,
  reason,
  hasPlan,
}: {
  label: string;
  reason: FeatureUnavailableReason;
  hasPlan: boolean;
}) {
  const needsPlan = reason === 'plan';

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div
          className={clsx(
            'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            needsPlan ? 'bg-[#FDFAF3]' : 'bg-amber-50'
          )}
        >
          {needsPlan ? (
            <Lock size={24} className="text-[#B8962E]" />
          ) : (
            <Settings size={26} className="text-amber-600" />
          )}
        </div>

        <h2 className="text-lg font-bold text-gray-900">
          {needsPlan
            ? hasPlan
              ? `${label} is not in your plan`
              : `Unlock ${label}`
            : `${label} is unavailable`}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {needsPlan
            ? hasPlan
              ? 'Your current plan does not include this feature. You can switch to a plan that includes it when your current term ends.'
              : 'This feature is included in a membership plan. Choose a plan to get started.'
            : 'This feature is temporarily switched off. Please check back later.'}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {needsPlan && (
            <Link
              href="/dashboard/subscriptions"
              className="inline-flex items-center justify-center rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B8962E]"
            >
              {hasPlan ? 'View your plan' : 'View plans'}
            </Link>
          )}
          <Link
            href="/dashboard"
            className={clsx(
              'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
              needsPlan
                ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                : 'bg-[#C9A84C] text-white hover:bg-[#B8962E]'
            )}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();
  const { activeRole } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const features = useFeatureStore((s) => s.features);
  const unavailable = useFeatureStore((s) => s.unavailable);
  const plan = useFeatureStore((s) => s.plan);
  const featuresLoaded = useFeatureStore((s) => s.loaded);
  const loadFeatures = useFeatureStore((s) => s.load);

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
  useEffect(() => {    const handleClickOutside = (event: MouseEvent) => {
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
  // Network celebrations: where a member's network comes together to
  // celebrate them, and quietly plan a surprise.
  //
  // The old `/dashboard/rewards` birthday page was folded into this section:
  // its loyalty-reward status now renders as a "Birthday reward" card on this
  // hub, so the separate route was removed. `/dashboard/rewards/history`
  // (the cashback/referral transaction ledger) is a different feature and
  // still exists.
  { href: '/dashboard/birthdays', label: 'Birthdays', icon: Cake },
    // The member network: circles, the ask board, and the impact ledger. It is
    // a plan feature, so the whole network requires a plan that includes it —
    // enforced server-side, not merely hidden here.
    { href: '/dashboard/network', label: 'Member Network', icon: Layers },
    { href: '/dashboard/content', label: 'Submit Content', icon: Upload },
    { href: '/dashboard/rankings', label: 'Rankings', icon: TrendingUp },
    { href: '/dashboard/referral', label: 'Referral Program', icon: Users },
    { href: '/dashboard/messages', label: 'Messages', icon: Send },
    { href: '/dashboard/opportunities', label: 'Opportunities', icon: Award },
  ];

  useEffect(() => {
    if (user) loadFeatures();
  }, [user, loadFeatures]);

  const isActive = (href: string) => pathname === href;

  const visibleNavItems = featuresLoaded
    ? navItems.filter((item) => {
        const feature = NAV_FEATURES[item.href];
        return !feature || features[feature] !== false;
      })
    : navItems;

  const activeFeature = featuresLoaded
    ? FEATURE_ROUTE_PREFIXES.find(
        ({ prefix }) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
      )
    : undefined;

  const featureBlocked = Boolean(activeFeature && features[activeFeature.feature] === false);

  const featureUnavailableReason: FeatureUnavailableReason = activeFeature
    ? unavailable[activeFeature.feature] ?? 'disabled'
    : 'disabled';

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
                Business Directory
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
              {visibleNavItems.map((item) => {
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
                      href="/dashboard/profile"
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
                    Business Directory
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
        {visibleNavItems.map((item) => {
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
            {featureBlocked && activeFeature ? (
              <FeatureUnavailable
                label={activeFeature.label}
                reason={featureUnavailableReason}
                hasPlan={Boolean(plan?.has_active_subscription)}
              />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </AuthProtected>
  );
};

export default DashboardLayout;