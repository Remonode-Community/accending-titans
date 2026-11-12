'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Gift,
  Copy,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { referralService } from '@/services/referral.service';
import { Toast } from '@/utils/toast.utils';
import type { UserReferralData, AdminReferralLink, AdminReferredUser } from '@/types/referral.types';

// ─── Helpers ───────────────────────────────────────────────

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getInitials = (name: string | null): string => {
  const parts = (name ?? '').trim().split(' ').filter(Boolean);
  const initials = parts.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  return initials;
};

// ─── Page ──────────────────────────────────────────────────

export default function AdminUserReferralDetailPage() {
  const params = useParams();
  const userId = Number(params.id);

  const [data, setData] = useState<UserReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (!Number.isInteger(userId) || userId < 1) {
        throw new Error('Invalid user ID.');
      }
      const result = await referralService.getUserReferralData(userId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user referral data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => void fetchData());
  }, [fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    void fetchData();
  };

  const handleCopy = async (text: string, key: string) => {
    const ok = await referralService.copyToClipboard(text);
    if (ok) {
      setCopiedCode(key);
      Toast.success('Copied!');
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // ─── Loading ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Loading referral data...</p>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/admin/referrals"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back to Referrals
        </Link>

        <Card className="rounded-3xl border border-red-200 bg-red-50 shadow-sm">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <h3 className="text-sm font-bold text-red-800">Failed to Load Data</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ─── Empty State ──────────────────────────────────────────

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/admin/referrals"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back to Referrals
        </Link>

        <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <CardBody>
            <div className="py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-4 text-lg font-bold text-gray-900">No Data Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No referral information available for this user.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ─── Main Content ────────────────────────────────────────

  const totalReferrals = data.referralLinks.reduce(
    (sum, link) => sum + (link.referrals?.length ?? 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back Link */}
      <Link
        href="/admin/referrals"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Back to Referrals
      </Link>

      <div className="space-y-6">
        {/* ─── User Header ─────────────────────────────── */}
        <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <CardBody>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A84C]/10 text-xl font-black text-[#C9A84C]">
                  {getInitials(data.name)}
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900">{data.name ?? data.email}</h1>
                  <p className="mt-0.5 text-sm text-gray-500">{data.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    User ID: #{data.id} &middot; {data.referralLinks.length} referral
                    link{data.referralLinks.length !== 1 ? 's' : ''} &middot;{' '}
                    {totalReferrals} total referral{totalReferrals !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </CardBody>
        </Card>

        {/* ─── Referral Links ────────────────────────────── */}
        {data.referralLinks.length > 0 ? (
          data.referralLinks.map((link: AdminReferralLink) => {
            const referrals = link.referrals ?? [];
            return (
              <Card
                key={link.code}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm"
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-[#C9A84C]" />
                        <p className="text-sm font-bold text-gray-900">
                          {link.program || 'Referral Program'}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <code className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-gray-700">
                          {link.code}
                        </code>
                        <button
                          onClick={() => handleCopy(link.code, `code-${link.code}`)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          <Copy size={12} />
                        </button>
                        {link.link && (
                          <button
                            onClick={() => handleCopy(link.link, `link-${link.code}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A84C] hover:text-[#B8962E]"
                          >
                            <ExternalLink size={12} />
                            {copiedCode === `link-${link.code}` ? 'Copied!' : 'Copy link'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">
                          {referrals.length}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Referrals
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  {referrals.length > 0 ? (
                    <div className="space-y-2">
                      {referrals.map((referredUser: AdminReferredUser) => (
                        <div
                          key={referredUser.id}
                          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 transition hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-xs font-bold text-[#C9A84C]">
                              {getInitials(referredUser.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {referredUser.name ?? referredUser.email}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {referredUser.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
                              <Calendar size={12} />
                              {formatDate(referredUser.created_at)}
                            </span>
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center">
                      <UserIcon className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        No referrals made with this link yet.
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <CardBody>
              <div className="py-14 text-center">
                <Gift className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-4 text-lg font-bold text-gray-900">No Referral Links</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This user has not created any referral links yet.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ─── Auth Referral Link ────────────────────────── */}
        {data.authReferralLink && (
          <Card className="rounded-3xl border border-[#C9A84C]/20 bg-gradient-to-r from-[#C9A84C]/5 to-transparent shadow-sm">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/15 text-[#C9A84C]">
                  <ExternalLink size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    Personal Referral Link
                  </p>
                  <p className="mt-1 break-all text-xs text-gray-500">
                    {data.authReferralLink}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(data.authReferralLink!, 'auth-link')}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  <Copy size={12} />
                  {copiedCode === 'auth-link' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
