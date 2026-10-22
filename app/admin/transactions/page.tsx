'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Filter,
  Eye,
} from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminStats } from '@/components/admin/AdminStats';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/shared/Button';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { Modal } from '@/components/shared/Modal';

interface Transaction {
  id: string | number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  transaction_type: string;
  amount: string | number;
  status: string;
  transaction_date: string | null;
  reference: string | null;
  description: string | null;
  metadata?: Record<string, unknown>;
}

interface TransactionStats {
  total_transactions: number;
  total_amount: number;
  completed_count: number;
  failed_count: number;
  pending_count: number;
}

const EMPTY_STATS: TransactionStats = {
  total_transactions: 0,
  total_amount: 0,
  completed_count: 0,
  failed_count: 0,
  pending_count: 0,
};

const PER_PAGE = 20;

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isAdmin = useMemo(() => {
    return Boolean(user?.roles?.some((role) => role === 'admin'));
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Reference, member name, email...',
      helpText: 'Search by reference, description, member name, or email',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'success', label: 'Successful' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'reversed', label: 'Reversed' },
      ],
    },
    {
      id: 'transaction_type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: 'Subscription Payment', label: 'Subscription Payment' },
        { value: 'Wallet Funding', label: 'Wallet Funding' },
        { value: 'Withdrawal', label: 'Withdrawal' },
        { value: 'Transfer', label: 'Transfer' },
      ],
    },
    {
      id: 'date_from',
      label: 'From Date',
      type: 'date',
      helpText: 'Filter from this date',
    },
    {
      id: 'date_to',
      label: 'To Date',
      type: 'date',
      helpText: 'Filter to this date',
    },
  ];

  // Use filters hook
  const {
    isOpen,
    filters,
    isLoading: filtersLoading,
    hasActiveFilters,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    getActiveFilterCount,
  } = useFilters({
    fields: filterFields,
    onFiltersChange: (newFilters) => {
      setCurrentPage(1);
      fetchTransactions(1, newFilters);
    },
  });

  const fetchTransactions = async (page = 1, filterValues?: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      const filtersToUse = filterValues || filters;

      const response = await adminService.getAllTransactions(page, PER_PAGE, filtersToUse);
      const payload = response?.data;

      if (!payload) {
        setTransactions([]);
        setStats(EMPTY_STATS);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      setTransactions(Array.isArray(payload.transactions) ? payload.transactions : []);
      setStats({ ...EMPTY_STATS, ...(payload.stats ?? {}) });
      setTotalCount(payload.pagination?.total ?? 0);
      setTotalPages(payload.pagination?.last_page || 1);
    } catch (error) {
      console.error('[AdminTransactions] Error fetching transactions:', error);
      setTransactions([]);
      setStats(EMPTY_STATS);
      setTotalCount(0);
      setTotalPages(1);
      showAlert('Failed to load transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string }> = {
      success: { bg: 'bg-green-100', text: 'text-green-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      reversed: { bg: 'bg-purple-100', text: 'text-purple-800' },
      delivered: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    
    const style = statusStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-block font-medium rounded-full ${style.bg} ${style.text} px-3 py-1 caption capitalize`}>
        {status}
      </span>
    );
  };

  const successRate = stats.total_transactions
    ? Math.round((stats.completed_count / stats.total_transactions) * 100)
    : 0;

  const statsItems = [
    {
      title: 'Total Transactions',
      value: stats.total_transactions,
      change: { value: 'All time', direction: 'neutral' as const },
    },
    {
      title: 'Total Volume',
      value: formatCurrency(stats.total_amount),
      change: {
        value: `${stats.completed_count} successful`,
        direction: 'neutral' as const,
      },
    },
    {
      title: 'Successful',
      value: stats.completed_count,
      change: { value: `${successRate}%`, direction: 'up' as const },
    },
    {
      title: 'Failed',
      value: stats.failed_count,
      change: {
        value: `${stats.pending_count} pending`,
        direction: 'neutral' as const,
      },
    },
  ];

  const tableColumns = [
    {
      key: 'reference',
      label: 'Reference',
      width: '150px',
      render: (value: string | null) => value || '—',
    },
    {
      key: 'user_name',
      label: 'Member',
      width: '200px',
      render: (value: string, row: Transaction) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{value || 'Unknown member'}</div>
          {row.user_email && (
            <div className="caption text-slate-500 dark:text-slate-400">{row.user_email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'transaction_type',
      label: 'Type',
      width: '160px',
    },
    {
      key: 'amount',
      label: 'Amount',
      width: '120px',
      render: (value: string | number) => formatCurrency(typeof value === 'string' ? parseFloat(value) : value),
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'transaction_date',
      label: 'Date',
      width: '150px',
      render: (value: string | null) => (value ? formatDate(value) : '—'),
    },
    {
      key: 'id',
      label: 'Action',
      width: '80px',
      align: 'center' as const,
      render: (value: string | number, row: Transaction) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTransaction(row);
            setShowDetails(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#090707] dark:text-white">
      <AdminHeader
        title="Transactions"
        description="View and manage all platform transactions"
        action={{
          label: 'Export Report',
          onClick: () => console.log('Export report'),
        }}
      />

      <AdminStats stats={statsItems} />

      {/* Filter Button */}
      <div className="flex justify-end">
        <Button
          onClick={openFilters}
          className={`h-11 rounded-xl px-4 font-semibold transition ${
            hasActiveFilters
              ? 'bg-[#c9a84c] text-white shadow-lg shadow-[#c9a84c]/20 hover:bg-[#b91521]'
              : 'border border-black/10 text-white hover:bg-[#f8f8f8]'
          }`}
        >
          <Filter className="h-4 w-4 mr-2 inline" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="Filter Transactions"
        description="Narrow down transactions by status, type, date range, or search term"
        fields={filterFields}
        isOpen={isOpen}
        onClose={closeFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        isLoading={filtersLoading}
        position="right"
        mobilePosition="auto"
      />

      <AdminTable
        columns={tableColumns}
        data={transactions}
        loading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        total={totalCount}
        onPageChange={setCurrentPage}
        title="All Transactions"
        perPage={PER_PAGE}
      />

      {showDetails && selectedTransaction && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Transaction Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Reference</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedTransaction.reference}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="mt-1">
                  {getStatusBadge(selectedTransaction.status)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Member</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedTransaction.user_name || 'Unknown member'}
                </p>
                {selectedTransaction.user_email && (
                  <p className="text-sm text-gray-500">{selectedTransaction.user_email}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedTransaction.transaction_type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatCurrency(typeof selectedTransaction.amount === 'string' ? parseFloat(selectedTransaction.amount) : selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedTransaction.transaction_date
                    ? formatDate(selectedTransaction.transaction_date)
                    : '—'}
                </p>
              </div>
              {selectedTransaction.description && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {selectedTransaction.description}
                  </p>
                </div>
              )}
            </div>

            {selectedTransaction.metadata && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Additional Details
                </p>
                <pre className="rounded-lg bg-gray-50 p-3 text-xs overflow-auto max-h-[200px] text-gray-900">
                  {JSON.stringify(selectedTransaction.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
