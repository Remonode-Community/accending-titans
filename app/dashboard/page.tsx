'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Layers,
  ReceiptText,
  Send,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/shared/Badge';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoader';
import { AdCarousel } from '@/components/dashboard/AdCarousel';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { customerService, DedicatedAccount } from '@/services/customer.service';
import { portfolioService } from '@/services/portfolio.service';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { TRANSACTION_STATUSES } from '@/utils/constants';

type WalletData = {
  balance: number;
  currency?: string;
  total_spent?: number;
};

type TransactionData = {
  id: string | number;
  type?: string;
  transaction_type?: string;
  provider?: string;
  amount: number | string;
  status: string;
  created_at?: string;
  transaction_date?: string;
  reference?: string;
  metadata?: Record<string, any>;
  service_logo?: string | null;
};

/** Summary of the member's own catalogue, used for the rail + shortcuts. */
type CatalogueSummary = {
  id: number;
  items_count: number;
  views_count: number;
  is_featured: boolean;
} | null;

/** One card surface, so every panel on the page matches. */
const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

const quickActions = [
  {
    href: '/dashboard/catalogue',
    label: 'My Business Catalogue',
    description: 'Showcase your products and services',
    icon: FileText,
  },
  {
    href: '/dashboard/messages',
    label: 'Direct Messages',
    description: 'Connect with community members',
    icon: Send,
  },
  {
    href: '/dashboard/referral',
    label: 'Referral Program',
    description: 'Earn rewards by sharing',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/opportunities',
    label: 'Opportunities',
    description: 'Find jobs and partnerships',
    icon: Award,
  },
];

