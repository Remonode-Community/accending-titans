'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { TrendingUp, Calendar } from 'lucide-react';

export default function AgentPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    setPerformance({
      sales_volume: 450,
      commission_earned: 22500,
      customer_count: 125,
      transaction_growth: '+18%',
      avg_daily_sales: 15,
      conversion_rate: '2.5%',
      top_service: 'Bill Payments',
      retention_rate: '78%',
      top_customer_orders: 12,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600 mt-2">Track your sales and performance analytics</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 md:overflow-x-visible lg:grid-cols-4">
        {[
          {
            label: 'Sales Volume',
            value: performance.sales_volume.toString(),
            subtitle: 'transactions',
          },
          {
            label: 'Commission Earned',
            value: `₦${performance.commission_earned.toLocaleString()}`,
            subtitle: 'total',
          },
          {
            label: 'Active Customers',
            value: performance.customer_count.toString(),
            subtitle: 'unique',
          },
          {
            label: 'Growth Rate',
            value: performance.transaction_growth,
            subtitle: 'vs last period',
          },
        ].map((metric) => (
          <Card key={metric.label} className="min-w-full md:min-w-auto snap-start md:snap-start">
            <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
            <p className="text-xs text-gray-500 mt-2">{metric.subtitle}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Performance Indicators</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Avg Daily Sales',
                value: performance.avg_daily_sales + ' transactions',
              },
              {
                label: 'Conversion Rate',
                value: performance.conversion_rate,
              },
              {
                label: 'Top Service',
                value: performance.top_service,
              },
              {
                label: 'Customer Retention',
                value: performance.retention_rate,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="flex justify-between items-center p-3 bg-gray-50 rounded lg">
                <span className="text-sm text-gray-600">{kpi.label}</span>
                <span className="text-sm font-semibold text-gray-900">{kpi.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Sales Trend</h2>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const sales = Math.floor(Math.random() * 50 + 10);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-10">{day}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#c9a84c] h-2 rounded-full"
                      style={{ width: Math.floor(Math.random() * 80 + 20) + '%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{sales}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance by Service Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Bill Payments',
              transactions: 225,
              commission: 11250,
              percentage: 50,
            },
            {
              name: 'Wallet Top-ups',
              transactions: 154,
              commission: 8470,
              percentage: 34,
            },
            {
              name: 'Transfers',
              transactions: 71,
              commission: 2780,
              percentage: 16,
            },
          ].map((service) => (
            <div key={service.name} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{service.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transactions</span>
                  <span className="font-medium text-gray-900">{service.transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission</span>
                  <span className="font-medium text-green-600">
                    ₦{service.commission.toLocaleString()}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Of total sales</span>
                    <span className="text-xs font-medium text-gray-900">{service.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#c9a84c] h-2 rounded-full"
                      style={{ width: service.percentage + '%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-[#f7f8ff] to-[#f0f2ff]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Rewards</h2>
        <p className="text-gray-600 mb-4">
          Achieve higher sales targets to unlock bonus commission tiers and exclusive rewards.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: 'Silver', sales: 500, bonus: '0.5%', status: 'active' },
            { tier: 'Gold', sales: 1000, bonus: '1%', status: 'progress' },
            { tier: 'Platinum', sales: 2000, bonus: '2%', status: 'locked' },
          ].map((tier) => (
            <div key={tier.tier} className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-900">{tier.tier}</p>
              <p className="text-sm text-gray-600 mt-1">{tier.sales} sales/month</p>
              <p className="text-sm text-green-600 font-medium mt-2">+{tier.bonus} bonus</p>
              <span
                className={`inline-block text-xs px-2 py-1 rounded mt-3 ${
                  tier.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : tier.status === 'progress'
                    ? 'bg-[#f0f2ff] text-[#8a96ff]'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tier.status === 'active' ? '✓ Active' : tier.status === 'progress' ? '⏳ In Progress' : '🔒 Locked'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
