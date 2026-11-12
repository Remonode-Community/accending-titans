import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  ReferralLink,
  ReferralLinkFull,
  ReferralProgram,
  ReferralStats,
  PointsConversion,
  AdminReferralItem,
  UserReferralData,
  ReferredUserDetail,
  ReferredUsersPagination,
  AdminReferralLink,
} from '@/types/referral.types';
import { debug } from '@/utils/debug.utils';

/**
 * Referral Service
 * Handles all referral-related operations
 * Based on the backend API: routes/api/v1/referrals.php
 */
class ReferralService {
  /**
   * Get all available referral programs (public)
   * GET /api/v1/referrals/programs
   */
  async getPrograms(): Promise<ReferralProgram[]> {
    try {
      debug.log('[ReferralService] Fetching referral programs');

      const response = await apiClient.get<ReferralProgram[]>('/referrals/programs');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch programs');
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response structure from referral programs endpoint');
      }

      debug.log('[ReferralService] Programs fetched successfully');
      return response.data;
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch programs', error);
      throw error;
    }
  }

  /**
   * Get authenticated user's referral links
   * GET /api/v1/referrals/my-link
   */
  async getMyReferralLinks(): Promise<ReferralLink[]> {
    try {
      debug.log('[ReferralService] Fetching user referral links');

      const response = await apiClient.get<ReferralLink[]>('/referrals/my-link');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch referral links');
      }

      debug.log('[ReferralService] Referral links fetched successfully');
      return response.data || [];
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch referral links', error);
      throw error;
    }
  }

  /**
   * Get user's referral statistics
   * GET /api/v1/referrals/stats
   */
  async getStats(): Promise<ReferralStats> {
    try {
      debug.log('[ReferralService] Fetching referral statistics');

      const response = await apiClient.get<ReferralStats>('/referrals/stats');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch statistics');
      }

      debug.log('[ReferralService] Statistics fetched successfully');
      return response.data!;
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch statistics', error);
      throw error;
    }
  }

  /**
   * Get all referrals across all users (Admin)
   * GET /api/v1/referrals
   */
  async getAllReferrals(): Promise<AdminReferralItem[]> {
    try {
      debug.log('[ReferralService] Fetching all referrals (admin)');

      const response = await apiClient.get<{ referrals: AdminReferralItem[] }>('/referrals');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch referrals');
      }

      if (!Array.isArray(response.data?.referrals)) {
        throw new Error('Invalid response structure from referrals endpoint');
      }

      debug.log('[ReferralService] Referrals fetched successfully');
      return response.data.referrals;
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch all referrals', error);
      throw error;
    }
  }

  /**
   * Get single user's referral data (Admin)
   * GET /api/v1/referrals/single/{id}
   */
  async getUserReferralData(userId: number): Promise<UserReferralData> {
    try {
      debug.log('[ReferralService] Fetching user referral data for user:', userId);

      const response = await apiClient.get<{
        id: number;
        name: string | null;
        email: string;
        referralLinks: AdminReferralLink[];
      }>(`/referrals/single/${userId}`);
      const resourceResponse = response as ApiResponse<{
        id: number;
        name: string | null;
        email: string;
        referralLinks: AdminReferralLink[];
      }> & { authReferralLink?: string | null };

      if (resourceResponse.success === false) {
        throw new Error(resourceResponse.message || 'Failed to fetch user referral data');
      }

      // Laravel JsonResource responses wrap the user fields in `data`, while
      // the additional authReferralLink field is at the response root.
      const responseData = resourceResponse.data;
      if (!responseData || !Number.isInteger(responseData.id) || !Array.isArray(responseData.referralLinks)) {
        throw new Error('Invalid response structure from referral data endpoint');
      }

      return {
        id: responseData.id,
        name: responseData.name,
        email: responseData.email,
        referralLinks: responseData.referralLinks,
        authReferralLink: resourceResponse.authReferralLink ?? null,
      };
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch user referral data', error);
      throw error;
    }
  }

  /**
   * Get paginated list of users referred by the authenticated user
   * GET /api/v1/referrals/referred-users
   */
  async getReferredUsers(
    perPage: number = 15
  ): Promise<{ referred_users: ReferredUserDetail[]; pagination: ReferredUsersPagination }> {
    try {
      debug.log('[ReferralService] Fetching referred users');

      const response = await apiClient.get<{
        referred_users: ReferredUserDetail[];
        pagination: ReferredUsersPagination;
      }>(`/referrals/referred-users?per_page=${perPage}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch referred users');
      }

      const result = response.data!;
      debug.log('[ReferralService] Referred users fetched successfully', {
        count: result.referred_users?.length,
        total: result.pagination?.total,
      });

      return {
        referred_users: result.referred_users || [],
        pagination: result.pagination || { current_page: 1, last_page: 1, per_page: perPage, total: 0 },
      };
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to fetch referred users', error);
      throw error;
    }
  }

  /**
   * Create/get referral link for a program
   * POST /api/v1/referrals/create
   */
  async createReferralLink(programId: number, userId: number): Promise<ReferralLinkFull> {
    try {
      debug.log('[ReferralService] Creating referral link');

      const response = await apiClient.post<ReferralLinkFull>('/referrals/create', {
        programId,
        userId,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create referral link');
      }

      debug.log('[ReferralService] Referral link created successfully');
      return response.data!;
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to create referral link', error);
      throw error;
    }
  }

  /**
   * Track a referral conversion
   * POST /api/v1/referrals/track
   */
  async trackReferral(referralCode: string): Promise<void> {
    try {
      debug.log('[ReferralService] Tracking referral conversion');

      const response = await apiClient.post('/referrals/track', {
        referral_code: referralCode,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to track referral');
      }

      debug.log('[ReferralService] Referral tracked successfully');
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to track referral', error);
      throw error;
    }
  }

  /**
   * Submit withdrawal request for referral earnings
   * POST /api/v1/referrals/withdraw
   */
  async requestWithdrawal(amount: number): Promise<void> {
    try {
      debug.log('[ReferralService] Submitting withdrawal request');

      const response = await apiClient.post('/referrals/withdraw', { amount });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit withdrawal');
      }

      debug.log('[ReferralService] Withdrawal request submitted successfully');
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to submit withdrawal', error);
      throw error;
    }
  }

  /**
   * Convert reward points to cash value
   * POST /api/v1/referrals/convert-points
   * Conversion rate: 1 point = ₦100 (hardcoded)
   */
  async convertPoints(points: number): Promise<PointsConversion> {
    try {
      debug.log('[ReferralService] Converting points to cash');

      const response = await apiClient.post<PointsConversion>(
        '/referrals/convert-points',
        { points }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to convert points');
      }

      debug.log('[ReferralService] Points converted successfully');
      return response.data!;
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to convert points', error);
      throw error;
    }
  }

  /**
   * Share referral link via Web Share API
   */
  async shareReferralLink(link: string, code: string): Promise<void> {
    try {
      if (!navigator.share) {
        await navigator.clipboard.writeText(link);
        return;
      }

      await navigator.share({
        title: 'Join Acceding Titans',
        text: `Join me on Acceding Titans and earn rewards! Use my referral code: ${code}`,
        url: link,
      });

      debug.log('[ReferralService] Referral link shared successfully');
    } catch (error: unknown) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        debug.error('[ReferralService] Failed to share referral link', error);
        throw error;
      }
    }
  }

  /**
   * Copy text to clipboard with fallback
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        debug.log('[ReferralService] Copied to clipboard');
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          debug.log('[ReferralService] Copied to clipboard (fallback)');
        }
        return success;
      }
    } catch (error: unknown) {
      debug.error('[ReferralService] Failed to copy to clipboard', error);
      return false;
    }
  }

  /**
   * Build a shareable WhatsApp URL
   */
  getWhatsAppShareUrl(link: string, code: string): string {
    const text = `Join me on Acceding Titans and earn rewards! Use my referral code: ${code} - ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /**
   * Build a shareable Facebook URL
   */
  getFacebookShareUrl(link: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
  }

  /**
   * Build a shareable Twitter/X URL
   */
  getTwitterShareUrl(link: string, code: string): string {
    const text = `Join me on Acceding Titans and earn rewards! Use my referral code: ${code}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
  }
}

export const referralService = new ReferralService();
