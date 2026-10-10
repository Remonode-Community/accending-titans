import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  ContentSubmission,
  ContentSubmissionListResponse,
  SubmitContentRequest,
  AdminContentSubmission,
  AdminPendingListResponse,
  AdminSubmissionListResponse,
  RejectContentRequest,
} from '@/types/content.types';

class ContentService {
  // ── User endpoints ────────────────────────────────────────────────

  /** POST /content/submit */
  async submit(data: SubmitContentRequest): Promise<ApiResponse<{ submission: ContentSubmission }>> {
    return apiClient.post('/content/submit', data);
  }

  /**
   * GET /content/my-submissions
   *
   * NOTE THE ENVELOPE: the list arrives under `data.submissions`, NOT
   * `data.data`.
   *
   * This was previously typed as `PaginatedResponse<ContentSubmission>`, whose
   * shape is `{ data: T[], pagination }`, and the caller read `res.data.data`.
   * The backend has no such key, so the expression was always `undefined` and
   * fell through to `?? []` — every submission rendered as "No submissions yet"
   * even though the rows were being returned, and the submit alert said it had
   * worked. The declared type actively concealed the bug.
   *
   * `ContentSubmissionListResponse` below matches what the server actually
   * sends.
   */
  async getMySubmissions(
    page = 1,
    per_page = 20
  ): Promise<ApiResponse<ContentSubmissionListResponse>> {
    return apiClient.get(`/content/my-submissions?page=${page}&per_page=${per_page}`);
  }

  /** GET /content/submission/{id} */
  async getSubmission(id: number): Promise<ApiResponse<{ submission: ContentSubmission }>> {
    return apiClient.get(`/content/submission/${id}`);
  }

  // ── Admin endpoints ───────────────────────────────────────────────

  /**
   * GET /admin/content/pending
   *
   * Returns `data.submissions`, NOT `data.data`. The shared
   * `PaginatedResponse<T>` implies `data.data`, which this endpoint has never
   * produced — typing these as `PaginatedResponse` is what led the moderation
   * screen to reach for a key that does not exist and silently render an empty
   * queue.
   */
  async adminGetPending(page = 1, per_page = 20): Promise<ApiResponse<AdminPendingListResponse>> {
    return apiClient.get(`/admin/content/pending?page=${page}&per_page=${per_page}`);
  }

  /** GET /admin/content/all — also `data.submissions`. */
  async adminGetAll(status?: string, page = 1, per_page = 20): Promise<ApiResponse<AdminSubmissionListResponse>> {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.append('status', status);
    return apiClient.get(`/admin/content/all?${params.toString()}`);
  }

  /** POST /admin/content/{id}/approve */
  async adminApprove(id: number): Promise<ApiResponse<{ submission: AdminContentSubmission }>> {
    return apiClient.post(`/admin/content/${id}/approve`);
  }

  /** POST /admin/content/{id}/reject */
  async adminReject(id: number, data: RejectContentRequest): Promise<ApiResponse<{ submission: AdminContentSubmission }>> {
    return apiClient.post(`/admin/content/${id}/reject`, data);
  }
}

export const contentService = new ContentService();
