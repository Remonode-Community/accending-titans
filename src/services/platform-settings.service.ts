import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdminPlatformSettings,
  BirthdayEligibilityRule,
  BirthdayNotificationSettings,
  FeatureKey,
  FeatureMapResponse,
  LandingContent,
  SiteContact,
} from '@/types/platform-settings.types';

class PlatformSettingsService {
  /** GET /maintenance-status */
  async getMaintenanceStatus(): Promise<ApiResponse<{ maintenance_mode: boolean }>> {
    return apiClient.get('/maintenance-status');
  }

  /** PUT /admin/platform-settings/maintenance-mode */
  async adminUpdateMaintenanceMode(
    enabled: boolean
  ): Promise<ApiResponse<{ maintenance_mode: boolean }>> {
    return apiClient.put('/admin/platform-settings/maintenance-mode', { enabled });
  }

  /** GET /site-settings — public support details and landing-page content. */
  async getSiteSettings(): Promise<
    ApiResponse<{ contact: SiteContact; landing?: LandingContent }>
  > {
    return apiClient.get('/site-settings');
  }

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

  /** PUT /admin/platform-settings/default-dashboard-page */
  async adminUpdateDefaultLandingPage(
    page: string
  ): Promise<ApiResponse<{ default_landing_page: string }>> {
    return apiClient.put('/admin/platform-settings/default-dashboard-page', { page });
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

  /** PUT /admin/platform-settings/contact — blank optional fields clear them. */
  async adminUpdateContact(
    contact: Partial<SiteContact>
  ): Promise<ApiResponse<{ contact: SiteContact }>> {
    return apiClient.put('/admin/platform-settings/contact', contact);
  }

  /** PUT /admin/platform-settings/landing — hero copy/slides and showcase strip. */
  async adminUpdateLandingContent(
    landing: LandingContent
  ): Promise<ApiResponse<{ landing: LandingContent }>> {
    return apiClient.put('/admin/platform-settings/landing', landing);
  }
}

export const platformSettingsService = new PlatformSettingsService();
