import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  BirthdayEligibility,
  BirthdayReward,
  UpcomingBirthday,
  AdminBirthdayMember,
  AssignGiftRequest,
  // Network celebrations
  MyBirthday,
  NetworkBirthday,
  BirthdayCelebrationPage,
  BirthdayWish,
  BirthdaySuggestion,
  BirthdayActivity,
  BirthdayContributions,
  BirthdayContribution,
  UpdateMyBirthdayRequest,
  CreateSuggestionRequest,
  CreateActivityRequest,
  CreateContributionRequest,
  RevealRequest,
  BirthdayActivityStatus,
  AdminCelebration,
} from '@/types/birthday.types';

class BirthdayService {
  // ────────────────────────────────────────────
  // Network celebrations
  //
  // The planning methods only work for members of the celebrant's network. The
  // server refuses the celebrant; the client never has an opinion about it and
  // must not be relied upon to hide anything.
  // ────────────────────────────────────────────

  /** GET /birthdays/me — the caller's own birthday + what their network is doing. */
  async getMine(): Promise<ApiResponse<MyBirthday>> {
    return apiClient.get('/birthdays/me');
  }

  /** PUT /birthdays/me */
  async updateMine(
    data: UpdateMyBirthdayRequest
  ): Promise<ApiResponse<MyBirthday>> {
    return apiClient.put('/birthdays/me', data);
  }

  /** GET /birthdays/network — birthdays coming up. */
  async getNetwork(withinDays?: number): Promise<ApiResponse<{ birthdays: NetworkBirthday[] }>> {
    const qs = withinDays ? `?within_days=${withinDays}` : '';
    return apiClient.get(`/birthdays/network${qs}`);
  }

  /**
   * GET /birthdays/{userId} — a celebration page.
   *
   * The response is role-aware: a network member receives `planning`, the
   * celebrant receives `surprise_in_progress` instead. `planning` is genuinely
   * absent for the celebrant, not merely hidden by this client.
   */
  async getCelebration(userId: number): Promise<ApiResponse<BirthdayCelebrationPage>> {
    return apiClient.get(`/birthdays/${userId}`);
  }

  /** POST /birthdays/{userId}/wishes */
  async postWish(userId: number, message: string): Promise<ApiResponse<{ wish: BirthdayWish }>> {
    return apiClient.post(`/birthdays/${userId}/wishes`, { message });
  }

