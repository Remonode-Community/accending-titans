'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { Topbar } from '@/components/shared/Topbar';
import {
  LayoutDashboard,
  Users,
  Gift,
  Share2,
  Bell,
  BarChart3,
  FileText,
  Award,
  LogOut,
  X,
  Mail,
  Zap,
  Tags,
  Network,
  Settings,
  Activity,
  ChevronDown,
  ChevronRight,
  Menu,
  Receipt,
  Sparkles,
  Megaphone,
  Shield,
  KeyRound,
  Store,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';

// ─── Navigation Configuration ─────────────────────────────────────────

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Permissions', href: '/admin/permissions', icon: KeyRound },
      { label: 'Portfolios', href: '/admin/portfolios', icon: Store },
      { label: 'Transactions', href: '/admin/transactions', icon: Receipt },
      { label: 'Services', href: '/admin/services', icon: Network },
    ],
  },
  {
    label: 'Subscriptions',
    items: [
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: Star },
    ],
  },
  {
    label: 'Content & Rewards',
    items: [
      { label: 'Content Review', href: '/admin/content', icon: FileText },
      { label: 'Birthdays', href: '/admin/birthdays', icon: Gift },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Referrals', href: '/admin/referrals', icon: Share2 },
      { label: 'Rewards', href: '/admin/rewards', icon: Gift },
      { label: 'Loyalty Tiers', href: '/admin/loyalty', icon: Award },
      { label: 'Loyalty Users', href: '/admin/loyalty/users', icon: Users },
      { label: 'Offer Codes', href: '/admin/offer-codes', icon: Tags },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { label: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Email Campaigns', href: '/admin/promotional-emails', icon: Mail },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/admin/reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Activity Log', href: '/admin/activity-log', icon: Activity },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href) ?? false;
  };

  // Auto-expand group if it contains active item
  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some((item) => {
        if (item.href === '/admin') return pathname === '/admin';
        return pathname?.startsWith(item.href);
      })
    );
    if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
  }, [pathname]);

  // Wait for hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (!user.isEmailVerified) {
        console.warn('[AdminLayout] User email not verified, redirecting to verification page');
        router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
        return;
      }

      const isAdmin = user.roles?.some((r) => r === 'admin');
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [isMounted, user, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {!mobile && (
        <div className="border-b border-gray-200 px-5 py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="Acceding Titans Logo"
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 rounded-full object-contain"
            />
            {(sidebarOpen || mobile) && (
              <div>
                <p className="text-lg font-black tracking-tight text-gray-900 leading-tight">
                  Acceding Titans
                </p>
                <p className="text-xs font-semibold text-gray-500 leading-tight">
                  Admin Panel
                </p>
              </div>
            )}
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {navGroups.map((group) => {
          const hasActiveChild = group.items.some((item) => isActive(item.href));
          const isExpanded = expandedGroups[group.label] ?? hasActiveChild;

          return (
            <div key={group.label} className="mb-2">
              {/* Group Header */}
              {sidebarOpen || mobile ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition',
                    hasActiveChild
                      ? 'text-[#C9A84C]'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <span>{group.label}</span>
                  {isExpanded ? (
                    <ChevronDown size={12} className="opacity-50" />
                  ) : (
                    <ChevronRight size={12} className="opacity-50" />
                  )}
                </button>
              ) : (
                <div className="h-4" />
              )}

              {/* Group Items */}
              {(isExpanded || !sidebarOpen) && (
                <div className={clsx('space-y-0.5', sidebarOpen || mobile ? 'mt-1' : '')}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => mobile && setMobileMenuOpen(false)}
                        className={clsx(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
                          active
                            ? 'bg-[#C9A84C] text-white shadow-lg shadow-[#C9A84C]/25'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                        title={!sidebarOpen && !mobile ? item.label : undefined}
                      >
                        <Icon
                          size={18}
                          className={clsx(
                            'flex-shrink-0',
                            active
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {(sidebarOpen || mobile) && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {(sidebarOpen || mobile) && item.badge && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9A84C]/20 px-1.5 text-[10px] font-bold text-[#C9A84C]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        {(sidebarOpen || mobile) && (
          <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-black text-gray-900">
              {user?.first_name || 'Admin User'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {user?.email || ''}
            </p>
          </div>
        )}

        {/* Sidebar Toggle (Desktop) */}
        {!mobile && (
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        )}

        <button
          onClick={() => {
            router.push('/auth/login');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(sidebarOpen || mobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 md:flex',
          sidebarOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#fafafa]">
        {/* Top Bar */}
        <Topbar onMenuToggle={() => setMobileMenuOpen((open) => !open)} mobileMenuOpen={mobileMenuOpen} />

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={clsx(
            'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200 bg-white text-gray-900 transition-transform duration-300 md:hidden',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="border-b border-gray-200 px-5 py-5 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
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
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">
                  Admin Panel
                </p>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 flex-shrink-0"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <SidebarContent mobile />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] px-4 py-6 text-[#111]">
          {children}
        </main>
      </div>
    </div>
  );
}
