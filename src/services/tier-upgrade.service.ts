/**
 * Tier Upgrade Service
 * Handles tier upgrade requests using two different approaches:
 * 
 * 1. Legacy Direct Endpoints (for backward compatibility)
 * - Tier 0: PATCH /tier-zero (Basic enrollment)
 * - Tier 1: PATCH /tier-one (Bronze with personal details)
 * - Tier 2: PATCH /tier-two (Silver with identity documents)
 * 
 * 2. New Application Flow Endpoints (recommended)
 * - GET /tier-upgrade/{tier} - Get existing application
 * - POST /tier-upgrade/{tier}/save-draft - Save draft
 * - POST /tier-upgrade/{tier}/submit - Submit application
 * - GET /tier-upgrade/{tier}/status - Get application status
 * 
 * Updated: June 19, 2026
 */

import { apiClient } from './api-client';
import { uploadService } from './upload.service';
import {
  Tier0UpgradeRequest,
  Tier1UpgradeRequest,
  Tier2UpgradeRequest,
  TierUpgradeResponse,
  TierStatusInfo,
  BvnVerificationRequest,
  BvnVerificationResponse,
  ApiResponse,
  GetTierUpgradeApplicationResponse,
  SaveTierUpgradeDraftResponse,
  SubmitTierUpgradeResponse,
  GetTierUpgradeStatusResponse,
  TierUpgradeFormData,
  TierName,
} from '@/types/index';

class TierUpgradeService {
  // ============= NEW API METHODS =============

  /**
   * Get existing tier upgrade application (draft or submitted)
   * GET /tier-upgrade/{tier}
   * 
   * @param tier - Target tier: 'zero', 'one', or 'two'
   * @returns Existing application or 404 if none found
   */
  async getApplication(tier: TierName): Promise<GetTierUpgradeApplicationResponse> {
    try {
      const response = await apiClient.get<any>(`/payment/tier-upgrade/${tier}`);
      return response as GetTierUpgradeApplicationResponse;
    } catch (error: any) {
      // Handle 404 as success (no existing application)
      if (error?.response?.status === 404) {
        return {
          success: false,
          message: 'No existing application found for this tier',
          data: null,
        };
      }
      console.error('[TierUpgradeService] Error fetching application:', error);
      throw error;
    }
  }

