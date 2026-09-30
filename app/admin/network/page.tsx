'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  HandHeart,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { networkService } from '@/services/network.service';
import type { AdminAskRow, AdminReportRow, NetworkOverview } from '@/types/network.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

type Tab = 'overview' | 'asks' | 'reports';

/**
 * Admin moderation for the member network.
 *
 * WHAT THIS SCREEN DELIBERATELY CANNOT SEE
 * -----------------------------------------
 * No contact numbers, no circles, no member edges. Moderating a scam report
 * about a member-to-member ask is not a reason to learn who talks to whom, and
 * the API does not send those fields at all — so this screen cannot accidentally
 * render them even if somebody edits it.
 *
 * `fulfilled` is not an available status here either. Fulfilment is a real
 * outcome between two members and the only thing that writes the platform's
 * headline retention number, so a moderator must not be able to set it.
 *
 * Fulfilment rate is the number to watch during a cold start. If claims are not
 * converting, the problem is trust or positioning rather than software, and no
 * amount of moderation will fix it.
 */
export default function AdminNetworkPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [asks, setAsks] = useState<AdminAskRow[]>([]);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [o, a, r] = await Promise.all([
        networkService.adminGetOverview(),
        networkService.adminGetAsks(),
        networkService.adminGetReports(),
      ]);

      if (o.success && o.data) setOverview(o.data);
      if (a.success && a.data) setAsks(a.data.asks);
      if (r.success && r.data) setReports(r.data.reports);

      if (!o.success) setError(o.message ?? 'Could not load network moderation.');
    } catch (err) {
      console.error('Failed to load network moderation:', err);
      setError('Could not load network moderation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setAskStatus = async (id: number, status: 'cancelled' | 'expired') => {
    setBusy(true);
    try {
      const res = await networkService.adminSetAskStatus(id, status);
      if (!res.success) setError(res.message ?? 'Could not update that ask.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resolveReport = async (id: number, status: 'resolved' | 'dismissed') => {
    setBusy(true);
    try {
      const res = await networkService.adminResolveReport(id, status);
      if (!res.success) setError(res.message ?? 'Could not close that report.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const reindex = async () => {
    setBusy(true);
    try {
      const res = await networkService.adminReindex();
      if (res.success) await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error && !overview) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState icon={ShieldCheck} title="Not available" description={error} />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: ShieldCheck },
    { key: 'asks', label: 'Asks', icon: HandHeart, count: asks.length },
    {
      key: 'reports',
      label: 'Reports',
      icon: Flag,
      count: reports.filter((r) => r.status === 'pending' || r.status === 'reviewing').length,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShieldCheck className="h-6 w-6 text-[#C9A84C]" />
          Network moderation
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Member-to-member traffic. You see content and reports only — never
          contact numbers, circles or who helped whom.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-[#C9A84C] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/25' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Open asks"
              value={overview.asks.open}
              hint="Waiting for a response"
            />
            <Metric
              label="Fulfilment rate"
              value={overview.fulfilment_rate === null ? '—' : `${overview.fulfilment_rate}%`}
              hint="Of claims, how many completed"
              highlight
            />
            <Metric
              label="Pending reports"
              value={overview.reports.pending}
              hint="Needs a decision"
              alert={overview.reports.pending > 0}
            />
            <Metric
              label="Help recorded"
              value={overview.edges}
              hint="Confirmed help, both ways"
            />
          </div>

          <div className={`${CARD} p-5`}>
            <h2 className="text-base font-bold text-gray-900">Membership</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Members indexed" value={overview.members.indexed} />
              <Row label="Discoverable" value={overview.members.discoverable} />
              <Row
                label="Sharing WhatsApp"
                value={overview.members.sharing_whatsapp}
                hint="Opt-in only, and released per claim"
              />
              <Row label="Blocks in place" value={overview.members.blocks} />
            </dl>
          </div>

          {overview.fulfilment_rate !== null && overview.fulfilment_rate < 50 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Fulfilment rate is below half
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Members are claiming asks and then not following through. That
                  is usually a trust or positioning problem rather than a
                  technical one — check whether the board has enough early
                  activity before treating it as a bug.
                </p>
              </div>
            </div>
          )}

          <div className={`${CARD} p-5`}>
            <h2 className="text-base font-bold text-gray-900">Matching signals</h2>
            <p className="mt-1 text-sm text-gray-500">
              Derived data only — trade, city, join month and subscription
              tenure. Rebuilding never touches a member&apos;s consent settings.
            </p>
            <button
              type="button"
              onClick={reindex}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B8962E] disabled:opacity-50"
            >
              <RefreshCw size={14} />
              {busy ? 'Rebuilding…' : 'Rebuild signals'}
            </button>
          </div>
        </div>
      )}

      {/* ── Asks ── */}
      {tab === 'asks' && (
        <div className="space-y-3">
          {asks.length === 0 ? (
            <EmptyState
              icon={HandHeart}
              variant="card"
              title="No asks posted yet"
              description="Nothing to moderate."
            />
          ) : (
            asks.map((ask) => (
              <article key={ask.id} className={`${CARD} p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info" size="sm" className="capitalize">
                        {ask.status}
                      </Badge>
                      <span className="rounded-full bg-[#C9A84C]/10 px-2 py-0.5 text-[11px] font-bold text-[#8A6F1F]">
                        {ask.kind}
                      </span>
                      {ask.report_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                          <Flag size={10} />
                          {ask.report_count} report{ask.report_count === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-gray-900">{ask.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {ask.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {ask.asker?.name ?? 'Unknown'} · {ask.city ?? 'Anywhere'}
                      {ask.budget_note ? ` · ${ask.budget_note}` : ''}
                      {ask.claimer ? ` · responded by ${ask.claimer.name}` : ''}
                    </p>
                  </div>
                </div>

                {ask.status !== 'fulfilled' && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    <ModerationButton
                      onClick={() => setAskStatus(ask.id, 'cancelled')}
                      disabled={busy}
                      icon={XCircle}
                      label="Close ask"
                    />
                    <ModerationButton
                      onClick={() => setAskStatus(ask.id, 'expired')}
                      disabled={busy}
                      icon={AlertTriangle}
                      label="Mark expired"
                    />
                  </div>
                )}

                {ask.status === 'fulfilled' && (
                  <p className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-[#B8962E]" />
                    Fulfilled — recorded as real help, not editable here.
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <EmptyState
              icon={Flag}
              variant="card"
              title="No open reports"
              description="Nothing has been flagged for review."
            />
          ) : (
            reports.map((report) => (
              <article key={report.id} className={`${CARD} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-700">
                    {report.reason}
                  </span>
                  <Badge variant="warning" size="sm" className="capitalize">
                    {report.status}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    reported by {report.reporter?.name ?? 'a member'}
                  </span>
                </div>

                {report.details && (
                  <p className="mt-2.5 rounded-lg bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-700">
                    {report.details}
                  </p>
                )}

                <div className="mt-3 rounded-lg border border-gray-100 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Reported {report.target.type}
                  </p>
                  {!report.target.exists ? (
                    <p className="mt-1 text-sm text-gray-500">
                      The content has already been deleted. Close this report.
                    </p>
                  ) : report.target.type === 'ask' ? (
                    <>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {report.target.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {report.target.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Posted by {report.target.asker_name ?? 'Unknown'} ·{' '}
                        {report.target.status}
                      </p>
                    </>
                  ) : report.target.type === 'wish' ? (
                    <>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">
                        “{report.target.message}”
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        On celebration #{report.target.celebration_id}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      Unknown content type.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <ModerationButton
                    onClick={() => resolveReport(report.id, 'resolved')}
                    disabled={busy}
                    primary
                    icon={CheckCircle2}
                    label="Action taken"
                  />
                  <ModerationButton
                    onClick={() => resolveReport(report.id, 'dismissed')}
                    disabled={busy}
                    icon={XCircle}
                    label="No action"
                  />
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Metric = ({
  label,
  value,
  hint,
  highlight,
  alert,
}: {
  label: string;
  value: number | string;
  hint: string;
  highlight?: boolean;
  alert?: boolean;
}) => (
  <div
    className={`rounded-2xl border bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] ${
      alert ? 'border-red-200' : 'border-[#e5e7eb]'
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p
      className={`mt-1.5 text-2xl font-black ${
        alert ? 'text-red-600' : highlight ? 'text-[#B8962E]' : 'text-gray-900'
      }`}
    >
      {value}
    </p>
    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{hint}</p>
  </div>
);

const Row = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
    <div>
      <dt className="text-sm font-semibold text-gray-800">{label}</dt>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
    <dd className="text-lg font-bold text-gray-900">{value}</dd>
  </div>
);

const ModerationButton = ({
  onClick,
  disabled,
  primary,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
      primary
        ? 'bg-[#C9A84C] text-white hover:bg-[#B8962E]'
        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon size={13} />
    {label}
  </button>
);
