'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Gift,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { referralService } from '@/services/referral.service';
import { Toast } from '@/utils/toast.utils';
import type { AdminReferralItem, ReferralProgram } from '@/types/referral.types';

const getInitials = (name: string | null): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const initials = parts.map((part) => part.charAt(0)).join('').toUpperCase().slice(0, 2);
  return initials || '?';
};

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Icon size={20} /></span>
      </CardBody>
    </Card>
  );
}

export default function AdminReferralDashboardPage() {
  const [referrals, setReferrals] = useState<AdminReferralItem[]>([]);
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [referralItems, availablePrograms] = await Promise.all([
        referralService.getAllReferrals(),
        referralService.getPrograms(),
      ]);
      setReferrals(referralItems);
      setPrograms(availablePrograms);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    void loadData();
  };

  const filteredReferrals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return referrals;
    return referrals.filter((item) =>
      [item.user.name, item.user.email, item.code, item.program]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [referrals, searchQuery]);

  const totalReferrals = referrals.reduce((total, item) => total + (item.referrals_count || 0), 0);
  const uniqueReferrers = new Set(referrals.map((item) => item.user.id)).size;
  const averagePerLink = referrals.length ? (totalReferrals / referrals.length).toFixed(1) : '0';

  const toggleRow = (code: string) => {
    setExpandedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleCopy = async (text: string, key: string) => {
    const copied = await referralService.copyToClipboard(text);
    if (!copied) {
      Toast.error('Could not copy to clipboard.');
      return;
    }
    setCopiedCode(key);
    Toast.success('Copied!');
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
        
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Referral overview</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review referral links, their programs, and users referred. Payout and milestone data is not available in the current referral API.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleRefresh} isLoading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardBody className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
              <div>
                <p className="font-semibold text-red-900">Could not load referral data</p>
                <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
                  Try again
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Referral summary">
          <StatCard title="Referrers" value={uniqueReferrers} helper="Users with a referral link" icon={Users} />
          <StatCard title="Referral links" value={referrals.length} helper="Links across all programs" icon={ExternalLink} />
          <StatCard title="Referred users" value={totalReferrals} helper="Recorded referral relationships" icon={CheckCircle} />
          <StatCard title="Average per link" value={averagePerLink} helper="Recorded relationships per link" icon={BarChart3} />
        </section>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Referral links</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {uniqueReferrers} referrers · {referrals.length} links · {totalReferrals} referred users
                </p>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, email, code, program"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-14"><Spinner /></div>
            ) : error ? null : filteredReferrals.length === 0 ? (
              <div className="py-12 text-center">
                <Gift className="mx-auto text-slate-300" size={36} />
                <p className="mt-3 font-semibold">{searchQuery ? 'No matching referral links' : 'No referral data yet'}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery ? 'Try another search.' : 'Referral links will appear as users create them.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReferrals.map((item) => {
                  const expanded = expandedCodes.has(item.code);
                  return (
                    <article key={item.code} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-800">
                          {getInitials(item.user.name)}
                        </div>
                        <div className="min-w-[140px] flex-1">
                          <p className="truncate text-sm font-semibold">{item.user.name ?? item.user.email}</p>
                          <p className="truncate text-xs text-slate-500">{item.user.email}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.program || 'Referral program'}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <code className="text-xs font-semibold">{item.code}</code>
                          <button
                            type="button"
                            onClick={() => void handleCopy(item.link || item.code, item.code)}
                            aria-label={`Copy referral link for ${item.user.name}`}
                            className="text-slate-500 hover:text-slate-900"
                          >
                            {copiedCode === item.code ? <CheckCircle size={15} /> : <Copy size={15} />}
                          </button>
                        </div>
                        <div className="min-w-20 text-center">
                          <p className="text-lg font-bold">{item.referrals_count ?? 0}</p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">referred</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/referrals/${item.user.id}`}
                            aria-label={`View referral details for ${item.user.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          {!!item.referrals?.length && (
                            <button
                              type="button"
                              onClick={() => toggleRow(item.code)}
                              aria-expanded={expanded}
                              aria-label={`${expanded ? 'Hide' : 'Show'} referred users for ${item.user.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                      {expanded && item.referrals?.length > 0 && (
                        <div className="space-y-2 border-t border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referred users</p>
                          {item.referrals.map((referral) => (
                            <div key={`${item.code}-${referral.user.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3">
                              <div>
                                <p className="text-sm font-medium">{referral.user.name ?? referral.user.email}</p>
                                <p className="text-xs text-slate-500">{referral.user.email}</p>
                              </div>
                              <time className="text-xs text-slate-500" dateTime={referral.referred_at}>
                                {new Date(referral.referred_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </time>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {!loading && programs.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Referral programs</h2>
              <p className="mt-1 text-sm text-slate-500">Programs currently configured on the platform.</p>
            </CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div key={program.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <Gift size={17} className="text-amber-700" />
                    <h3 className="font-semibold">{program.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Valid for {Math.round(program.lifetime_minutes / 1440)} days
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-500">{program.url}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
