import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdminPlatformSettings,
  BirthdayEligibilityRule,
  BirthdayNotificationSettings,
  FeatureKey,
  FeatureMapResponse,
} from '@/types/platform-settings.types';

class PlatformSettingsService {
  /** GET /features — the signed-in member's feature map. */
  async getFeatures(): Promise<ApiResponse<FeatureMapResponse>> {
    return apiClient.get('/features');
  }

  /** GET /admin/platform-settings */
  async adminGet(): Promise<ApiResponse<AdminPlatformSettings>> {
    return apiClient.get('/admin/platform-settings');
  }

  /** PUT /admin/platform-settings/features */
  async adminUpdateFeatures(
    features: Partial<Record<FeatureKey, boolean>>
  ): Promise<ApiResponse<FeatureMapResponse>> {
    return apiClient.put('/admin/platform-settings/features', { features });
  }

  /** PUT /admin/platform-settings/birthday-eligibility */
  async adminUpdateBirthdayEligibility(
    rule: BirthdayEligibilityRule
  ): Promise<ApiResponse<{ birthday_eligibility: BirthdayEligibilityRule }>> {
    return apiClient.put('/admin/platform-settings/birthday-eligibility', rule);
  }

  /** PUT /admin/platform-settings/birthday-notifications */
  async adminUpdateBirthdayNotifications(
    settings: BirthdayNotificationSettings
  ): Promise<ApiResponse<{ birthday_notifications: BirthdayNotificationSettings }>> {
    return apiClient.put('/admin/platform-settings/birthday-notifications', settings);
  }
}

export const platformSettingsService = new PlatformSettingsService();
