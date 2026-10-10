'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Badge } from '@/components/shared/Badge';
import { Filter, TrendingUp } from 'lucide-react';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';

const COMMISSION_FILTER_FIELDS: FilterField[] = [
  {
    id: 'period',
    label: 'Period',
    type: 'select',
    options: [
      { label: 'This Week', value: 'week' },
      { label: 'This Month', value: 'month' },
      { label: 'This Quarter', value: 'quarter' },
      { label: 'This Year', value: 'year' },
    ],
  },
];

export default function AgentCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { filters, isOpen, openFilters, closeFilters, applyFilters, resetFilters, hasActiveFilters, getActiveFilterCount } = useFilters({
    fields: COMMISSION_FILTER_FIELDS,
    onFiltersChange: async () => {
      await loadCommissions();
    },
  });

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with API call using filters.period
      setCommissions([
        {
          id: 'COMM001',
          transaction_id: 'TXN001',
          customer: 'John Doe',
          type: 'wallet_topup',
          amount: 5000,
          commission: 250,
          rate: '5%',
          status: 'paid',
          date: '2024-01-25',
        },
        {
          id: 'COMM002',
          transaction_id: 'TXN002',
          customer: 'Jane Smith',
          type: 'wallet_withdrawal',
          amount: 2500,
          commission: 100,
          rate: '4%',
          status: 'paid',
          date: '2024-01-24',
        },
        {
          id: 'COMM003',
          transaction_id: 'TXN003',
          customer: 'Mike Johnson',
          type: 'bills',
          amount: 25000,
          commission: 500,
          rate: '2%',
          status: 'pending',
          date: '2024-01-23',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalEarnings = commissions.reduce((sum, c) => sum + c.commission, 0);
  const paidCommissions = commissions.reduce(
    (sum, c) => sum + (c.status === 'paid' ? c.commission : 0),
    0
  );
  const pendingCommissions = commissions.reduce(
    (sum, c) => sum + (c.status === 'pending' ? c.commission : 0),
    0
  );

  const getStatusVariant = (status: string) => {
    return (status === 'paid' || status === 'success' || status === 'completed') ? 'success' : 'warning';
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Commission Tracking</h1>
        <p className="text-gray-600 mt-2">Monitor your earnings and commission status</p>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-x-visible">
        {[
          { label: 'Total Earnings', value: `₦${totalEarnings.toLocaleString()}`, icon: '📈' },
          { label: 'Paid', value: `₦${paidCommissions.toLocaleString()}`, icon: '✓' },
          { label: 'Pending', value: `₦${pendingCommissions.toLocaleString()}`, icon: '⏳' },
        ].map((stat) => (
          <Card key={stat.label} className="min-w-full md:min-w-auto snap-start md:snap-start">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Button */}
      <div className="flex gap-2">
        <Button onClick={openFilters} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="Filter Commissions"
        description="Filter your commissions by time period."
        isOpen={isOpen}
        fields={COMMISSION_FILTER_FIELDS}
        onApply={applyFilters}
        onClose={closeFilters}
        onReset={resetFilters}
      />

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Commission Breakdown</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Commission ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Transaction Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{comm.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{comm.customer}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f2ff] text-[#8a96ff]">
                      {comm.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">₦{comm.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ₦{comm.commission.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{comm.rate}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant={getStatusVariant(comm.status)} size="sm">
                      {comm.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{comm.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {commissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No commissions found</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings Trend</h3>
          <div className="space-y-3">
            {['Jan', 'Feb', 'Mar'].map((month) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-8">{month}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: Math.random() * 100 + '%' }} />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₦{Math.floor(Math.random() * 50000 + 10000)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Days</h3>
          <div className="space-y-3">
            {['Tuesday', 'Thursday', 'Saturday'].map((day, idx) => (
              <div key={day} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{day}</span>
                <Badge variant="success" size="sm">
                  ₦{(idx + 1) * 5000}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
