import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  Ask,
  AskBoardResponse,
  BlockEntry,
  CirclesResponse,
  CreateAskRequest,
  ImpactResponse,
  MyReport,
  NetworkOverview,
  NetworkPreferences,
  UpdatePreferencesRequest,
  AdminAskRow,
  AdminReportRow,
} from '@/types/network.types';

/**
 * The member network.
 *
 * WHAT THE CLIENT IS NOT ALLOWED TO DECIDE
 * ----------------------------------------
 * Nothing here hides anything. Consent, blocking and contact disclosure are all
 * enforced server-side, and the client renders whatever it is given. The
 * `contact.whatsapp` field is null unless the server released it; the client
 * must not reach for a number from anywhere else, and there is no fallback
 * source to reach for.
 *
 * Reading the network is never gated. Only `store()` can fail on membership,
 * because posting an ask is a benefit of subscribing while reading a board is
 * not.
 */
class NetworkService {
  /* ── Circles ── */

  /** GET /network/circles */
  async getCircles(limit?: number): Promise<ApiResponse<CirclesResponse>> {
    const qs = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/network/circles${qs}`);
  }

  /** GET /network/preferences */
  async getPreferences(): Promise<ApiResponse<{ preferences: NetworkPreferences }>> {
    return apiClient.get('/network/preferences');
  }

  /**
   * PUT /network/preferences
   *
   * Both flags default to false on the server, so this is how a member opts IN.
   */
  async updatePreferences(
    data: UpdatePreferencesRequest
  ): Promise<ApiResponse<{ preferences: NetworkPreferences }>> {
    return apiClient.put('/network/preferences', data);
  }

  /** GET /network/impact — the renewal-screen counters. */
  async getImpact(): Promise<ApiResponse<ImpactResponse>> {
    return apiClient.get('/network/impact');
  }

  /* ── Asks ── */

  /** GET /asks */
  async getBoard(limit?: number): Promise<ApiResponse<AskBoardResponse>> {
    const qs = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/asks${qs}`);
  }

  /** POST /asks */
  async createAsk(data: CreateAskRequest): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.post('/asks', data);
  }

  /** GET /asks/{id} */
  async getAsk(id: number): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.get(`/asks/${id}`);
  }

  /** POST /asks/{id}/claim — the one transition that can disclose a number. */
  async claimAsk(id: number): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.post(`/asks/${id}/claim`, {});
  }

  /** POST /asks/{id}/fulfil — writes the member edge. */
  async fulfilAsk(id: number): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.post(`/asks/${id}/fulfil`, {});
  }

  /** POST /asks/{id}/withdraw */
  async withdrawClaim(id: number): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.post(`/asks/${id}/withdraw`, {});
  }

  /** POST /asks/{id}/cancel */
  async cancelAsk(id: number): Promise<ApiResponse<{ ask: Ask }>> {
    return apiClient.post(`/asks/${id}/cancel`, {});
  }

  /** DELETE /asks/{id} */
  async deleteAsk(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/asks/${id}`);
  }

  /* ── Safety ── */

  /** GET /network/blocks */
  async getBlocks(): Promise<ApiResponse<{ blocks: BlockEntry[] }>> {
    return apiClient.get('/network/blocks');
  }

  /** POST /network/blocks/{userId} */
  async blockMember(userId: number, reason?: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(`/network/blocks/${userId}`, { reason });
  }

  /** DELETE /network/blocks/{userId} */
  async unblockMember(userId: number): Promise<ApiResponse<unknown>> {
    return apiClient.delete(`/network/blocks/${userId}`);
  }

  /** GET /network/reports/mine */
  async getMyReports(): Promise<ApiResponse<{ reports: MyReport[] }>> {
    return apiClient.get('/network/reports/mine');
  }

  /**
   * POST /network/reports
   *
   * `targetable_type` is the backend class name, which is what the server's
   * validation whitelist expects.
   */
  async reportContent(params: {
    targetableType: 'App\\Models\\Ask' | 'App\\Models\\BirthdayWish';
    targetableId: number;
    reason: string;
    details?: string;
  }): Promise<ApiResponse<{ report_id: number }>> {
    return apiClient.post('/network/reports', {
      targetable_type: params.targetableType,
      targetable_id: params.targetableId,
      reason: params.reason,
      details: params.details,
    });
  }

  /* ── Admin ── */

  async adminGetOverview(): Promise<ApiResponse<NetworkOverview>> {
    return apiClient.get('/admin/network/overview');
  }

  async adminGetAsks(status?: string): Promise<ApiResponse<{ asks: AdminAskRow[] }>> {
    const qs = status ? `?status=${status}` : '';
    return apiClient.get(`/admin/network/asks${qs}`);
  }

  /**
   * POST /admin/network/asks/{id}/status
   *
   * Only `cancelled` and `expired` are accepted. `fulfilled` is refused by the
   * server because it represents a real outcome between two members, and a
   * moderator must not be able to manufacture it.
   */
  async adminSetAskStatus(
    id: number,
    status: 'cancelled' | 'expired'
  ): Promise<ApiResponse<{ ask: { id: number; status: string } }>> {
    return apiClient.post(`/admin/network/asks/${id}/status`, { status });
  }

  async adminGetReports(status?: string): Promise<ApiResponse<{ reports: AdminReportRow[] }>> {
    const qs = status ? `?status=${status}` : '';
    return apiClient.get(`/admin/network/reports${qs}`);
  }

  async adminResolveReport(
    id: number,
    status: 'resolved' | 'dismissed'
  ): Promise<ApiResponse<{ report: { id: number; status: string } }>> {
    return apiClient.post(`/admin/network/reports/${id}/resolve`, { status });
  }

  /** POST /admin/network/reindex — rebuilds derived signals only. */
  async adminReindex(): Promise<ApiResponse<{ indexed: number }>> {
    return apiClient.post('/admin/network/reindex', {});
  }
}

export const networkService = new NetworkService();
