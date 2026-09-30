'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  UserX,
  MailCheck,
  Phone,
  UserCog,
  TrendingUp,
  Activity,
  LogIn,
  BarChart3,
  Share2,
  Bell,
  Target,
  RefreshCw,
  AlertCircle,
  Shield,
  UserPlus,
  Eye,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { useAuthStore } from '@/store/auth.store';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoader';
import { adminService } from '@/services/admin.service';
import type { AdminDashboardStatsData } from '@/types/admin-stats.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return n.toLocaleString();
}

function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0%';
  return `${n}%`;
}

function getRoleBadgeColor(role: string): string {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    customer: 'bg-green-100 text-green-800 border-green-200',
    user: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return map[role?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminDashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAdminStats();
      if (res.success && res.data?.stats) {
        setData(res.data.stats);
      } else {
        throw new Error(res.message || 'Invalid response from server');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load dashboard stats';
      setError(msg);
      console.error('[AdminDashboard] Error:', err);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    fetchStats();
  };

  if (!isAdmin) return null;

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)] mx-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-sm text-[#6b7280] mb-6">{error || 'Failed to load data'}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c9a84c] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8962e] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const { user_overview, role_distribution, registration_trend, login_analytics, active_users_metrics, referral_analytics, notification_analytics, verification_funnel, verification_breakdown } = data;

  // ── KPI Cards ──────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      label: 'Total Users',
      value: formatNumber(user_overview.total_users),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      subtext: `${formatNumber(user_overview.active_users)} active`,
    },
    {
      label: 'Verified Users',
      value: formatNumber(user_overview.verified_users),
      icon: MailCheck,
      color: 'bg-emerald-50 text-emerald-600',
      subtext: `${formatPercent(user_overview.total_users ? (user_overview.verified_users / user_overview.total_users) * 100 : 0)} verification rate`,
    },
    {
      label: 'Active Today',
      value: formatNumber(active_users_metrics.daily_active_users),
      icon: Activity,
      color: 'bg-purple-50 text-purple-600',
      subtext: `${formatNumber(active_users_metrics.weekly_active_users)} this week`,
    },
    {
      label: 'New Users (Today)',
      value: formatNumber(registration_trend.today),
      icon: UserPlus,
      color: 'bg-green-50 text-green-600',
      subtext: `${formatNumber(registration_trend.this_week)} this week · ${formatNumber(registration_trend.this_month)} this month`,
    },
    {
      label: 'Total Logins',
      value: formatNumber(login_analytics.total_logins),
      icon: LogIn,
      color: 'bg-indigo-50 text-indigo-600',
      subtext: `${formatNumber(login_analytics.today)} today`,
    },
    {
      label: 'Referrals',
      value: formatNumber(referral_analytics.total_referrals),
      icon: Share2,
      color: 'bg-orange-50 text-orange-600',
      subtext: `${formatNumber(referral_analytics.users_with_referral_links)} referrers · ${formatPercent(referral_analytics.referral_conversion_rate)} conversion`,
    },
    {
      label: 'Unread Notifications',
      value: formatNumber(notification_analytics.unread_notifications),
      icon: Bell,
      color: 'bg-rose-50 text-rose-600',
      subtext: `${formatNumber(notification_analytics.total_notifications)} total`,
    },
    {
      label: 'Profile Completion',
      value: formatPercent(user_overview.user_completion_rate),
      icon: UserCog,
      color: 'bg-cyan-50 text-cyan-600',
      subtext: `${formatNumber(user_overview.users_with_complete_profile)} completed`,
    },
  ];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-6 bg-[#f8f8f8] p-4 sm:p-6 lg:p-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Real-time user analytics and system metrics
        </p>
      </section>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      {/*
        KPI strip.

        On phones the eight cards run in one horizontally scrollable row instead
        of stacking into a screenful of vertical scrolling. This is the same
        pattern /admin/notifications already uses, so both admin screens behave
        identically.

        -mx-4 / px-4 cancels this page's own gutter so the scroll area spans
        the full width of the content column, then re-insets the cards so the
        first card still lines up with the headings and panels below and the
        last one has room to scroll clear. (The admin shell insets the content
        column itself, so this is a column-wide bleed, not a screen-edge one.)

        tabIndex + role + aria-label make the strip keyboard-reachable: a scroll
        container that cannot take focus is unreachable by keyboard
        (WCAG 2.1.1).
      */}
      <section
        role="region"
        aria-label="Key performance indicators, scroll horizontally"
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
      >
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="w-[78vw] max-w-[320px] shrink-0 snap-center rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_15px_45px_rgba(0,0,0,0.08)] sm:w-auto sm:max-w-none sm:snap-align-none"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#111827]">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-[#6b7280]">{kpi.subtext}</p>
                </div>
                <div className={`rounded-xl ${kpi.color} p-3 flex-shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {/* ── Row 1: Role Distribution + Verification Funnel ────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Role Distribution */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Role Distribution</h3>
              <p className="text-xs text-[#6b7280]">Users grouped by role</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(role_distribution).map(([role, count]) => {
              const total = Object.values(role_distribution).reduce((a, b) => a + b, 0) || 1;
              const pct = (count / total) * 100;
              return (
                <div key={role}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getRoleBadgeColor(role)}`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#111827]">
                      {formatNumber(count)} <span className="font-normal text-[#6b7280]">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div
                      className="h-full rounded-full bg-[#c9a84c] transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Verification Funnel */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Verification Funnel</h3>
              <p className="text-xs text-[#6b7280]">User verification progress</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Registered', value: verification_funnel.registered, color: 'bg-gray-200' },
              { label: 'Email Verified', value: verification_funnel.email_verified, color: 'bg-blue-400' },
              { label: 'Phone Verified', value: verification_funnel.phone_verified, color: 'bg-emerald-400' },
              { label: 'Profile Completed', value: verification_funnel.profile_completed, color: 'bg-[#c9a84c]' },
            ].map((step) => {
              const maxVal = verification_funnel.registered || 1;
              const pct = (step.value / maxVal) * 100;
              return (
                <div key={step.label} className="rounded-xl bg-[#f8fafc] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#111827]">{step.label}</span>
                    <span className="text-lg font-extrabold text-[#111827]">{formatNumber(step.value)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div
                      className={`h-full rounded-full transition-all ${step.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#e5e7eb] p-3 text-center">
              <p className="text-xs font-medium text-[#6b7280]">Both Verified</p>
              <p className="mt-1 text-lg font-extrabold text-[#111827]">{formatNumber(verification_breakdown.both_verified)}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] p-3 text-center">
              <p className="text-xs font-medium text-[#6b7280]">Neither Verified</p>
              <p className="mt-1 text-lg font-extrabold text-[#111827]">{formatNumber(verification_breakdown.neither_verified)}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Row 2: Login Analytics + Registration Trend ──────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Login Analytics */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5">
              <LogIn className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Login Analytics</h3>
              <p className="text-xs text-[#6b7280]">Login activity overview</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Today', value: login_analytics.today },
              { label: 'This Week', value: login_analytics.this_week },
              { label: 'This Month', value: login_analytics.this_month },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-[#f8fafc] p-3 text-center">
                <p className="text-[11px] font-medium text-[#6b7280] uppercase">{item.label}</p>
                <p className="mt-1 text-xl font-extrabold text-[#111827]">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>

          {/* Login Channels */}
          {Object.keys(login_analytics.by_channel).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">By Channel</p>
              <div className="space-y-2">
                {Object.entries(login_analytics.by_channel).map(([channel, count]) => {
                  const total = Object.values(login_analytics.by_channel).reduce((a, b) => a + b, 0) || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={channel} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827] capitalize">{channel}</span>
                      <span className="text-sm text-[#6b7280]">{formatNumber(count)} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Login Trend (14 days) - mini bar chart */}
          {login_analytics.trend_14_days.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">14-Day Trend</p>
              <div className="flex items-end gap-1 h-16">
                {login_analytics.trend_14_days.map((day, i) => {
                  const maxVal = Math.max(...login_analytics.trend_14_days.map((d) => d.count), 1);
                  const height = (day.count / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-[#c9a84c]/60 hover:bg-[#c9a84c] transition-colors relative group"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.date}: ${day.count} logins`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Registration Trend */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Registration Trend</h3>
              <p className="text-xs text-[#6b7280]">Daily sign-ups (30 days)</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Today', value: registration_trend.today },
              { label: 'Week', value: registration_trend.this_week },
              { label: 'Month', value: registration_trend.this_month },
              { label: '7 Days', value: registration_trend.last_7_days },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-[#f8fafc] p-3 text-center">
                <p className="text-[11px] font-medium text-[#6b7280] uppercase">{item.label}</p>
                <p className="mt-1 text-xl font-extrabold text-[#111827]">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>

          {/* Bar Chart - 30 day registration trend */}
          {registration_trend.daily_30_days.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Daily Registrations</p>
              <div className="flex items-end gap-[2px] h-24">
                {registration_trend.daily_30_days.map((day, i) => {
                  const maxVal = Math.max(...registration_trend.daily_30_days.map((d) => d.count), 1);
                  const height = (day.count / maxVal) * 100;
                  const isToday = i === registration_trend.daily_30_days.length - 1;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-colors relative group ${
                        isToday ? 'bg-[#c9a84c]' : day.count > 0 ? 'bg-[#c9a84c]/50 hover:bg-[#c9a84c]/70' : 'bg-gray-100'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.count} registrations`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[#6b7280]">
                <span>{registration_trend.daily_30_days[0]?.date?.slice(5) || ''}</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── Row 3: Referral Analytics + Active Users + Notifications ──────── */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Referral Analytics */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_Rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2.5">
              <Share2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Referral Analytics</h3>
              <p className="text-xs text-[#6b7280]">Referral program metrics</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between rounded-lg bg-[#f8fafc] px-4 py-3">
              <span className="text-sm text-[#6b7280]">Total Referral Links</span>
              <span className="text-sm font-bold text-[#111827]">{formatNumber(referral_analytics.total_referral_links)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-[#f8fafc] px-4 py-3">
              <span className="text-sm text-[#6b7280]">Total Referrals</span>
              <span className="text-sm font-bold text-[#111827]">{formatNumber(referral_analytics.total_referrals)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-[#f8fafc] px-4 py-3">
              <span className="text-sm text-[#6b7280]">Conversion Rate</span>
              <span className="text-sm font-bold text-green-600">{formatPercent(referral_analytics.referral_conversion_rate)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-[#f8fafc] px-4 py-3">
              <span className="text-sm text-[#6b7280]">Avg Referrals/Referrer</span>
              <span className="text-sm font-bold text-[#111827]">{referral_analytics.average_referrals_per_referrer.toFixed(1)}</span>
            </div>
          </div>

          {/* Top Referrers */}
          {referral_analytics.top_referrers.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Top Referrers</p>
              <div className="space-y-2">
                {referral_analytics.top_referrers.slice(0, 3).map((ref, i) => (
                  <div key={ref.user_id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a84c]/10 text-[10px] font-bold text-[#c9a84c]">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-[#111827] truncate max-w-[120px]">{ref.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#c9a84c]">{ref.total_referrals}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Active Users Metrics */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Active Users</h3>
              <p className="text-xs text-[#6b7280]">User engagement metrics</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Daily Active Users (DAU)', value: active_users_metrics.daily_active_users, icon: Eye },
              { label: 'Weekly Active Users (WAU)', value: active_users_metrics.weekly_active_users, icon: Activity },
              { label: 'Monthly Active Users (MAU)', value: active_users_metrics.monthly_active_users, icon: TrendingUp },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-xl bg-[#f8fafc] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <Icon className="h-4 w-4 text-[#c9a84c]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#6b7280]">{metric.label}</p>
                      <p className="mt-0.5 text-2xl font-extrabold text-[#111827]">{formatNumber(metric.value)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Overview Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#e5e7eb] p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-[#6b7280]">Deleted</p>
              <p className="mt-1 text-lg font-extrabold text-red-500">{formatNumber(user_overview.deleted_users)}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] p-3 text-center">
              <p className="text-[10px] font-medium uppercase text-[#6b7280]">Phone Verified</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-500">{formatNumber(user_overview.phone_verified_users)}</p>
            </div>
          </div>
        </Card>

        {/* Notifications Overview */}
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5">
              <Bell className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Notifications</h3>
              <p className="text-xs text-[#6b7280]">Notification analytics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-[#f8fafc] p-4 text-center">
              <p className="text-[10px] font-medium uppercase text-[#6b7280]">Total</p>
              <p className="mt-1 text-2xl font-extrabold text-[#111827]">{formatNumber(notification_analytics.total_notifications)}</p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4 text-center">
              <p className="text-[10px] font-medium uppercase text-[#6b7280]">Unread</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-500">{formatNumber(notification_analytics.unread_notifications)}</p>
            </div>
          </div>

          {/* Notification Trend (14 days) */}
          {notification_analytics.trend_14_days.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">14-Day Trend</p>
              <div className="flex items-end gap-1 h-16">
                {notification_analytics.trend_14_days.map((day, i) => {
                  const maxVal = Math.max(...notification_analytics.trend_14_days.map((d) => d.count), 1);
                  const height = (day.count / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-rose-300/60 hover:bg-rose-400 transition-colors"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.date}: ${day.count}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications by type */}
          {notification_analytics.by_type.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">By Type</p>
              <div className="space-y-1.5">
                {notification_analytics.by_type.map((item) => (
                  <div key={item.type} className="flex justify-between text-sm">
                    <span className="text-[#111827] capitalize">{item.type}</span>
                    <span className="font-semibold text-[#111827]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── Referral 30-Day Trend (full width) ─────────────────────────────── */}
      {referral_analytics.trend_30_days.length > 0 && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2.5">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Referral Trend (30 Days)</h3>
              <p className="text-xs text-[#6b7280]">Daily referral activity</p>
            </div>
          </div>

          <div className="flex items-end gap-[3px] h-32">
            {referral_analytics.trend_30_days.map((day, i) => {
              const maxVal = Math.max(...referral_analytics.trend_30_days.map((d) => d.count), 1);
              const height = (day.count / maxVal) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-orange-400/60 hover:bg-orange-500 transition-colors relative group"
                  style={{ height: `${Math.max(height, 3)}%` }}
                  title={`${day.date}: ${day.count} referrals`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[#6b7280]">
            <span>{referral_analytics.trend_30_days[0]?.date?.slice(5) || ''}</span>
            <span>Today</span>
          </div>
        </Card>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 text-center">
        <p className="text-xs text-[#6b7280]">
          Dashboard auto-refreshes on page reload
        </p>
      </div>
    </div>
  );
}
