'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { AdminStatisticsData } from '@/types/admin-analytics.types';
import { formatCurrency } from '@/utils/format.utils';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [data, setData] = useState<AdminStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const isAdmin = useMemo(() => {
    return Boolean(user?.roles?.some((role) => role === 'admin'));
  }, [user]);

  const verifiedRate = useMemo(() => {
    if (!data?.users.total) return '0.0';
    return ((data.users.verified / data.users.total) * 100).toFixed(1);
  }, [data]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await adminService.getAdminDashboardComprehensive(selectedPeriod);

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, selectedPeriod]);

  if (!isAdmin) return null;

  const overviewCards = data
    ? [
        {
          title: 'Success Rate',
          value: `${data.performance.success_rate.toFixed(1)}%`,
          helper: `${data.performance.successful_transactions.toLocaleString()} of ${data.performance.total_transactions.toLocaleString()} txns`,
          icon: Zap,
        },
        {
          title: 'Total Users',
          value: data.users.total.toLocaleString(),
          helper: `+${data.users.new} new this period`,
          icon: Users,
        },
        {
          title: 'Wallet Balance',
          value: formatCurrency(data.wallet.total_balance),
          helper: 'All users combined',
          icon: Wallet,
        },
        {
          title: 'Verified Rate',
          value: `${verifiedRate}%`,
          helper: `${data.users.verified.toLocaleString()} verified users`,
          icon: Shield,
        },
      ]
    : [];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-gray-700" />
                Admin Analytics
              </div>

              <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
                Analytics Overview
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                Review platform performance, wallet movement, user growth and
                transaction distribution.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              {(['week', 'month', 'year'] as const).map((period) => {
                const isSelected = selectedPeriod === period;

                return (
                  <Button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    className={
                      isSelected
                        ? 'bg-black text-white hover:bg-gray-900'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    }
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {loading && (
          <div className="space-y-6">
            <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <CardBody>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100"
                    />
                  ))}
                </div>
              </CardBody>
            </Card>

            <div className="h-64 animate-pulse rounded-3xl border border-gray-200 bg-gray-100" />
          </div>
        )}

        {!loading && error && (
          <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <CardBody>
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
                  <AlertCircle className="h-7 w-7 text-black" />
                </div>

                <h3 className="mt-5 text-xl font-black text-black">
                  Unable to Load Analytics
                </h3>

                <p className="mt-2 max-w-md text-sm text-gray-500">{error}</p>

                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm"
                  className="mt-5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {!loading && !error && !data && (
          <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <CardBody>
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
                  <BarChart3 className="h-7 w-7 text-black" />
                </div>

                <h3 className="mt-5 text-xl font-black text-black">
                  No Analytics Data Available
                </h3>

                <p className="mt-2 max-w-md text-sm text-gray-500">
                  There is no analytics record available for the selected reporting
                  period.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {!loading && !error && data && (
          <>
            <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                      Platform Overview
                    </p>

                    <h3 className="mt-1 text-2xl font-black text-black">
                      Key Performance Indicators
                    </h3>
                  </div>

                  <Badge variant="success">Live Data</Badge>
                </div>
              </CardHeader>

              <CardBody>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {overviewCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
                      >
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-100 transition-all duration-300 group-hover:scale-110" />

                        <div className="relative flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-500">
                              {item.title}
                            </p>

                            <p className="mt-3 break-words text-3xl font-black tracking-tight text-black">
                              {item.value}
                            </p>

                            <p className="mt-2 text-xs font-medium text-gray-500">
                              {item.helper}
                            </p>
                          </div>

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-black">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {data.wallet.transactions.length > 0 && (
              <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                        Wallet Transactions
                      </p>

                      <h3 className="mt-1 text-2xl font-black text-black">
                        Wallet Activity
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <ArrowUpRight className="h-4 w-4" />
                      {selectedPeriod} aggregation
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                    {data.wallet.transactions.map((txn, idx) => (
                      <div
                        key={`${txn.type}-${txn.status}-${idx}`}
                        className="flex flex-col gap-4 border-b border-gray-200 bg-white p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                            <Wallet className="h-5 w-5 text-black" />
                          </div>

                          <div>
                            <p className="font-bold capitalize text-black">
                              {txn.type}
                            </p>

                            <p className="text-xs text-gray-500">
                              {txn.count.toLocaleString()} transactions
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-lg font-black text-black">
                            {formatCurrency(txn.amount)}
                          </p>

                          <div className="mt-1">
                            <Badge
                              variant={
                                txn.status === 'success' ? 'success' : 'warning'
                              }
                            >
                              {txn.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}


            <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-bold text-black">Period:</span>{' '}
                  {data.start_date} to {data.end_date}
                </p>
              </div>

              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
