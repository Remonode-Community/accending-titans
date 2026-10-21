import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  ActivityLogIndexResponse,
  ActivityLogQuery,
} from '@/types/activity-log.types';

class ActivityLogService {
  /** GET /admin/activity-logs — server-side filtered, paginated audit trail. */
  async adminList(
    params: ActivityLogQuery = {}
  ): Promise<ApiResponse<ActivityLogIndexResponse>> {
    const query: Record<string, string | number> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value;
      }
    });

    return apiClient.get('/admin/activity-logs', { params: query });
  }
}

export const activityLogService = new ActivityLogService();
