'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Copy,
  Share2,
  Users,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Gift,
  MessageCircle,
  Twitter,
  Facebook,
  Loader2,
  ChevronRight,
  Award,
  Sparkles,
  UserPlus,
  BellRing,
  Zap,
  CalendarDays,
  ChevronLeft,
} from 'lucide-react';
import { referralService } from '@/services/referral.service';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/utils/toast.utils';
import type {
  ReferralLink,
  ReferralStats,
  ReferredUserDetail,
  ReferredUsersPagination,
} from '@/types/referral.types';

// ─── Helpers ───────────────────────────────────────────────

const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getReferralLink = (code: string): string => {
  return `https://ascending-titans.vercel.app/auth/register?ref=${code}`;
};

const shareUrls = {
  whatsapp: (link: string, code: string) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Join me on Acceding Titans! 🎉 Use my referral code: ${code} - ${link}`
    )}`,
  twitter: (link: string, code: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Join me on Acceding Titans and earn rewards! Use my code: ${code}`
    )}&url=${encodeURIComponent(link)}`,
  facebook: (link: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
};

// ─── Stat Card ─────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: 'gold' | 'green' | 'blue' | 'purple';
  subtitle?: string;
}

const accentMap: Record<string, string> = {
  gold: 'bg-[#C9A84C]/10 text-[#C9A84C]',
  green: 'bg-emerald-500/10 text-emerald-600',
  blue: 'bg-blue-500/10 text-blue-600',
  purple: 'bg-purple-500/10 text-purple-600',
};

function StatCard({ label, value, icon: Icon, accent = 'gold', subtitle }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gray-50/50 transition-all duration-300 group-hover:scale-150" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ReferralPage() {
  const { user } = useAuth();

  // Data states
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  // Loading states
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Error states
  const [errorLinks, setErrorLinks] = useState<string | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // UI states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // ─── Data Fetching ─────────────────────────────────────

  const fetchLinks = useCallback(async () => {
    try {
      setLoadingLinks(true);
      setErrorLinks(null);

      // Step 1: Try to fetch existing referral links
      let data = await referralService.getMyReferralLinks();

      // Step 2: If no links exist, attempt to create one (for users registered pre-v2.0)
      if (!data || data.length === 0) {
        if (user?.id) {
          setIsCreatingLink(true);
          try {
            // Use the create endpoint which either creates or returns existing link
            const newLink = await referralService.createReferralLink(1, user.id);
            if (newLink) {
              data = [{
                code: newLink.code,
                link: newLink.link,
                program: 'Sign-up Bonus',
                created_at: newLink.created_at,
              }];
            }
          } catch (createErr: any) {
            console.warn('[ReferralPage] Could not auto-create referral link:', createErr);
            // Non-critical – user can retry or contact support
          } finally {
            setIsCreatingLink(false);
          }
        }
      }

      setLinks(data || []);
    } catch (err: any) {
      setErrorLinks(err.message || 'Failed to load referral link');
    } finally {
      setLoadingLinks(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setErrorStats(null);
      const data = await referralService.getStats();
      setStats(data);
    } catch (err: any) {
      setErrorStats(err.message || 'Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ─── Referred Users ───────────────────────────────────

  const [referredUsers, setReferredUsers] = useState<ReferredUserDetail[]>([]);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);
  const [referredUsersPagination, setReferredUsersPagination] = useState<ReferredUsersPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchReferredUsers = useCallback(async (page: number = 1) => {
    try {
      setLoadingReferredUsers(true);
      const result = await referralService.getReferredUsers(15);
      setReferredUsers(result.referred_users);
      setReferredUsersPagination(result.pagination);
    } catch (err: any) {
      // Silently handle – this is supplementary data
      console.warn('[ReferralPage] Failed to fetch referred users:', err);
    } finally {
      setLoadingReferredUsers(false);
    }
  }, []);

  // Fetch data once user is available
  const hasInitiated = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    if (hasInitiated.current) return;
    hasInitiated.current = true;

    fetchLinks();
    fetchStats();
    fetchReferredUsers();
  }, [user?.id, fetchLinks, fetchStats, fetchReferredUsers]);

  // ─── Actions ────────────────────────────────────────────

  const handleCopy = async (text: string, key: string) => {
    const ok = await referralService.copyToClipboard(text);
    if (ok) {
      setCopiedCode(key);
      Toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      Toast.error('Failed to copy. Please try again.');
    }
  };

  const handleNativeShare = async (link: string, code: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Acceding Titans',
          text: `Join me on Acceding Titans and earn rewards! Use my referral code: ${code}`,
          url: link,
        });
        Toast.success('Shared successfully!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          await handleCopy(link, `share-${code}`);
        }
        return;
      }
    }
    await handleCopy(link, `share-${code}`);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      Toast.error('Minimum withdrawal is ₦100');
      return;
    }
    if (stats && amount > stats.available_balance) {
      Toast.error('Amount exceeds your available balance');
      return;
    }
    try {
      setIsWithdrawing(true);
      await referralService.requestWithdrawal(amount);
      Toast.success('Withdrawal request submitted successfully!');
      setWithdrawAmount('');
      setShowWithdraw(false);
      await fetchStats();
    } catch (err: any) {
      Toast.error(err.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };


  const primaryLink = links[0] ?? null;
  const referralUrl = primaryLink ? getReferralLink(primaryLink.code) : '';
  const totalReferrals = stats?.total_referrals ?? 0;
  const activeReferrals = stats?.active_referrals ?? 0;
  const totalEarnings = stats?.total_earnings ?? 0;
  const availableBalance = stats?.available_balance ?? 0;

  
  return (
    <div className="space-y-6">

     <section className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/15 bg-gradient-to-br from-[#C9A84C]/5 via-white to-[#C9A84C]/5 px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C9A84C]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative z-10">
      

          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Invite friends, earn rewards together
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
            Share your unique referral link and earn ₦500 for every friend who signs up!
          </p>

          {/* Referral Link Box */}
          {loadingLinks ? (
            <div className="mt-6 flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]/40" />
            </div>
          ) : errorLinks ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{errorLinks}</p>
            </div>
          ) : primaryLink ? (
            <div className="mt-6 space-y-4">
              {/* Link Display */}
              <div className="rounded-2xl border border-[#C9A84C]/15 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  YOUR REFERRAL LINK
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                    {referralUrl}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleCopy(referralUrl, 'link')}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#C9A84C] px-4 text-sm font-bold text-white shadow-lg shadow-[#C9A84C]/25 transition-all hover:bg-[#B8962E]"
                    >
                      <Copy size={14} />
                      {copiedCode === 'link' ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleNativeShare(referralUrl, primaryLink.code)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      <Share2 size={14} />
                      Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Code + Share Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-[#C9A84C]/15 bg-white px-4 py-2.5 shadow-sm">
                  <p className="text-xs text-gray-500">Your Code</p>
                  <p className="text-lg font-black tracking-wider text-[#C9A84C]">
                    {primaryLink.code}
                  </p>
                </div>
                <span className="text-xs text-gray-400">Share via</span>
                <a
                  href={shareUrls.whatsapp(referralUrl, primaryLink.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition hover:bg-emerald-500/20"
                  title="Share on WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
                <a
                  href={shareUrls.twitter(referralUrl, primaryLink.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition hover:bg-sky-500/20"
                  title="Share on Twitter/X"
                >
                  <Twitter size={16} />
                </a>
                <a
                  href={shareUrls.facebook(referralUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition hover:bg-blue-500/20"
                  title="Share on Facebook"
                >
                  <Facebook size={16} />
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white p-5 text-center shadow-sm">
              <Gift className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No referral link yet. Create one to get started.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Stats Grid ──────────────────────────────────── */}
      {loadingStats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="mb-3 h-3 w-20 rounded bg-gray-100" />
              <div className="h-8 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : errorStats ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{errorStats}</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Referrals"
            value={totalReferrals}
            icon={Users}
            accent="gold"
            subtitle="People who joined"
          />
          <StatCard
            label="Active Referrals"
            value={activeReferrals}
            icon={CheckCircle2}
            accent="green"
            subtitle="Currently active"
          />
          <StatCard
            label="Total Earnings"
            value={formatCurrency(totalEarnings)}
            icon={TrendingUp}
            accent="blue"
            subtitle="₦500 per referral"
          />
          <StatCard
            label="Available Balance"
            value={formatCurrency(availableBalance)}
            icon={Wallet}
            accent="purple"
            subtitle="Ready for withdrawal"
          />
        </div>
      ) : null}

      {/* ─── Withdraw CTA ────────────────────────────────── */}
      {stats && availableBalance > 0 && !showWithdraw && (
        <button
          onClick={() => setShowWithdraw(true)}
          className="group w-full rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-r from-[#C9A84C]/5 to-[#D4B85C]/5 p-4 text-left transition-all hover:from-[#C9A84C]/10 hover:to-[#D4B85C]/10"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A84C]/15 text-[#C9A84C]">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Withdraw your earnings
                </p>
                <p className="text-xs text-gray-500">
                  You have {formatCurrency(availableBalance)} available
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="shrink-0 text-gray-400 transition-all group-hover:translate-x-0.5"
            />
          </div>
        </button>
      )}

      {/* ─── Withdrawal Form ──────────────────────────────── */}
      {showWithdraw && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900">Withdraw Earnings</h3>
              <p className="text-sm text-gray-500">
                Available: <span className="font-bold text-[#C9A84C]">{formatCurrency(availableBalance)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowWithdraw(false)}
              className="text-sm font-semibold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  ₦
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="100"
                  max={availableBalance}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 text-lg font-bold text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-400">Min: ₦100</span>
                <button
                  onClick={() => setWithdrawAmount(String(availableBalance))}
                  className="font-semibold text-[#C9A84C] hover:text-[#B8962E]"
                >
                  Max: {formatCurrency(availableBalance)}
                </button>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 100}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] font-bold text-white shadow-lg shadow-[#C9A84C]/20 transition-all hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Withdrawal'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── How It Works ──────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black tracking-tight text-gray-900">
          How It Works
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Three simple steps to earn rewards
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: '01',
              icon: Share2,
              title: 'Share Your Link',
              desc: 'Share your unique referral link with friends and family',
            },
            {
              step: '02',
              icon: UserPlus,
              title: 'Friend Signs Up',
              desc: 'They register using your referral link or code',
            },
            {
              step: '03',
              icon: Award,
              title: 'Earn ₦500',
              desc: 'You earn ₦500 for every friend who signs up through your link',
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div
              key={step}
              className="group rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-center transition hover:border-[#C9A84C]/20 hover:bg-[#C9A84C]/5"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#C9A84C] transition group-hover:bg-[#C9A84C]/20">
                <Icon size={22} />
              </div>
              <div className="mt-1 text-xs font-black text-gray-300">{step}</div>
              <h3 className="mt-1 text-sm font-bold text-gray-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tips ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-gradient-to-r from-[#C9A84C]/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/15 text-[#C9A84C]">
            <Zap size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Pro Tip</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Share your referral link on social media, WhatsApp groups, and with friends
              who would benefit from Acceding Titans. The more you share, the more you earn!
              You get <span className="font-bold text-[#C9A84C]">₦500</span> for every
              friend who signs up.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Referral History ────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-gray-900">
            Referral History
          </h2>
          {referredUsersPagination.total > 0 && (
            <span className="text-xs font-semibold text-gray-400">
              {referredUsersPagination.total} total
            </span>
          )}
        </div>
        <p className="mb-5 text-sm text-gray-500">
          People who signed up using your referral link
        </p>

        {loadingReferredUsers ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-100 p-3"
              >
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-gray-100" />
                  <div className="h-2.5 w-48 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No referrals yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Share your referral link to start earning rewards
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3 transition hover:bg-gray-50"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-black text-[#C9A84C]">
                  {ref.first_name.charAt(0).toUpperCase()}
                  {ref.last_name?.charAt(0).toUpperCase()}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {ref.first_name} {ref.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{ref.email}</p>
                </div>

                {/* Date */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays size={12} />
                    <span>
                      {new Date(ref.referred_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {referredUsersPagination.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  onClick={() => fetchReferredUsers(referredUsersPagination.current_page - 1)}
                  disabled={referredUsersPagination.current_page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="text-xs font-medium text-gray-400">
                  Page {referredUsersPagination.current_page} of{' '}
                  {referredUsersPagination.last_page}
                </span>

                <button
                  onClick={() => fetchReferredUsers(referredUsersPagination.current_page + 1)}
                  disabled={referredUsersPagination.current_page >= referredUsersPagination.last_page}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