  /** DELETE /birthdays/wishes/{wishId} */
  async deleteWish(wishId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/birthdays/wishes/${wishId}`);
  }

  /** GET /birthdays/{userId}/planning — network only. */
  async getPlanning(
    userId: number
  ): Promise<
    ApiResponse<{
      planning: {
        suggestions: BirthdaySuggestion[];
        leading_suggestion_id: number | null;
        total_votes: number;
        activities: BirthdayActivity[];
        contributions: BirthdayContributions;
        revealed: boolean;
        planning_locked: boolean;
      };
    }>
  > {
    return apiClient.get(`/birthdays/${userId}/planning`);
  }

  /** POST /birthdays/{userId}/suggestions — network only. */
  async createSuggestion(
    userId: number,
    data: CreateSuggestionRequest
  ): Promise<ApiResponse<{ suggestion: BirthdaySuggestion }>> {
    return apiClient.post(`/birthdays/${userId}/suggestions`, data);
  }

  /** POST /birthdays/suggestions/{suggestionId}/vote — network only. */
  async vote(
    suggestionId: number,
    vote: boolean
  ): Promise<ApiResponse<{ suggestion: BirthdaySuggestion }>> {
    return apiClient.post(`/birthdays/suggestions/${suggestionId}/vote`, { vote });
  }

  /** DELETE /birthdays/suggestions/{suggestionId} */
  async deleteSuggestion(suggestionId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/birthdays/suggestions/${suggestionId}`);
  }

  /** POST /birthdays/{userId}/activities — network only. */
  async createActivity(
    userId: number,
    data: CreateActivityRequest
  ): Promise<ApiResponse<{ activity: BirthdayActivity }>> {
    return apiClient.post(`/birthdays/${userId}/activities`, data);
  }

  /** PATCH /birthdays/activities/{activityId} */
  async updateActivityStatus(
    activityId: number,
    status: BirthdayActivityStatus
  ): Promise<ApiResponse<{ activity: BirthdayActivity }>> {
    return apiClient.patch(`/birthdays/activities/${activityId}`, { status });
  }

  /** DELETE /birthdays/activities/{activityId} */
  async deleteActivity(activityId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/birthdays/activities/${activityId}`);
  }

  /**
   * POST /birthdays/{userId}/contributions
   *
   * Records a pledge of intent only. No money is moved and no wallet is
   * touched; the running total tells the planning group what they can raise.
   */
  async createContribution(
    userId: number,
    data: CreateContributionRequest
  ): Promise<ApiResponse<{ contribution: BirthdayContribution; total_pledged: number }>> {
    return apiClient.post(`/birthdays/${userId}/contributions`, data);
  }

  /** DELETE /birthdays/contributions/{contributionId} */
  async deleteContribution(
    contributionId: number
  ): Promise<ApiResponse<{ total_pledged: number }>> {
    return apiClient.delete(`/birthdays/contributions/${contributionId}`);
  }

  /** POST /birthdays/{userId}/reveal — network only. */
  async reveal(
    userId: number,
    data: RevealRequest = {}
  ): Promise<ApiResponse<{ revealed_at: string | null }>> {
    return apiClient.post(`/birthdays/${userId}/reveal`, data);
  }

  // ────────────────────────────────────────────
  // Admin moderation
  //
  // Returns no gift, vote or contribution data. Moderation needs to know which
  // celebrations exist and whether a wall needs attention, not what the network
  // is buying.
  // ────────────────────────────────────────────

  async adminGetCelebrations(
    status?: string
  ): Promise<ApiResponse<{ celebrations: AdminCelebration[] }>> {
    const qs = status ? `?status=${status}` : '';
    return apiClient.get(`/admin/birthday-celebrations${qs}`);
  }

  async adminSetWishVisibility(
    wishId: number,
    isHidden: boolean
  ): Promise<ApiResponse<{ wish: { id: number; message: string; is_hidden: boolean } }>> {
    return apiClient.post(`/admin/birthday-celebrations/wishes/${wishId}/visibility`, {
      is_hidden: isHidden,
    });
  }

  // ────────────────────────────────────────────
  // Platform loyalty scheme (pre-existing)
  // ────────────────────────────────────────────

  /** GET /birthdays/upcoming */
  async getUpcoming(): Promise<ApiResponse<{ upcoming: UpcomingBirthday[] }>> {
    return apiClient.get('/birthdays/upcoming');
  }

  /** GET /birthdays/eligibility */
  async getEligibility(): Promise<ApiResponse<{ eligibility: BirthdayEligibility }>> {
    return apiClient.get('/birthdays/eligibility');
  }

  /** GET /birthdays/my-reward */
  async getMyReward(): Promise<ApiResponse<{ reward: BirthdayReward | null }>> {
    return apiClient.get('/birthdays/my-reward');
  }

  /** GET /admin/birthdays */
  async adminGetAll(month?: string): Promise<ApiResponse<{ members: AdminBirthdayMember[] }>> {
    const params = month ? `?month=${month}` : '';
    return apiClient.get(`/admin/birthdays${params}`);
  }

  /** GET /admin/birthdays/eligible */
  async adminGetEligible(): Promise<ApiResponse<{ members: AdminBirthdayMember[] }>> {
    return apiClient.get('/admin/birthdays/eligible');
  }

  /** POST /admin/birthdays/assign-gift */
  async adminAssignGift(
    data: AssignGiftRequest
  ): Promise<ApiResponse<{ reward: BirthdayReward }>> {
    return apiClient.post('/admin/birthdays/assign-gift', data);
  }

  /** POST /admin/birthdays/{id}/mark-delivered */
  async adminMarkDelivered(id: number): Promise<ApiResponse<{ reward: BirthdayReward }>> {
    return apiClient.post(`/admin/birthdays/${id}/mark-delivered`);
  }
}

export const birthdayService = new BirthdayService();
