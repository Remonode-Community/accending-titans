import { apiClient } from './api-client';
import {
  ApiResponse,
  Advertisement,
  AdvertisementResponse,
} from '@/types/api.types';

class AdvertisementService {
  // ============= PUBLIC/CLIENT ENDPOINTS =============

  /**
   * Get all active advertisements with optional filtering
   */
  async getAdvertisements(params?: {
    limit?: number;
    active?: boolean;
    platform?: 'mobile' | 'web' | 'all';
  }): Promise<ApiResponse<AdvertisementResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.platform) queryParams.append('platform', params.platform);

    // Relative to NEXT_PUBLIC_API_BASE_URL, which already ends in /api/v1.
    return apiClient.get(
      `/advertisements${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  /**
   * Get a single advertisement by ID
   */
  async getAdvertisement(adId: string): Promise<ApiResponse<Advertisement>> {
    return apiClient.get(`/advertisements/${adId}`);
  }

  /**
   * Track ad click/engagement
   */
  async trackAdClick(adId: number): Promise<ApiResponse<{ ad_id: number; clicks: number; ctr: number }>> {
    return apiClient.post(`/advertisements/${adId}/click`, {});
  }
}

export const advertisementService = new AdvertisementService();