const getTransactionStatusIcon = (status: string) => {
  const s = status?.toLowerCase?.() || '';
  if (s === 'success') return <CheckCircle size={15} className="h-4 w-4 text-emerald-600" />;
  if (s === 'pending') return <Clock size={15} className="h-4 w-4 text-amber-500" />;
  if (s === 'failed') return <AlertCircle className="h-4 w-4 text-red-500" />;
  return <CreditCard className="h-4 w-4 text-[#C9A84C]" />;
};

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [dedicatedAccount, setDedicatedAccount] = useState<DedicatedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  // The member's own catalogue, so the rail and shortcuts reflect real state.
  const [catalogue, setCatalogue] = useState<CatalogueSummary>(null);

  // Rendered only after mount — a Date on the server can differ from the
  // client and trip React's hydration check.
  const [today, setToday] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    portfolioService
      .getMy()
      .then((res) => {
        if (cancelled || !res.success || !res.data?.portfolio) return;
        const p = res.data.portfolio;
        setCatalogue({
          id: p.id,
          items_count: p.items_count ?? p.items?.length ?? 0,
          views_count: p.views_count ?? 0,
          is_featured: !!p.is_featured,
        });
      })
      .catch(() => {
        // Members without a catalogue simply don't get the shortcut.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    );
  }, []);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!user?.email) return;
      try {
        setAccountLoading(true);
        const response = await customerService.getCurrentUserAccount(user.email);
        if (response.data?.customer?.dedicatedAccount) {
          setDedicatedAccount(response.data.customer.dedicatedAccount);
        }
      } catch {
        // No dedicated account provisioned — the card simply stays hidden.
      } finally {
        setAccountLoading(false);
      }
    };
    fetchAccountInfo();
  }, [user?.email]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [walletRes, transactionsRes] = await Promise.all([
          walletService.getBalance(),
          user?.id
            ? transactionService.getTransactions({ page: currentPage, per_page: 10 })
            : Promise.resolve(null),
        ]);
        if (walletRes?.data) setWallet(walletRes.data as WalletData);
        if (transactionsRes?.data?.transactions) {
          setTransactions(transactionsRes.data.transactions);
          if (transactionsRes.data.pagination) {
            setPagination({
              currentPage: transactionsRes.data.pagination.current_page || currentPage,
              lastPage: transactionsRes.data.pagination.last_page || 1,
              total: transactionsRes.data.pagination.total || 0,
              perPage: transactionsRes.data.pagination.per_page || 10,
            });
          }
        }
      } catch {
        setError('Failed to load dashboard data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, currentPage]);

  // Counted from the current page only, so the label says so rather than
  // implying an all-time figure.
  const successfulOnPage = useMemo(
    () => transactions.filter((t) => t.status?.toLowerCase() === 'success').length,
    [transactions],
  );

  const getTransactionTimestamp = (t: TransactionData) =>
    t.created_at || t.transaction_date || 'Unknown';

  const getTransactionTypeLabel = (t: TransactionData) =>
    t.transaction_type || t.type || 'Transaction';

  const getStatusBadgeVariant = (status: string) =>
    TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES]?.color ?? 'secondary';

  const getStatusLabel = (status: string) =>
    TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES]?.label ?? status;

  const getServiceName = (t: TransactionData): string => {
    const type = t.transaction_type || t.type;
    return (
      (t.metadata as any)?.product_name ||
      (t.metadata as any)?.service_type ||
      (() => {
        if (type === 'Wallet Funding' || type === 'wallet_topup') return 'Wallet Funding';
        if (type === 'Airtime Conversion' || type === 'airtime_conversion')
          return 'Airtime Conversion';
        return t.provider || '—';
      })()
    );
  };

  if (loading) return <DashboardSkeleton />;

  const balance = wallet ? formatCurrency(wallet.balance, wallet.currency) : '₦0.00';

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-[26px]">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {today ? `${today} · ` : ''}Track your wallet, catalogue and community activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {catalogue && (
            <Link
              href={`/catalogue/${catalogue.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open my public catalogue page"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
            >
              My public page
              <ArrowUpRight size={14} />
            </Link>
          )}
          {/* Opportunities lives in Quick actions below — not repeated here. */}
          <Link
            href="/dashboard/catalogue"
            className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E]"
          >
            My Catalogue
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Wallet: the primary number, so it gets the focal card ── */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C]/20 via-[#C9A84C] to-[#C9A84C]/20" />

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/[0.08] p-5 sm:p-6">
            {/* Stacks until lg: below that the main column is too narrow for
                the figure and the buttons to share a row without colliding. */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8962E]">
                  Available balance
                </p>
                <p className="mt-2.5 break-words text-[2rem] font-black leading-tight tracking-tight text-gray-900 sm:text-[2.5rem] xl:text-[2.75rem]">
                  {balance}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Wallet size={13} className="text-[#C9A84C]" />
                  Acceding Titans wallet
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
                <Link
                  href="/dashboard/wallet"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E]"
                >
                  View wallet
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/dashboard/referral"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#C9A84C]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#B8962E] transition hover:border-[#C9A84C] hover:bg-[#FDFAF3]"
                >
                  Top up via referral
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: main column + rail ── */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0 space-y-6">
          {/* Quick actions */}
          <section className={CARD}>
            <div className="border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
              <h2 className="text-base font-black tracking-tight text-gray-900">
                Quick actions
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Your most-used shortcuts, one tap away.
              </p>
            </div>

            {/* Two across at every width: once the rail appears the main column
                is only ~640px, so four tiles would crush the labels. */}
            <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2 sm:gap-1.5 sm:p-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-start gap-3.5 rounded-xl p-3 transition hover:bg-[#FDFAF3] sm:p-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] text-[#C9A84C] transition group-hover:border-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-snug text-gray-900">
                        {action.label}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-400">
                        {action.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Transactions */}
          <section className={CARD}>
            <div className="flex flex-col justify-between gap-3 border-b border-[#e5e7eb] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="text-base font-black tracking-tight text-gray-900">
                  Recent transactions
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Your latest Acceding Titans activities and payment records.
                </p>
              </div>
              <Link
                href="/dashboard/wallet"
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] px-4 py-2 text-xs font-semibold text-[#B8962E] transition hover:bg-[#C9A84C]/10"
              >
                View all
                <ArrowRight size={13} />
              </Link>
            </div>

            {error ? (
              <div className="p-10 text-center">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                <p className="font-semibold text-gray-700">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-gray-50">
                  <ReceiptText className="h-5 w-5 text-gray-300" />
                </div>
                <h3 className="font-black text-gray-900">No transactions yet</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-400">
                  Your transaction history will appear here once you start using Acceding
                  Titans.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table. min-w forces overflow-x-auto to engage rather
                    than letting auto table-layout squeeze a column to 0px. */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-gray-50/70">
                        {['Date', 'Type', 'Service', 'Reference', 'Amount', 'Status'].map((h) => (
                          <th
                            key={h}
                            className={`px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                              h === 'Amount'
                                ? 'text-right'
                                : h === 'Status'
                                  ? 'text-center'
                                  : 'text-left'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((transaction) => {
                        const timestamp = getTransactionTimestamp(transaction);
                        return (
                          <tr
                            key={transaction.id}
                            className="transition-colors hover:bg-[#FDFAF3]/60"
                          >
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDate(
                                timestamp !== 'Unknown'
                                  ? timestamp
                                  : new Date().toISOString(),
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                                {getTransactionTypeLabel(transaction)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm capitalize text-gray-700">
                              {getServiceName(transaction)}
                            </td>
                            <td className="max-w-[150px] truncate px-6 py-4 font-mono text-xs text-gray-400">
                              {transaction.reference || `TXN-${transaction.id}`}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                              {formatCurrency(Number(transaction.amount))}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge
                                variant={getStatusBadgeVariant(transaction.status) as any}
                              >
                                {getStatusLabel(transaction.status)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-4 lg:hidden">
                  {transactions.map((transaction) => {
                    const timestamp = getTransactionTimestamp(transaction);
                    return (
                      <div
                        key={transaction.id}
                        className="rounded-xl border border-[#e5e7eb] bg-gray-50/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white">
                              {getTransactionStatusIcon(transaction.status)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black capitalize text-gray-900">
                                {getTransactionTypeLabel(transaction)}
                              </p>
                              <p className="truncate text-xs text-gray-400">
                                {getServiceName(transaction)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(transaction.status) as any}
                          >
                            {getStatusLabel(transaction.status)}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e5e7eb] pt-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Date
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-gray-700">
                              {formatDate(
                                timestamp !== 'Unknown'
                                  ? timestamp
                                  : new Date().toISOString(),
                              )}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Amount
                            </p>
                            <p className="mt-0.5 text-sm font-black text-gray-900">
                              {formatCurrency(Number(transaction.amount))}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 truncate font-mono text-[10px] text-gray-300">
                          {transaction.reference || `TXN-${transaction.id}`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                  <div className="border-t border-[#e5e7eb] px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-400">
                        Showing{' '}
                        <span className="font-semibold text-gray-700">
                          {(pagination.currentPage - 1) * pagination.perPage + 1}
                        </span>
                        –
                        <span className="font-semibold text-gray-700">
                          {Math.min(
                            pagination.currentPage * pagination.perPage,
                            pagination.total,
                          )}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-gray-700">
                          {pagination.total}
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={pagination.currentPage <= 1}
                          onClick={() => setCurrentPage(1)}
                          className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] disabled:opacity-40"
                        >
                          First
                        </button>

                        <button
                          type="button"
                          disabled={pagination.currentPage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          aria-label="Previous page"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] disabled:opacity-40"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        {Array.from({ length: Math.min(pagination.lastPage, 5) }, (_, i) => {
                          let p: number;
                          if (pagination.lastPage <= 5) p = i + 1;
                          else if (pagination.currentPage <= 3) p = i + 1;
                          else if (pagination.currentPage >= pagination.lastPage - 2)
                            p = pagination.lastPage - 4 + i;
                          else p = pagination.currentPage - 2 + i;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              aria-current={p === pagination.currentPage ? 'page' : undefined}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                p === pagination.currentPage
                                  ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/20'
                                  : 'border border-[#e5e7eb] bg-white text-gray-600 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          disabled={pagination.currentPage >= pagination.lastPage}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, pagination.lastPage))
                          }
                          aria-label="Next page"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] disabled:opacity-40"
                        >
                          <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          disabled={pagination.currentPage >= pagination.lastPage}
                          onClick={() => setCurrentPage(pagination.lastPage)}
                          className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] disabled:opacity-40"
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* ── Rail ── */}
        <aside className="space-y-6">
          <section className={CARD}>
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <h2 className="text-base font-black tracking-tight text-gray-900">
                At a glance
              </h2>
            </div>

            <dl className="divide-y divide-[#e5e7eb]">
              <StatRow
                icon={ReceiptText}
                label="Total transactions"
                value={pagination.total || transactions.length}
                sub="All time"
              />
              <StatRow
                icon={Check}
                label="Successful payments"
                value={successfulOnPage}
                sub="On this page"
              />
              <StatRow
                icon={Layers}
                label="Catalogue listings"
                value={catalogue?.items_count ?? 0}
                sub={catalogue ? 'Live on your page' : 'Not set up yet'}
                toHref={catalogue ? '/dashboard/catalogue' : undefined}
              />
              <StatRow
                icon={Eye}
                label="Public page views"
                value={catalogue?.views_count ?? 0}
                sub={catalogue ? 'All time' : '—'}
                toHref={catalogue ? `/catalogue/${catalogue.id}` : undefined}
              />
            </dl>
          </section>

          {/* Dedicated virtual account */}
          {dedicatedAccount && (
            <section className={CARD}>
              <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDFAF3] text-[#C9A84C]">
                  <Building2 size={15} />
                </span>
                <h2 className="text-base font-black tracking-tight text-gray-900">
                  Bank account
                </h2>
              </div>

              <div className="space-y-3.5 p-5">
                <CopyRow
                  label="Account number"
                  value={dedicatedAccount.account_number}
                  mono
                />
                {dedicatedAccount.account_name && (
                  <CopyRow label="Account name" value={dedicatedAccount.account_name} />
                )}
                {dedicatedAccount.bank_name && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Bank
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {dedicatedAccount.bank_name}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {accountLoading && !dedicatedAccount && (
            <div className={`${CARD} h-32 animate-pulse`} aria-hidden />
          )}

          <section className={CARD}>
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <h2 className="text-base font-black tracking-tight text-gray-900">
                Membership
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-black capitalize text-gray-900">
                {user?.current_rank || (user?.is_titan_member ? 'Titan Member' : 'Member')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {user?.membership_id ? `ID ${user.membership_id}` : 'Acceding Titans member'}
              </p>
              <Link
                href="/dashboard/rankings"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#C9A84C] transition hover:text-[#B8962E]"
              >
                View leaderboard
                <ArrowRight size={12} />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* ── Sponsorships sit last so they never interrupt the primary flow ── */}
      <section aria-label="Sponsored">
        <AdCarousel platform="web" limit={10} autoPlay autoPlayInterval={6000} />
      </section>
    </div>
  );
}

/* ── building blocks ── */

function StatRow({
  icon: Icon,
  label,
  value,
  sub,
  toHref,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: number;
  sub: string;
  toHref?: string;
}) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-gray-500">{label}</span>
        <span className="mt-0.5 block text-lg font-black leading-none text-gray-900">
          {value}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {sub}
        </span>
      </span>
    </>
  );

  if (toHref) {
    return (
      <Link
        href={toHref}
        className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#FDFAF3]"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="sr-only">{label}</span>
      {body}
    </div>
  );
}

/** A label/value pair with a copy-to-clipboard button. */
function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p
          className={`min-w-0 truncate text-sm font-bold text-gray-900 ${
            mono ? 'font-mono tracking-tight' : ''
          }`}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="shrink-0 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
        >
          {copied ? (
            <span className="inline-flex items-center gap-1 text-[#C9A84C]">
              <Check size={12} />
              Copied
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Copy size={12} />
              Copy
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
