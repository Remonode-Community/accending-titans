/**
 * Ledger System - Complete TypeScript Types
 * Date: June 12, 2026
 * 
 * This file defines all TypeScript interfaces for the Ledger System
 * including accounts, entries, reconciliation, settlement batches, and reports.
 */

import { ApiResponse, PaginatedResponse } from './api.types';

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountStatus = 'active' | 'inactive' | 'archived';

export interface LedgerAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  balance: number;
  currency: string;
  description: string;
  status: AccountStatus;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  total_entries?: number;
  last_entry?: {
    id: number;
    entry_reference: string;
    amount: number;
    created_at: string;
  };
}

export interface CreateAccountRequest {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  currency?: string;
  description?: string;
}

export interface UpdateAccountStatusRequest {
  status: AccountStatus;
  reason?: string;
}

export interface SyncAccountBalanceResponse {
  account: {
    id: number;
    account_code: string;
    previous_balance: number;
    new_balance: number;
    variance: number;
    synced_at: string;
  };
}

// ============================================================================
// LEDGER ENTRY TYPES
// ============================================================================

export type EntryType = 
  | 'FUNDING'
  | 'COMMISSION_ACCRUAL'
  | 'PROVIDER_ACCRUAL'
  | 'CHARGE_DEDUCTION'
  | 'SETTLEMENT_TRANSFER'
  | 'PAYOUT_COMPLETE'
  | 'REVERSAL'
  | 'REFUND'
  | 'DISPUTE_RESERVE'
  | 'INTEREST_CREDIT'
  | 'MANUAL_ADJUSTMENT';

export type EntryStatus = 'recorded' | 'pending' | 'reversed' | 'voided';

export interface LedgerEntryAccount {
  id: number;
  account_code: string;
  account_name: string;
  balance?: number;
}

