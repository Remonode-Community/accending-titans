/**
 * FilterPanel Integration Example & Migration Guide
 *
 * This file demonstrates how to convert an existing page with inline filters
 * to use the new standardized FilterPanel component.
 *
 * BEFORE: app/dashboard/history/page.tsx (current implementation)
 * AFTER: Example showing how to refactor it
 */

import { useState, useEffect } from 'react';
import { FilterIcon } from 'lucide-react';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/shared/Button';
import { Transaction } from '@/types';

/**
 * Example: Dashboard History Page with FilterPanel
 * 
 * Key Changes from old implementation:
 * 1. Replace inline filter UI with FilterPanel component
 * 2. Use useFilters hook instead of multiple useState calls
 * 3. Define filter fields once as configuration
 * 4. Pass filters to API calls via getQueryParams()
 * 5. Show filter badge count on button
 */

// Step 1: Define your filter fields as configuration
const HISTORY_FILTER_FIELDS: FilterField[] = [
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Transaction ID, provider, reference...',
    helpText: 'Search by transaction ID or reference number',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All statuses',
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
    ],
  },
  {
    id: 'type',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'All types',
    options: [
      { value: '', label: 'All Types' },
      { value: 'bills', label: 'Bills' },
      { value: 'wallet_topup', label: 'Wallet Top-up' },
      { value: 'wallet_withdrawal', label: 'Withdrawal' },
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

/**
 * Example component showing new pattern
 */
export function DashboardHistoryPageExample() {
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Step 2: Use the useFilters hook
  const {
    isOpen,
    filters,
    isLoading,
    hasActiveFilters,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    getQueryParams,
    getActiveFilterCount,
  } = useFilters({
    fields: HISTORY_FILTER_FIELDS,
    onFiltersChange: (newFilters) => {
      // Reset to page 1 when filters change
      setPage(1);
      fetchTransactions(1, newFilters);
    },
  });

  // Step 3: Fetch data with filters
  const fetchTransactions = async (pageNum: number, filterValues?: Record<string, any>) => {
    const queryParams = filterValues ? filterValues : getQueryParams();
    try {
      // Example API call - adjust based on your actual API
      const response = await fetch(
        `/api/transactions?page=${pageNum}&${new URLSearchParams(queryParams)}`
      );
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Step 4: Add filter button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <Button
          onClick={openFilters}
          className={`relative h-11 rounded-xl px-4 font-semibold transition ${
            hasActiveFilters
              ? 'bg-[#c9a84c] text-white shadow-lg shadow-[#c9a84c]/20 hover:bg-[#b91521]'
              : 'border border-black/10 text-[#111] hover:bg-[#f8f8f8]'
          }`}
        >
          <FilterIcon className="h-4 w-4 mr-2 inline" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* Step 5: Add FilterPanel component */}
      <FilterPanel
        title="Filter Transactions"
        description="Narrow down your transaction history by status, type, date, or search term."
        fields={HISTORY_FILTER_FIELDS}
        isOpen={isOpen}
        onClose={closeFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        isLoading={isLoading}
        position="right"
        mobilePosition="auto"
      />

      {/* Your list/table component */}
      <div className="space-y-4">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center gap-2">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
        <span className="px-4 py-2">Page {page}</span>
        <Button onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}

// Placeholder for transaction row component
function TransactionRow({ transaction }: any) {
  return <div className="p-4 border rounded-lg">{JSON.stringify(transaction)}</div>;
}

/**
 * MIGRATION CHECKLIST:
 *
 * [ ] Define filter fields (HISTORY_FILTER_FIELDS above)
 * [ ] Replace multiple useState calls with useFilters hook
 * [ ] Remove inline filter UI JSX (if/else branches, form fields)
 * [ ] Add FilterPanel component
 * [ ] Add filter button with badge count
 * [ ] Update API fetch calls to use getQueryParams()
 * [ ] Test filtering functionality
 * [ ] Test pagination with filters
 * [ ] Test mobile responsiveness
 * [ ] Test filter reset functionality
 *
 * BENEFITS:
 * ✅ Consistent UI/UX across all pages
 * ✅ Slide-in panel animation
 * ✅ Proper responsive design
 * ✅ Reduced code duplication
 * ✅ Easier to maintain and modify
 * ✅ Better accessibility
 * ✅ Smaller component files
 * ✅ Faster load times (less JS)
 */

/**
 * API BACKEND CONSIDERATIONS:
 *
 * Make sure your API endpoints support:
 * 1. Query parameters for each filter field
 * 2. Multiple filters at once
 * 3. Pagination with filters
 * 4. Sorting if needed
 *
 * Example endpoint:
 * GET /api/transactions?page=1&search=TX123&status=completed&type=bills&date_from=2024-01-01&date_to=2024-12-31
 *
 * The backend should:
 * - Parse all query params
 * - Apply filters in the WHERE clause
 * - Return filtered results
 * - Include pagination metadata
 *
 * No changes needed if your API already supports query params!
 */
