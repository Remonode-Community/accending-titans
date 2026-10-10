import { apiClient } from './api-client';
import { debug } from '@/utils/debug.utils';
import { ApiResponse } from '@/types/api.types';

/**
 * Payment Service
 * Handles all payment-related operations with automatic idempotency key management
 */

interface InitializePaymentRequest {
  amount: number;
  currency?: 'NGN' | 'USD';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer' | 'wallet';
  description?: string;
  email?: string;
  metadata?: Record<string, any>;
}

interface InitializePaymentResponse {
  success: boolean;
  data: {
    payment: {
      id: string;
      amount: number;
      currency: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      reference: string;
      created_at: string;
    };
    authorization_url?: string;
    access_code?: string;
    public_key?: string;
  };
}

// `AirtimePurchaseRequest` and `DataPurchaseRequest` were removed with the VTU
// feature — they described airtime top-ups and data bundle purchases.

interface BillPaymentRequest {
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
  provider: string;
  account_number: string;
  amount: number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  is_estimate?: boolean;
  pin?: string;
}

interface PINVerificationRequest {
  pin: string;
  request_id: string;
}

class PaymentService {
  /**
   * Initialize payment with idempotency key
   * Idempotency key is automatically added by interceptor
   */
  async initializePayment(
    payload: InitializePaymentRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<InitializePaymentResponse>> {
    try {
      debug.log('[PaymentService] Initializing payment', { retryCount });

      const response = await apiClient.post<InitializePaymentResponse>(
        '/payments/initialize',
        payload
      );

      debug.log('[PaymentService] Payment initialization successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Payment initialization failed', error);

      // Retry logic for network errors (not for MISSING_IDEMPOTENCY_KEY)
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying payment initialization (attempt ${retryCount + 1}/3)`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.initializePayment(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Verify payment status
   * Also requires idempotency key for safety
   */
  async verifyPayment(reference: string): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Verifying payment');

      const response = await apiClient.post('/payments/verify', {
        reference,
      });

      debug.log('[PaymentService] Payment verification successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Payment verification failed', error);
      throw error;
    }
  }
  // ──────────────────────────────────────────────
  // Removed with the VTU feature
  //
  // purchaseAirtime, confirmAirtimePurchase, purchaseData, confirmDataPurchase,
  // purchaseElectricity, confirmPayment and getVTPassBalance. Each one either
  // posted to /vtu/pay, /vtu/pay/confirm or /vtu/balance, or existed only to
  // confirm an airtime/data/electricity purchase. None had a caller and none
  // had a backend route.
  //
  // Bill payment (payBill, confirmBillPayment) is a separate product line and is
  // kept, as are the merchant balance checks below.
  // ──────────────────────────────────────────────

  /**
   * Pay bills with PIN
   * NOTE: PIN is sent directly with the payment request
   * Idempotency-Key is automatically added as REQUEST HEADER by the API interceptor
   */
  async payBill(payload: BillPaymentRequest & { pin?: string }, retryCount: number = 0): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Paying bill', { retryCount });

      // Include pin in payload if provided
      const billPayload = {
        ...payload,
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/transactions/bills/pay', billPayload);

      debug.log('[PaymentService] Bill payment successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Bill payment failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying bill payment (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.payBill(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Confirm bill payment with PIN verification
   */
  async confirmBillPayment(
    requestId: string,
    pinData: PINVerificationRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Confirming bill payment', { retryCount });

      const response = await apiClient.post('/transactions/bills/pay/confirm', {
        ...pinData,
      });

      debug.log('[PaymentService] Bill payment confirmation successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Bill payment confirmation failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying bill confirmation (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.confirmBillPayment(requestId, pinData, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Get Paystack merchant balance
   * Returns balance in kobo (divide by 100 to get naira)
   */
  async getPaystackBalance(): Promise<ApiResponse<{ data: Array<{ currency: string; balance: number }> }>> {
    try {
      debug.log('[PaymentService] Fetching Paystack merchant balance');

      const response = await apiClient.get('/payment/merchant-balance');

      debug.log('[PaymentService] Paystack balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Paystack balance', error);
      throw error;
    }
  }

  /**
   * Get Maplerad balance
   */
  async getMapleradBalance(): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Fetching Maplerad balance');

      const response = await apiClient.get('/payment/maplerad-balance');

      debug.log('[PaymentService] Maplerad balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Maplerad balance', error);
      throw error;
    }
  }

  /**
   * Get Telnyx balance
   * Returns available credit for SMS operations
   */
  async getTelnyxBalance(): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Fetching Telnyx merchant balance');

      const response = await apiClient.get('/telnyx/merchant-balance');

      debug.log('[PaymentService] Telnyx balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Telnyx balance', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
