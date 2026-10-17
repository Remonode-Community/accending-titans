import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  ActivityLogActionsResponse,
  ActivityLogFilters,
  ActivityLogListResponse,
  AuditLogStats,
} from '@/types/activity-log.types';

/**
 * The admin audit trail.
 *
 * WHY THIS SERVICE EXISTS AT ALL
 * ------------------------------
 * There was none. The Activity Log page called `setTimeout(600)` and then
 * rendered a hardcoded array of invented administrators and invented event
 * counts. Nothing on that screen was connected to this application, so the
 * `getVTUStatistics`-style dead methods that used to sit here have been
 * replaced rather than re-added.
 *
 * FILTERING HAPPENS ON THE SERVER
 * -------------------------------
 * The old screen filtered and paged its 150 in-memory rows. That cannot scale
 * past whatever it happened to have loaded, and it made the summary and the
 * table disagree. Both are now one request each, both derived from the same
 * filtered query, so they cannot drift apart.
 */
class ActivityLogService {
  /**
   * Strip empty values before they become `?search=&status=` on the URL.
   *
   * An empty query parameter is not the same as an absent one on the server:
   * `''` would satisfy the `nullable|string` rule and then be treated as a real
   * (empty) filter. Cleaning here keeps that decision in one place.
   */
  private buildQuery(filters: ActivityLogFilters = {}, extra: Record<string, string | number> = {}): string {
    const params = new URLSearchParams();

    const merged: Record<string, string | number | undefined> = { ...filters, ...extra };

    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.append(key, String(value));
    });

    const query = params.toString();

    return query ? `?${query}` : '';
  }

  /** One page of entries, filtered and paginated on the server. */
  async getLogs(
    filters: ActivityLogFilters = {},
    page = 1,
    perPage = 25
  ): Promise<ApiResponse<ActivityLogListResponse>> {
    return apiClient.get<ActivityLogListResponse>(
      `/admin/activity-log${this.buildQuery(filters, { page, per_page: perPage })}`
    );
  }

  /**
   * Summary counts.
   *
   * Sent the same filters as the list on purpose. Returning all-time totals
   * above a filtered table is how a screen ends up reporting 15,420 events
   * while displaying three.
   */
  async getStats(filters: ActivityLogFilters = {}): Promise<ApiResponse<AuditLogStats>> {
    return apiClient.get<AuditLogStats>(`/admin/activity-log/stats${this.buildQuery(filters)}`);
  }

  /**
   * Distinct actions present in the log.
   *
   * Drives the Action Type filter, so the dropdown lists verbs that have
   * actually occurred rather than a hardcoded set including things like
   * `kyc.submit` that this product never recorded.
   */
  async getActions(search?: string): Promise<ApiResponse<ActivityLogActionsResponse>> {
    return apiClient.get<ActivityLogActionsResponse>(
      `/admin/activity-log/actions${this.buildQuery({ search })}`
    );
  }
}

export const activityLogService = new ActivityLogService();