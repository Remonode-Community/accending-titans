import { apiClient } from './api-client';
import {
  Transaction,
  TransactionFilters,
  PurchaseAirtimeRequest,
  PurchaseDataRequest,
  PayBillsRequest,
  ReportTransactionIssueRequest,
  PaginatedResponse,
  ApiResponse,
} from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';

// Extended transaction type for API responses
export interface ExtendedTransaction extends Transaction {
  transaction_type?: string;
  transaction_date?: string;
  service_logo?: string | null;
  purchased_code?: string | null;
  metadata?: Record<string, any>;
  transactionable_type?: string;
  transactionable_id?: string;
  transactionable?: Record<string, any>;
}

export interface TransactionsApiResponse {
  success: boolean;
  message: string;
  data: {
    transactions: ExtendedTransaction[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
}

class TransactionService {
  /**
   * Transaction history for the signed-in member.
   *
   * The endpoint is always scoped to the authenticated user, so a user id is
   * not part of the path. A legacy caller may still pass one as the first
   * argument; it is accepted and ignored rather than being sent to the server.
   */
  async getTransactions(
    filtersOrUserId?: TransactionFilters | string,
    maybeFilters?: TransactionFilters
  ): Promise<TransactionsApiResponse> {
    const filters =
      typeof filtersOrUserId === 'object' && filtersOrUserId !== null
        ? filtersOrUserId
        : maybeFilters;

    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    // Path is relative to NEXT_PUBLIC_API_BASE_URL, which already ends in
    // /api/v1 — do not prefix another /v1 or the URL doubles up and 404s.
    return apiClient.get(`/transactions/me${query}`) as Promise<TransactionsApiResponse>;
  }

  async getTransaction(transactionId: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.get(`/transactions/me/${transactionId}`);
  }

  async purchaseAirtime(data: PurchaseAirtimeRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/vtu/pay', data);
  }

  async purchaseData(data: PurchaseDataRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/transactions/data/purchase', data);
  }

  async payBills(data: PayBillsRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/transactions/bills/pay', data);
  }

  async getReceipt(
    transactionId: string,
    format: 'pdf' | 'json' | 'email' = 'json'
  ): Promise<any> {
    return apiClient.get(`/transactions/${transactionId}/receipt?format=${format}`);
  }

  async reportIssue(
    transactionId: string,
    data: ReportTransactionIssueRequest
  ): Promise<ApiResponse<{ report: any }>> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return apiClient.post(`/transactions/${transactionId}/report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const transactionService = new TransactionService();
