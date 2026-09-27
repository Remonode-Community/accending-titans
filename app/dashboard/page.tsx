'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
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
  if (s === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (s === 'pending') return <Clock className="h-4 w-4 text-amber-500" />;
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

  // Public catalogue id, so the hero can link straight to the member's page.
  const [catalogueId, setCatalogueId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    portfolioService
      .getMy()
      .then((res) => {
        if (!cancelled && res.success && res.data?.portfolio) {
          setCatalogueId(res.data.portfolio.id);
        }
      })
      .catch(() => {
        // Members without a catalogue simply don't get the shortcut.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!user?.email) return;
      try {
        setAccountLoading(true);
        const response = await customerService.getCurrentUserAccount(user.email);
        if (response.data?.customer?.dedicatedAccount) {
          setDedicatedAccount(response.data.customer.dedicatedAccount);
        }
      } catch (err) {
        console.error('Error fetching dedicated account info:', err);
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
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, currentPage]);

  const monthlyTransactionsCount = useMemo(() => {
    const m = new Date().getMonth();
    const y = new Date().getFullYear();
    return transactions.filter((t) => {
      const d = new Date(t.created_at || t.transaction_date || '');
      return d.getMonth() === m && d.getFullYear() === y;
    }).length;
  }, [transactions]);

  const successfulTransactionsCount = useMemo(() =>
    transactions.filter((t) => t.status?.toLowerCase() === 'success').length,
    [transactions]
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
        if (type === 'Airtime Conversion' || type === 'airtime_conversion') return 'Airtime Conversion';
        return t.provider || '—';
      })()
    );
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Hero: Balance + Account ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-[#C9A84C]/30 via-[#C9A84C] to-[#C9A84C]/30" />
        <div className="p-5 sm:p-6 lg:grid lg:grid-cols-[1fr_auto] lg:gap-8 lg:items-start">
          {/* Welcome copy — desktop only */}
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">
              Welcome to your community hub
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
              Hi {user?.first_name || 'there'}, let's grow together.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-gray-500 leading-relaxed">
              Connect with entrepreneurs, showcase your business, find opportunities,
              and build meaningful professional relationships on Acceding Titans.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/catalogue"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
              >
                My Catalogue <ArrowRight size={14} />
              </Link>
              <Link
                href="/dashboard/opportunities"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Browse Opportunities
              </Link>
              {catalogueId && (
                <Link
                  href={`/catalogue/${catalogueId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open my public catalogue page"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                >
                  My public page <ExternalLink size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Balance card */}
          <div className="rounded-xl border border-gray-100 bg-[#f8f8f8] p-5 lg:min-w-[260px]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Available Balance
            </p>
            <p className="mt-1.5 text-3xl font-black text-gray-900">
              {wallet ? formatCurrency(wallet.balance, wallet.currency) : '₦0.00'}
            </p>

            {dedicatedAccount && (
              <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]/80">
                  Bank Account
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {dedicatedAccount.account_number}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(dedicatedAccount.account_number)}
                    className="rounded-md bg-white border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                    title="Copy account number"
                  >
                    Copy
                  </button>
                </div>
                {dedicatedAccount.account_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {dedicatedAccount.account_name}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(dedicatedAccount.account_name)}
                      className="rounded-md bg-white border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <p className="text-xs font-semibold text-gray-400">{dedicatedAccount.bank_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats — horizontal snap scroller on mobile, grid from sm+ ── */}
      <div
        role="group"
        aria-label="Account statistics"
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-pl-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/50 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:px-0 sm:pb-0"
      >
        {[
          {
            label: 'Monthly Transactions',
            value: monthlyTransactionsCount,
            sub: 'This month',
            icon: TrendingUp,
            iconBg: 'bg-[#FDFAF3]',
            iconColor: 'text-[#C9A84C]',
          },
          {
            label: 'Successful Payments',
            value: successfulTransactionsCount,
            sub: 'Completed',
            icon: CheckCircle,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            label: 'Total Records',
            value: pagination.total || transactions.length,
            sub: 'All time',
            icon: ReceiptText,
            iconBg: 'bg-gray-50',
            iconColor: 'text-gray-400',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="w-[82vw] max-w-[360px] shrink-0 snap-start rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:w-auto sm:max-w-none"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-400">{stat.sub}</p>
                </div>
                <div className={`rounded-xl ${stat.iconBg} p-2.5`}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Ads ── */}
      <section>
        <AdCarousel platform="web" limit={10} autoPlay autoPlayInterval={6000} />
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black text-gray-900">Quick Actions</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Access your most common activities in one tap.
          </p>
        </div>

        {/* Horizontal snap scroller on mobile, grid from sm+ */}
        <div
          role="group"
          aria-label="Quick actions"
          tabIndex={0}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-pl-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/50 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:px-0 sm:pb-0 xl:grid-cols-4"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex w-[82vw] max-w-[360px] shrink-0 snap-start flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A84C]/30 hover:shadow-md sm:w-auto sm:max-w-none"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] transition group-hover:bg-[#C9A84C] group-hover:border-[#C9A84C]">
                  <Icon
                    size={17}
                    className="text-[#C9A84C] transition group-hover:text-white"
                  />
                </div>
                <h3 className="text-sm font-black text-gray-900">{action.label}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed flex-1">
                  {action.description}
                </p>
                <div className="mt-4 flex items-center gap-1">
                  <span className="text-xs font-semibold text-[#C9A84C]">Open</span>
                  <ArrowRight
                    size={12}
                    className="text-[#C9A84C] transition group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Transactions ── */}
      <section>
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">Recent Transactions</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Your latest Acceding Titans activities and payment records.
              </p>
            </div>
            <Link
              href="/dashboard/opportunities"
              className="inline-flex items-center gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] px-4 py-2 text-sm font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C]/10 whitespace-nowrap"
            >
              Explore Opportunities
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                <ReceiptText className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="font-black text-gray-900">No transactions yet</h3>
              <p className="mt-1.5 text-sm text-gray-400">
                Your transaction history will appear here once you start using Acceding Titans.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      {['Date', 'Type', 'Service', 'Reference', 'Amount', 'Status'].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                            h === 'Amount' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'
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
                            {formatDate(timestamp !== 'Unknown' ? timestamp : new Date().toISOString())}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                              {getTransactionTypeLabel(transaction)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm capitalize text-gray-700">
                            {getServiceName(transaction)}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">
                            {transaction.reference || `TXN-${transaction.id}`}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                            {formatCurrency(Number(transaction.amount))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={getStatusBadgeVariant(transaction.status) as any}>
                              {getStatusLabel(transaction.status)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 lg:hidden">
                {transactions.map((transaction) => {
                  const timestamp = getTransactionTimestamp(transaction);
                  return (
                    <div
                      key={transaction.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
                            {getTransactionStatusIcon(transaction.status)}
                          </div>
                          <div>
                            <p className="text-sm font-black capitalize text-gray-900">
                              {getTransactionTypeLabel(transaction)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getServiceName(transaction)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(transaction.status) as any}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</p>
                          <p className="mt-0.5 text-xs font-semibold text-gray-700">
                            {formatDate(timestamp !== 'Unknown' ? timestamp : new Date().toISOString())}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Amount</p>
                          <p className="mt-0.5 text-sm font-black text-gray-900">
                            {formatCurrency(Number(transaction.amount))}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 font-mono text-[10px] text-gray-300">
                        {transaction.reference || `TXN-${transaction.id}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.lastPage > 1 && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-400">
                      Showing{' '}
                      <span className="font-semibold text-gray-700">
                        {(pagination.currentPage - 1) * pagination.perPage + 1}
                      </span>{' '}
                      –{' '}
                      <span className="font-semibold text-gray-700">
                        {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-gray-700">{pagination.total}</span>
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => setCurrentPage(1)}
                        className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                      >
                        First
                      </button>

                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
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
                            onClick={() => setCurrentPage(p)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                              p === pagination.currentPage
                                ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/20'
                                : 'border border-gray-200 bg-white text-gray-600 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.lastPage}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.lastPage))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                      >
                        <ChevronRight size={14} />
                      </button>

                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.lastPage}
                        onClick={() => setCurrentPage(pagination.lastPage)}
                        className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}