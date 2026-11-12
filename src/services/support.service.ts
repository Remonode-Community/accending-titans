/**
 * Support Service
 *
 * Both surfaces of the support desk:
 *
 *  - Member side  → `/support/...` (own tickets only; the API scopes every
 *    query to the signed-in user, so there is nothing extra to send).
 *  - Staff side   → `/admin/support/...` (requires the `manage_support`
 *    permission server-side; errors arrive as a 200 `success:false` body).
 *
 * The backend answers HTTP 200 even for errors and branches on `success`,
 * so every call validates the envelope instead of relying on thrown Axios
 * errors alone — a `success:false` body is returned to the caller as-is for
 * the page to render (silent failures were a known flaw in the old desk).
 */

import { apiClient } from './api-client';
import { uploadService } from './upload.service';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdminReplyPayload,
  CreateSupportTicketPayload,
  ReplySupportTicketPayload,
  SupportAdminStats,
  SupportAdminTicketListData,
  SupportAgentsData,
  SupportAttachmentInput,
  SupportCategoriesData,
  SupportMemberStats,
  SupportTicketDetailData,
  SupportTicketFilters,
  SupportTicketListData,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketData,
  SupportStaffReplyData,
  SupportMessage,
} from '@/types/support.types';

const MEMBER_BASE = '/support';
const ADMIN_BASE = '/admin/support';

/** Build `?a=1&b=2` from defined filter values only. */
const buildQuery = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

class SupportService {
  // ─────────────────────────────────────────────────────────────
  // Member side
  // ─────────────────────────────────────────────────────────────

  /** Active categories for the new-ticket form and the list filters. */
  async getCategories(): Promise<ApiResponse<SupportCategoriesData>> {
    return apiClient.get(`${MEMBER_BASE}/categories`);
  }

  /** The member's tickets + counters. */
  async getTickets(
    filters: SupportTicketFilters = {},
    page = 1,
    perPage = 10,
  ): Promise<ApiResponse<SupportTicketListData>> {
    const query = buildQuery({
      page,
      per_page: perPage,
      status: filters.status,
      category: filters.category,
      search: filters.search,
    });

    return apiClient.get(`${MEMBER_BASE}/tickets${query}`);
  }

  /** One of the member's tickets with its conversation (internal notes excluded server-side). */
  async getTicket(id: number): Promise<ApiResponse<SupportTicketDetailData>> {
    return apiClient.get(`${MEMBER_BASE}/tickets/${id}`);
  }

  /** Raise a new ticket with its opening description and optional attachments. */
  async createTicket(
    payload: CreateSupportTicketPayload,
  ): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.post(`${MEMBER_BASE}/tickets`, payload);
  }

  /** Reply to a conversation. Closed tickets must be reopened instead. */
  async reply(
    id: number,
    payload: ReplySupportTicketPayload,
  ): Promise<ApiResponse<{ message: SupportMessage }>> {
    return apiClient.post(`${MEMBER_BASE}/tickets/${id}/messages`, payload);
  }

  /** The member confirms the issue is fixed. */
  async resolve(id: number): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.post(`${MEMBER_BASE}/tickets/${id}/resolve`, {});
  }

  /** Reopen a resolved/closed ticket — the reason becomes a visible message. */
  async reopen(id: number, reason: string): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.post(`${MEMBER_BASE}/tickets/${id}/reopen`, { reason });
  }

  // ─────────────────────────────────────────────────────────────
  // Staff side (admin panel)
  // ─────────────────────────────────────────────────────────────

  /** The full ticket queue + counters. */
  async getAdminTickets(
    filters: SupportTicketFilters = {},
    page = 1,
    perPage = 15,
  ): Promise<ApiResponse<SupportAdminTicketListData>> {
    const query = buildQuery({
      page,
      per_page: perPage,
      status: filters.status,
      category: filters.category,
      priority: filters.priority,
      assigned_to: filters.assigned_to,
      search: filters.search,
    });

    return apiClient.get(`${ADMIN_BASE}/tickets${query}`);
  }

  /** Staff eligible for assignment. */
  async getAgents(): Promise<ApiResponse<SupportAgentsData>> {
    return apiClient.get(`${ADMIN_BASE}/agents`);
  }

  /** One ticket with the full conversation including internal notes. */
  async getAdminTicket(id: number): Promise<ApiResponse<SupportTicketDetailData>> {
    return apiClient.get(`${ADMIN_BASE}/tickets/${id}`);
  }

  /** Assign the ticket to a support agent (must hold the permission itself). */
  async assign(id: number, userId: number): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.post(`${ADMIN_BASE}/tickets/${id}/assign`, { assigned_to: userId });
  }

  /** Explicit status control; terminal stamps follow the status. */
  async updateStatus(
    id: number,
    status: SupportTicketStatus,
  ): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.patch(`${ADMIN_BASE}/tickets/${id}/status`, { status });
  }

  /** Escalate or de-escalate priority. */
  async updatePriority(
    id: number,
    priority: SupportTicketPriority,
  ): Promise<ApiResponse<SupportTicketData>> {
    return apiClient.patch(`${ADMIN_BASE}/tickets/${id}/priority`, { priority });
  }

  /** Public reply to the member, or an internal note only staff can see. */
  async adminReply(
    id: number,
    payload: AdminReplyPayload,
  ): Promise<ApiResponse<SupportStaffReplyData>> {
    return apiClient.post(`${ADMIN_BASE}/tickets/${id}/messages`, payload);
  }

  /**
   * Upload an image for a ticket attachment. Uses the generic upload
   * endpoint's dedicated `tickets` folder so desk media is quarantined from
   * catalogue/content media in the Cloudinary tree.
   */
  async uploadAttachment(file: File): Promise<SupportAttachmentInput> {
    const res = await uploadService.uploadImage(file, 'tickets');

    if (!res.success || !res.data?.image_url) {
      throw new Error(res.message || 'That image could not be uploaded. Please try again.');
    }

    return {
      url: res.data.image_url,
      name: file.name,
      size: res.data.size,
      type: 'image',
    };
  }
}

export const supportService = new SupportService();
export type { SupportMemberStats, SupportAdminStats };