export interface LedgerEntry {
  id: number;
  entry_reference: string;
  entry_date: string;
  entry_type: EntryType;
  debit_account_id: number;
  credit_account_id: number;
  debit_account: LedgerEntryAccount;
  credit_account: LedgerEntryAccount;
  amount: number;
  transaction_reference?: string;
  user_id?: number;
  description: string;
  status: EntryStatus;
  created_by?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface LedgerEntryDetailed extends LedgerEntry {
  central_transaction_id?: number;
  wallet_transaction_id?: number;
  settlement_batch_id?: number;
  metadata?: Record<string, any>;
  approved_by?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateLedgerEntryRequest {
  entry_type: EntryType;
  debit_account_id: number;
  credit_account_id: number;
  amount: number;
  description: string;
  entry_date: string;
  metadata?: Record<string, any>;
}

export interface ReverseLedgerEntryRequest {
  reason: string;
  notes?: string;
}

export interface VoidLedgerEntryRequest {
  reason: string;
}

export interface ReverseLedgerEntryResponse {
  original_entry: {
    id: number;
    entry_reference: string;
    status: EntryStatus;
    amount: number;
  };
  reversal_entry: {
    id: number;
    entry_reference: string;
    entry_type: EntryType;
    amount: number;
    status: EntryStatus;
    created_at: string;
    metadata: {
      reverses_entry_id: number;
      reason: string;
    };
  };
}

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

export type ReconciliationStatus = 'reconciled' | 'pending' | 'discrepancy_found';

export interface AccountReconciliationDetail {
  account_id: number;
  account_code: string;
  account_name: string;
  expected_balance: number;
  actual_balance: number;
  variance: number;
  status: 'reconciled' | 'discrepancy';
}

export interface ReconciliationDiscrepancy {
  type: string;
  account?: string;
  expected_value: number;
  actual_value: number;
  variance: number;
  description: string;
}

export interface ReconciliationReport {
  id: number;
  reconciliation_date: string;
  total_entries: number;
  total_debit_entries: number;
  total_credit_entries: number;
  total_debit_amount: number;
  total_credit_amount: number;
  is_balanced: boolean;
  variance: number;
  overall_status: ReconciliationStatus;
  account_reconciliation_details?: AccountReconciliationDetail[];
  discrepancies: ReconciliationDiscrepancy[];
  generated_by_user_id: number;
  generated_at: string;
}

export interface GenerateReconciliationRequest {
  reconciliation_date: string;
}

// ============================================================================
// SETTLEMENT BATCH TYPES
// ============================================================================

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'archived';

export interface SettlementBatchItem {
  id: number;
  settlement_batch_id: number;
  entry_reference: string;
  entry_type: EntryType;
  amount: number;
  status: EntryStatus;
}

export interface SettlementBatch {
  id: number;
  batch_reference: string;
  settlement_date: string;
  total_entries: number;
  total_amount: number;
  status: BatchStatus;
  paystack_reconciliation_status?: 'pending' | 'completed' | 'failed';
  created_by_user_id: number;
  created_at: string;
  updated_at?: string;
  items?: SettlementBatchItem[];
}

export interface GenerateSettlementBatchRequest {
  settlement_date: string;
}

export interface UpdateBatchStatusRequest {
  status: BatchStatus;
  paystack_reconciliation_status?: 'pending' | 'completed' | 'failed';
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface TrialBalanceAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  balance: number;
  side: 'debit' | 'credit';
}

export interface TrialBalanceReport {
  as_of_date: string;
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  accounts: TrialBalanceAccount[];
  generated_at: string;
}

export interface GenerateTrialBalanceRequest {
  as_of_date: string;
  include_inactive_accounts?: boolean;
}

export interface AccountLedgerEntry {
  entry_date: string;
  entry_reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedgerReport {
  account: {
    id: number;
    account_code: string;
    account_name: string;
    account_type: AccountType;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  entries: AccountLedgerEntry[];
  generated_at: string;
}

export interface GenerateAccountLedgerRequest {
  account_id: number;
  start_date: string;
  end_date: string;
}

export type ReportType = 'trial_balance' | 'account_ledger' | 'entries';
export type ReportFormat = 'csv' | 'pdf';

export interface ExportReportRequest {
  report_type: ReportType;
  format: ReportFormat;
  account_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface ExportReportResponse {
  report_type: ReportType;
  format: ReportFormat;
  generated_at: string;
  download_url: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardAccountSummary {
  id: number;
  account_code: string;
  account_name: string;
  balance: number;
  status: AccountStatus;
}

export interface LedgerDashboard {
  total_balance: number;
  total_active_accounts: number;
  todays_entries_count: number;
  pending_batches: number;
  accounts_summary: {
    clearing?: DashboardAccountSummary;
    commission?: DashboardAccountSummary;
    provider_payable?: DashboardAccountSummary;
    charges_reserve?: DashboardAccountSummary;
    [key: string]: DashboardAccountSummary | undefined;
  };
  generated_at: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface AccountFilters {
  status?: AccountStatus;
  type?: AccountType;
  per_page?: number;
  page?: number;
}

export interface EntryFilters {
  account_id?: number;
  entry_type?: EntryType;
  status?: EntryStatus;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  transaction_reference?: string;
  per_page?: number;
  page?: number;
}

export interface BatchFilters {
  status?: BatchStatus;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

export interface ReconciliationFilters {
  start_date?: string;
  end_date?: string;
  status?: ReconciliationStatus;
  per_page?: number;
  page?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GetAccountsResponse extends ApiResponse<{
  accounts: LedgerAccount[];
  pagination: PaginatedResponse<any>;
}> {}

export interface GetAccountResponse extends ApiResponse<{
  account: LedgerAccount;
}> {}

export interface CreateAccountResponse extends ApiResponse<{
  account: LedgerAccount;
}> {}

export interface UpdateAccountStatusResponse extends ApiResponse<{
  account: Partial<LedgerAccount>;
}> {}

export interface GetEntriesResponse extends ApiResponse<{
  entries: LedgerEntry[];
  pagination: PaginatedResponse<any>;
}> {}

export interface GetEntryResponse extends ApiResponse<{
  entry: LedgerEntryDetailed;
}> {}

export interface CreateEntryResponse extends ApiResponse<{
  entry: LedgerEntry;
}> {}

export interface GetBatchesResponse extends ApiResponse<{
  batches: SettlementBatch[];
  pagination: PaginatedResponse<any>;
}> {}

export interface GetBatchResponse extends ApiResponse<{
  batch: SettlementBatch;
}> {}

export interface GenerateReconciliationResponse extends ApiResponse<{
  report: ReconciliationReport;
}> {}

export interface GetReconciliationReportsResponse extends ApiResponse<{
  reports: ReconciliationReport[];
  pagination: PaginatedResponse<any>;
}> {}

export interface GetReconciliationReportResponse extends ApiResponse<{
  report: ReconciliationReport;
}> {}

export interface TrialBalanceReportResponse extends ApiResponse<{
  report: TrialBalanceReport;
}> {}

export interface AccountLedgerReportResponse extends ApiResponse<{
  report: AccountLedgerReport;
}> {}

export interface DashboardResponse extends ApiResponse<{
  dashboard: LedgerDashboard;
}> {}
