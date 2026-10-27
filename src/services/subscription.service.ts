import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  SubscriptionPlan,
  PlansResponse,
  InitializeSubscriptionResponse,
  SubscriptionInitializeRequest,
  VerifyAndCreateResponse,
  VerifyAndCreateRequest,
  MySubscriptionResponse,
  HistoryResponse,
  EnableDisableResponse,
  EnableDisableRequest,
  ManageLinkResponse,
  CancelAutoRenewResponse,
  PaginationInfo,
  AdminSubscriptionPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  AdminSubscriptionList,
} from '@/types/subscription.types';

class SubscriptionService {
  /**
   * Normalize a plan's `features` field to string[].
   *
   * The API returns registry keys as an array, but an older record (or a
   * double-encoded value) can still arrive as JSON text. Normalising here keeps
   * every consumer working with a plain array.
   */
  private normalizeFeatures(features: unknown): string[] {
    if (!features) return [];

    // Already an array — verify elements are strings
    if (Array.isArray(features)) {
      return features.filter(
        (f): f is string => typeof f === 'string'
      );
    }

    // String — attempt JSON parse to handle double-encoded values
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return this.normalizeFeatures(parsed);
      } catch {
        // Not valid JSON — treat as a single-feature string
        return features.trim() ? [features.trim()] : [];
      }
    }

    return [];
  }

  /** Normalise a single SubscriptionPlan so `features` is always string[] */
  private normalizePlan(plan: SubscriptionPlan): SubscriptionPlan {
    return {
      ...plan,
      features: this.normalizeFeatures(plan?.features),
    };
  }

  // ── Public (Unauthenticated) Endpoints ──────────────────────────

  /** GET /v1/subscriptions/plans — List all active subscription plans */
  async getPlans(): Promise<ApiResponse<PlansResponse>> {
    const res = await apiClient.get<PlansResponse>('/subscriptions/plans');
    if (res.success && res.data?.plans) {
      res.data.plans = res.data.plans.map((plan) => this.normalizePlan(plan));
    }
    return res;
  }

  // ── Authenticated User Endpoints ────────────────────────────────

  /** POST /v1/subscriptions/initialize — Initialize a Paystack transaction for a subscription plan */
  async initializePayment(
    data: SubscriptionInitializeRequest
  ): Promise<ApiResponse<InitializeSubscriptionResponse>> {
    return apiClient.post<InitializeSubscriptionResponse>(
      '/subscriptions/initialize',
      data
    );
  }

  /** POST /v1/subscriptions/verify-and-create — Verify payment and create Paystack subscription */
  async verifyAndCreate(
    data: VerifyAndCreateRequest
  ): Promise<ApiResponse<VerifyAndCreateResponse>> {
    return apiClient.post<VerifyAndCreateResponse>(
      '/subscriptions/verify-and-create',
      data
    );
  }

  /** GET /v1/subscriptions/my-subscription — Get current user's active subscription */
  async getMySubscription(): Promise<ApiResponse<MySubscriptionResponse>> {
    return apiClient.get<MySubscriptionResponse>(
      '/subscriptions/my-subscription'
    );
  }

  /** GET /v1/subscriptions/history — Get subscription history with pagination */
  async getHistory(
    page = 1,
    per_page = 20
  ): Promise<ApiResponse<HistoryResponse>> {
    return apiClient.get<HistoryResponse>(
      `/subscriptions/history?page=${page}&per_page=${per_page}`
    );
  }

  /** POST /v1/subscriptions/paystack/enable — Enable a previously disabled subscription */
  async enableSubscription(
    data: EnableDisableRequest
  ): Promise<ApiResponse<EnableDisableResponse>> {
    return apiClient.post<EnableDisableResponse>(
      '/subscriptions/paystack/enable',
      data
    );
  }

  /** POST /v1/subscriptions/paystack/disable — Disable an active subscription */
  async disableSubscription(
    data: EnableDisableRequest
  ): Promise<ApiResponse<EnableDisableResponse>> {
    return apiClient.post<EnableDisableResponse>(
      '/subscriptions/paystack/disable',
      data
    );
  }

  /** GET /v1/subscriptions/paystack/{code}/manage/link — Generate card update link */
  async getCardUpdateLink(
    code: string
  ): Promise<ApiResponse<ManageLinkResponse>> {
    return apiClient.get<ManageLinkResponse>(
      `/subscriptions/paystack/${code}/manage/link`
    );
  }

  /** POST /v1/subscriptions/paystack/{code}/manage/email — Send card update email */
  async sendCardUpdateEmail(code: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>(
      `/subscriptions/paystack/${code}/manage/email`
    );
  }

  /** POST /v1/subscriptions/cancel-auto-renew — Cancel auto-renewal */
  async cancelAutoRenew(): Promise<ApiResponse<CancelAutoRenewResponse>> {
    return apiClient.post<CancelAutoRenewResponse>(
      '/subscriptions/cancel-auto-renew'
    );
  }

  /** GET /v1/subscriptions/remaining-hours — legacy endpoint, no longer used */
  // Timing access was removed from plans; the client no longer requests it.

  // ── Admin Endpoints ─────────────────────────────────────────────

  /** GET /v1/admin/subscriptions — List all subscriptions */
  async adminGetAll(
    page = 1,
    per_page = 20
  ): Promise<
    ApiResponse<{
      subscriptions: AdminSubscriptionList[];
      pagination: PaginationInfo;
    }>
  > {
    return apiClient.get(
      `/admin/subscriptions?page=${page}&per_page=${per_page}`
    );
  }

  /** POST /v1/admin/subscriptions/plans — Create a new subscription plan */
  async adminCreatePlan(
    data: CreatePlanRequest
  ): Promise<ApiResponse<{ plan: AdminSubscriptionPlan }>> {
    return apiClient.post('/admin/subscriptions/plans', data);
  }

  /** PUT /v1/admin/subscriptions/plans/{id} — Update a subscription plan */
  async adminUpdatePlan(
    id: number,
    data: UpdatePlanRequest
  ): Promise<ApiResponse<{ plan: AdminSubscriptionPlan }>> {
    return apiClient.put(`/admin/subscriptions/plans/${id}`, data);
  }

  /** DELETE /v1/admin/subscriptions/plans/{id} — Deactivate a subscription plan */
  async adminDeletePlan(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/admin/subscriptions/plans/${id}`);
  }

  // ── Admin: Paystack Sync Endpoints ──────────────────────────────

  /** GET /v1/admin/subscriptions/paystack/plans — List plans from Paystack */
  async adminGetPaystackPlans(): Promise<
    ApiResponse<{ plans: SubscriptionPlan[] }>
  > {
    return apiClient.get('/admin/subscriptions/paystack/plans');
  }

  /** GET /v1/admin/subscriptions/paystack/subscriptions — List subscriptions from Paystack */
  async adminGetPaystackSubscriptions(): Promise<
    ApiResponse<{ subscriptions: any[] }>
  > {
    return apiClient.get('/admin/subscriptions/paystack/subscriptions');
  }

  /** GET /v1/admin/subscriptions/paystack/subscriptions/{code} — Fetch single subscription from Paystack */
  async adminGetPaystackSubscription(
    code: string
  ): Promise<ApiResponse<{ subscription: any }>> {
    return apiClient.get(
      `/admin/subscriptions/paystack/subscriptions/${code}`
    );
  }
}

export const subscriptionService = new SubscriptionService();
