import { apiClient } from './api-client';
import {
  ApiResponse,
  Advertisement,
  AdvertisementAdmin,
  AdvertisementResponse,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
  AdvertisementAnalytics,
  AdvertisementAnalyticsSummary,
  BulkReorderRequest,
  BulkToggleStatusRequest,
  PaginatedResponse,
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

    return apiClient.get(
      `/v1/advertisements${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  /**
   * Get a single advertisement by ID
   */
  async getAdvertisement(adId: string): Promise<ApiResponse<Advertisement>> {
    return apiClient.get(`/v1/advertisements/${adId}`);
  }

  /**
   * Track ad click/engagement
   */
  async trackAdClick(adId: number): Promise<ApiResponse<{ ad_id: number; clicks: number; ctr: number }>> {
    return apiClient.post(`/advertisements/${adId}/click`, {});
  }

  // ============= ADMIN ENDPOINTS =============

  /**
   * List all advertisements (Admin)
   */
  async listAdvertisements(params?: {
    page?: number;
    per_page?: number;
    sort_by?: 'display_order' | 'created_at' | 'impressions' | 'clicks' | 'title';
    sort_order?: 'asc' | 'desc';
    search?: string;
    platform?: 'mobile' | 'web' | 'all';
    status?: 'active' | 'inactive' | 'expired';
  }): Promise<ApiResponse<PaginatedResponse<AdvertisementAdmin>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.status) queryParams.append('status', params.status);

    return apiClient.get(
      `/admin/advertisements${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  /**
   * Create a new advertisement (Admin)
   */
  async createAdvertisement(data: CreateAdvertisementRequest): Promise<ApiResponse<AdvertisementAdmin>> {
    return apiClient.post('/admin/advertisements', data);
  }

  /**
   * Get a single advertisement by ID (Admin)
   */
  async getAdvertisementAdmin(id: number): Promise<ApiResponse<AdvertisementAdmin>> {
    return apiClient.get(`/admin/advertisements/${id}`);
  }

  /**
   * Update an advertisement (Admin)
   */
  async updateAdvertisement(id: number, data: UpdateAdvertisementRequest): Promise<ApiResponse<AdvertisementAdmin>> {
    return apiClient.put(`/admin/advertisements/${id}`, data);
  }

  /**
   * Delete an advertisement (Admin - Soft Delete)
   */
  async deleteAdvertisement(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/advertisements/${id}`);
  }

  /**
   * Bulk reorder advertisements (Admin)
   */
  async bulkReorder(data: BulkReorderRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/admin/advertisements/bulk/reorder', data);
  }

  /**
   * Bulk toggle active status (Admin)
   */
  async bulkToggleStatus(data: BulkToggleStatusRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/admin/advertisements/bulk/toggle-status', data);
  }

  /**
   * Get advertisement analytics (Admin)
   */
  async getAdvertisementAnalytics(id: number): Promise<ApiResponse<AdvertisementAnalytics>> {
    return apiClient.get(`/admin/advertisements/${id}/analytics`);
  }

  /**
   * Get analytics dashboard summary (Admin)
   */
  async getAnalyticsSummary(): Promise<ApiResponse<AdvertisementAnalyticsSummary>> {
    return apiClient.get('/admin/advertisements/analytics/summary');
  }
}

export const advertisementService = new AdvertisementService();
