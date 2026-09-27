import { apiClient } from './api-client';
import { ApiResponse } from '@/types/api.types';
import {
  UpdateCustomerPayload,
  UpdateCustomerResponse,
  CustomerProfile,
} from '@/types/customer.types';

export interface BasicInfo {
  first_name: string;
  last_name: string;
  dob: string | null;
  gender: string | null;
  email: string;
}

export interface IdentityInfo {
  nin: string | null;
  identified: boolean;
  phone: string;
}

export interface DedicatedAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
}

export interface BankAccount {
  id: string;
  account_number: string;
  bank_name: string;
  account_name: string;
}

export interface Customer {
  basicInfo: BasicInfo;
  identityInfo: IdentityInfo;
  bankInfo: BankAccount[];
  /**
   * Null until the payment provider provisions a dedicated virtual account.
   * Consumers must handle null — the dashboard hides its card in that case
   * rather than rendering a blank account number.
   */
  dedicatedAccount: DedicatedAccount | null;
}

export interface GetCustomerResponse {
  customer: Customer;
}

class CustomerService {
  /**
   * Get customer details including dedicated account information
   * @param emailOrCode User's email address or customer code
   */
  async getCustomer(emailOrCode: string): Promise<ApiResponse<GetCustomerResponse>> {
    try {
      const response = await apiClient.get(`/payment/customer?emailOrCode=${encodeURIComponent(emailOrCode)}`);
      return response;
    } catch (error: any) {
      console.error('[CustomerService] Failed to fetch customer info:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user's account information
   * Uses the user's email to fetch their dedicated account details
   */
  async getCurrentUserAccount(email: string): Promise<ApiResponse<GetCustomerResponse>> {
    return this.getCustomer(email);
  }

  /**
   * Update Customer Profile
   * PATCH /v1/payment/customers/update
   * 
   * Updates customer information on Maplerad and syncs to local database
   * 
   * @param payload - Update payload with customer_id and optional fields
   * @returns Updated customer profile
   */
  async updateCustomer(
    payload: UpdateCustomerPayload
  ): Promise<ApiResponse<UpdateCustomerResponse>> {
    try {
      // Ensure customer_id is a string
      const sanitizedPayload = {
        ...payload,
        customer_id: String(payload.customer_id),
      };

      const response = await apiClient.patch(
        '/payment/customers/update',
        sanitizedPayload
      );

      if (!response.data) {
        throw new Error('Failed to update customer profile');
      }

      return response as ApiResponse<UpdateCustomerResponse>;
    } catch (error: any) {
      const responseData = error.response?.data;
      
      // Parse validation errors from different response formats
      let fieldErrors: Record<string, string> = {};
      let mainMessage = 'Failed to update customer profile';

      if (responseData) {
        // Format 1: details object with field-level arrays
        if (responseData.details && typeof responseData.details === 'object') {
          Object.entries(responseData.details).forEach(([field, errors]: any) => {
            if (Array.isArray(errors) && errors.length > 0) {
              fieldErrors[field] = errors[0];
            }
          });
        }

        // Format 2: Direct message
        if (responseData.message) {
          mainMessage = responseData.message;
        }

        // Format 3: Error array (fallback)
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          mainMessage = responseData.errors[0];
        }
      }

      console.error('[CustomerService] Update error:', {
        message: mainMessage,
        fieldErrors,
        status: error.response?.status,
        fullResponse: responseData,
      });

      throw {
        message: mainMessage,
        fieldErrors,
        details: responseData?.details || {},
        status: error.response?.status,
        fullError: error,
      };
    }
  }

  /**
   * Get Current Customer Profile
   * GET /v1/payment/customers
   * 
   * Retrieves the current authenticated customer's profile
   */
  async getCustomerProfile(): Promise<ApiResponse<{ customer: CustomerProfile }>> {
    return apiClient.get('/payment/customers');
  }

  /**
   * Update Specific Field
   * Helper method to update a single field
   * 
   * @param customerId - Maplerad customer ID
   * @param field - Field name (e.g., 'first_name', 'last_name')
   * @param value - New value
   */
  async updateField(
    customerId: string,
    field: string,
    value: any
  ): Promise<ApiResponse<UpdateCustomerResponse>> {
    const payload: any = {
      customer_id: customerId,
      [field]: value,
    };

    return this.updateCustomer(payload);
  }

  /**
   * Update Contact Information
   * Helper method to update phone and address together
   */
  async updateContactInfo(
    customerId: string,
    phone?: { phone_country_code: string; phone_number: string },
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postal_code: string;
      street2?: string;
    }
  ): Promise<ApiResponse<UpdateCustomerResponse>> {
    const payload: UpdateCustomerPayload = {
      customer_id: customerId,
    };

    if (phone) payload.phone = phone;
    if (address) payload.address = address;

    return this.updateCustomer(payload);
  }

  /**
   * Update Identity Document
   * Helper method to update identity information
   */
  async updateIdentity(
    customerId: string,
    identity: {
      type: 'NIN' | 'PASSPORT' | 'VOTERS_CARD' | 'DRIVERS_LICENSE';
      number: string;
      image?: string;
      country?: string;
    }
  ): Promise<ApiResponse<UpdateCustomerResponse>> {
    const payload: UpdateCustomerPayload = {
      customer_id: customerId,
      identity,
    };

    return this.updateCustomer(payload);
  }
}

export const customerService = new CustomerService();