  /**
   * Save tier upgrade form as draft (partial data allowed)
   * POST /tier-upgrade/{tier}/save-draft
   * 
   * @param tier - Target tier: 'zero', 'one', or 'two'
   * @param formData - Partial form data (all fields optional)
   * @returns Saved draft application
   */
  async saveDraft(tier: TierName, formData: Partial<TierUpgradeFormData>): Promise<SaveTierUpgradeDraftResponse> {
    try {
      const response = await apiClient.post<any>(`/payment/tier-upgrade/${tier}/save-draft`, formData);
      return response as SaveTierUpgradeDraftResponse;
    } catch (error: any) {
      console.error('[TierUpgradeService] Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Submit complete tier upgrade application
   * POST /tier-upgrade/{tier}/submit
   * 
   * @param tier - Target tier: 'zero', 'one', or 'two'
   * @param formData - Complete form data (all required fields)
   * @returns Submission response with customer data
   */
  async submitApplication(tier: TierName, formData: TierUpgradeFormData): Promise<SubmitTierUpgradeResponse> {
    try {
      const response = await apiClient.post<any>(`/payment/tier-upgrade/${tier}/submit`, formData);
      return response as SubmitTierUpgradeResponse;
    } catch (error: any) {
      console.error('[TierUpgradeService] Error submitting application:', error);
      throw error;
    }
  }

  /**
   * Get tier upgrade application status
   * GET /tier-upgrade/{tier}/status
   * 
   * @param tier - Target tier: 'zero', 'one', or 'two'
   * @returns Current status and application details
   */
  async getStatus(tier: TierName): Promise<GetTierUpgradeStatusResponse> {
    try {
      const response = await apiClient.get<any>(`/payment/tier-upgrade/${tier}/status`);
      return response as GetTierUpgradeStatusResponse;
    } catch (error: any) {
      console.error('[TierUpgradeService] Error fetching status:', error);
      throw error;
    }
  }

  // ============= LEGACY API METHODS =============
  /**
   * Upgrade to Tier 0 - Basic Enrollment
   * PATCH /v1/payment/customers/tier-zero
   * 
   * Initial customer profile creation with basic information.
   * No prerequisites - this is the first step.
   * 
   * Returns: maplerad_id for use in subsequent tiers
   */
  async upgradeToTierZero(
    data: Tier0UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    return apiClient.patch('/payment/customers/tier-zero', data);
  }
  /**
   * Upgrade to Tier 1 - Bronze Tier
   * PATCH /v1/payment/customers/tier-one
   * 
   * Personal details + BVN verification
   * Prerequisites: Must complete Tier 0 first
   * 
   * Data format:
   * - dob: DD-MM-YYYY format
   * - phone: { phone_country_code: "+234", phone_number: "8123456789" }
   * - address: { street, city, state, country, postal_code, ...}
   * - identification_number: BVN (exactly 11 digits)
   */
  async upgradeToTierOne(
    data: Tier1UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    return apiClient.patch('/payment/customers/tier-one', data);
  }

  /**
   * Upgrade to Tier 2 - Silver Tier
   * PATCH /v1/payment/customers/tier-two
   * 
   * Identity document verification
   * Prerequisites: Must complete Tier 1 first
   * 
   * Data format:
   * - identity: { type, image (base64), number, country }
   * - Supported types: 'nin', 'passport', 'drivers_license', 'voters_card'
   */
  async upgradeToTierTwo(
    data: Tier2UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    return apiClient.patch('/payment/customers/tier-two', data);
  }

  /**
   * Verify BVN (Optional but recommended)
   * POST /v1/payment/identity/bvn-verify
   * 
   * Validate BVN before attempting Tier 1 upgrade
   * No authentication required (public endpoint)
   * 
   * @param bvn 11-digit BVN number
   * @returns BVN details if valid
   */
  async verifyBVN(bvn: string): Promise<ApiResponse<BvnVerificationResponse>> {
    return apiClient.post('/payment/identity/bvn-verify', { bvn } as BvnVerificationRequest);
  }

  /**
   * Upload profile image for Tier 1 upgrade
   * POST /api/v1/profile/upload-image
   *
   * Multipart upload handled by the shared upload service; the backend hosts
   * the file on Cloudinary, stores it on the member's row and returns a
   * secure URL to embed in the tier upgrade request.
   */
  async uploadProfileImage(file: File): Promise<ApiResponse<{ image_url: string; public_id: string; width: number; height: number; size: number; uploaded_at: string }>> {
    return uploadService.uploadProfilePhoto(file);
  }

  /**
   * Get current tier status
   * GET /v1/customers/tier-status
   * 
   * Returns current tier, status, and requirements for next tier
   */
  async getTierStatus(): Promise<ApiResponse<TierStatusInfo>> {
    return apiClient.get('/customers/tier-status');
  }

  /**
   * Legacy: Enroll customer (Deprecated)
   * ❌ DO NOT USE - Use upgradeToTierZero instead
   * 
   * @deprecated Use upgradeToTierZero instead
   */
  async enrollCustomer(
    data: Tier0UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    console.warn('enrollCustomer is deprecated. Use upgradeToTierZero instead.');
    return this.upgradeToTierZero(data);
  }

  /**
   * Legacy: Upgrade user to Tier 1
   * @deprecated Use upgradeToTierOne instead
   */
  async upgradeTierOne(
    data: Tier1UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    return this.upgradeToTierOne(data);
  }

  /**
   * Legacy: Upgrade user to Tier 2
   * @deprecated Use upgradeToTierTwo instead
   */
  async upgradeTierTwo(
    data: Tier2UpgradeRequest
  ): Promise<ApiResponse<TierUpgradeResponse>> {
    return this.upgradeToTierTwo(data);
  }
}

export const tierUpgradeService = new TierUpgradeService();
