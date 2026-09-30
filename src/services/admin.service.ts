import { apiClient } from './api-client';
import {
  AdminDashboard,
  AdminUser,
  Agent,
  UpdateUserStatusRequest,
  RefundTransactionRequest,
  GenerateReportRequest,
  ApiResponse,
  PaginatedResponse,
  SendEmailRequest,
} from '@/types/api.types';
import {
  AdminStatisticsData,
  UserVtuStatistics,
  UserWalletStatistics,
  UserStatistics,
  CombinedUserStatistics,
} from '@/types/vtu.types';
import type {
  Role,
  Permission,
  StoreRoleRequest,
  UpdateRoleRequest,
  StorePermissionRequest,
  UpdatePermissionRequest,
  AssignRoleRequest,
  AssignPermissionRequest,
  RevokePermissionRequest,
  AdminUserDetail,
  AdminDashboardStats,
  LoginHistoryEntry,
  AdminUpdateUserRequest,
  AssignRoleResponse,
  AssignPermissionResponse,
  ToggleActiveResponse,
  RestoreUserResponse,
  LoginHistoryResponse,
  AdminStatsResponse,
} from '@/types/role.types';

class AdminService {
  async getDashboard(): Promise<ApiResponse<{ data: any }>> {
    return apiClient.get('/admin/dashboard/comprehensive');
  }

  // USER MANAGEMENT
  async getUsers(page = 1, per_page = 20, filters?: any): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/users?${params.toString()}`);
  }

  async getUser(userId: string): Promise<ApiResponse<{ user: AdminUser }>> {
    return apiClient.get(`/admin/users/${userId}`);
  }

  async createUser(data: any): Promise<any> {
    return apiClient.post('/admin/users', data);
  }

  async updateUser(userId: string, data: any): Promise<any> {
    return apiClient.put(`/admin/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<any> {
    return apiClient.delete(`/admin/users/${userId}`);
  }

  async suspendUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/suspend`, {});
  }

  async activateUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/activate`, {});
  }

  async verifyUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/verify`, {});
  }

  /**
   * @deprecated No route exists at `/admin/users/{id}/roles`, so this always 404s.
   * Use `syncUserRoles`, which replaces the role set through the dedicated,
   * properly guarded endpoint.
   */
  async assignRolesToUser(userId: string, roleNames: string[]): Promise<any> {
    return apiClient.put(`/role/users/${userId}/roles`, { roles: roleNames });
  }

  /**
   * @deprecated No route exists at `/admin/users/{id}/permissions`.
   * Individual permissions are managed per ROLE, not per user, through
   * assignPermissionToRole / revokePermissionFromRole.
   */
  async assignPermissionsToUser(userId: string, permissionIds: number[]): Promise<any> {
    void userId;
    void permissionIds;
    throw new Error(
      'Per-user permission assignment is not supported. Permissions belong to roles; use assignPermissionToRole().'
    );
  }

  async getUserTransactions(userId: string, page = 1, per_page = 50): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/transactions?page=${page}&per_page=${per_page}`);
  }

  async getUserWallet(userId: string): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/wallet`);
  }

  async getUserReferrals(userId: string, page = 1, per_page = 50): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/referrals?page=${page}&per_page=${per_page}`);
  }

  async exportUsers(format = 'csv'): Promise<any> {
    return apiClient.get(`/admin/users/export?format=${format}`);
  }

  async bulkUserAction(userIds: number[], action: string): Promise<any> {
    return apiClient.post('/admin/users/bulk-action', { user_ids: userIds, action });
  }

  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusRequest
  ): Promise<ApiResponse<{ user: AdminUser }>> {
    return apiClient.put(`/admin/users/${userId}/status`, data);
  }

  async sendEmailToUser(
    userId: string | number,
    payload: SendEmailRequest
  ): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/email`, payload);
  }

  async sendNotificationWithData(
    userId: string | number,
    payload: {
      title: string;
      body: string;
      type: string;
      priority?: 'high' | 'normal' | 'low';
      send_push?: boolean;
      send_email?: boolean;
      email_template?: string;
      extra_data?: Record<string, any>;
    }
  ): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/notification`, payload);
  }

  async changeUserRole(userId: string | number, role: string): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/role`, { role });
  }

  // TRANSACTIONS ENDPOINTS
  async getAllTransactions(page = 1, per_page = 10, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/transactions/all?${params.toString()}`);
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    return apiClient.get(`/transactions/${transactionId}`);
  }

  async verifyAirtimeConversion(conversionId: number, approved: boolean, notes?: string): Promise<any> {
    return apiClient.post('/transactions/airtime-conversion/verify', {
      conversion_id: conversionId,
      approved,
      notes,
    });
  }

  async getTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/transactions?${params.toString()}`);
  }

  async refundTransaction(
    transactionId: string,
    data: RefundTransactionRequest
  ): Promise<any> {
    return apiClient.post(`/admin/transactions/${transactionId}/refund`, data);
  }

  // ROLES & PERMISSIONS
  // Based on /api/v1/role/* endpoints

  /**
   * List all roles with their permissions
   * GET /api/v1/role/roles
   */
  async getRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
    return apiClient.get('/role/roles');
  }

  /**
   * Create a new role
   * POST /api/v1/role/roles
   */
  async createRole(data: StoreRoleRequest): Promise<ApiResponse<{ role: Role }>> {
    return apiClient.post('/role/roles', data);
  }

  /**
   * Update a role
   * PUT /api/v1/role/roles/{id}
   */
  async updateRole(roleId: number, data: UpdateRoleRequest): Promise<ApiResponse<{ role: Role }>> {
    return apiClient.put(`/role/roles/${roleId}`, data);
  }

  /**
   * Delete a role
   * DELETE /api/v1/role/roles/{id}
   */
  async deleteRole(roleId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/role/roles/${roleId}`);
  }

  /**
   * List all permissions
   * GET /api/v1/role/permissions
   */
  async getPermissions(): Promise<ApiResponse<{ permissions: Permission[] }>> {
    return apiClient.get('/role/permissions');
  }

  /**
   * Create a new permission
   * POST /api/v1/role/permissions
   */
  async createPermission(data: StorePermissionRequest): Promise<ApiResponse<{ permission: Permission }>> {
    return apiClient.post('/role/permissions', data);
  }

  /**
   * Update a permission
   * PUT /api/v1/role/permissions/{id}
   */
  async updatePermission(permissionId: number, data: UpdatePermissionRequest): Promise<ApiResponse<{ permission: Permission }>> {
    return apiClient.put(`/role/permissions/${permissionId}`, data);
  }

  /**
   * Delete a permission
   * DELETE /api/v1/role/permissions/{id}
   */
  async deletePermission(permissionId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/role/permissions/${permissionId}`);
  }

  /**
   * Assign a role to a user.
   *
   * POST /api/v1/role/assign/role
   *
   * Additive and idempotent — it never removes roles the member already has.
   * Use revokeRoleFromUser or syncUserRoles to take one away.
   *
   * The server enforces the privilege ceiling, the no-self-promotion rule and
   * the lock-out guards, and returns a readable `message` explaining any
   * refusal. Do not pre-empt those checks here: the client cannot know the
   * actor's own permission set, nor whether this is the last administrator.
   */
  async assignRoleToUser(data: AssignRoleRequest): Promise<ApiResponse<AssignRoleResponse>> {
    return apiClient.post('/role/assign/role', data);
  }

  /**
   * Revoke a single role from a user.
   *
   * POST /api/v1/role/revoke/role
   *
   * This endpoint did not previously exist: the platform could grant roles but
   * had no way to take one away through the API.
   */
  async revokeRoleFromUser(data: AssignRoleRequest): Promise<ApiResponse<AssignRoleResponse>> {
    return apiClient.post('/role/revoke/role', data);
  }

  /**
   * Replace a user's entire role set in one operation.
   *
   * PUT /api/v1/role/users/{userId}/roles
   *
   * Prefer this over a read-modify-write of assign/revoke calls: two sequential
   * requests can interleave with a concurrent change and leave somebody with a
   * role nobody intended. An empty array is refused by the server.
   */
  async syncUserRoles(
    userId: number,
    roles: string[]
  ): Promise<ApiResponse<{ user: { id: number; roles: string[]; permissions: string[] } }>> {
    return apiClient.put(`/role/users/${userId}/roles`, { roles });
  }

  /**
   * Assign a permission to a role
   * POST /api/v1/role/role/permission
   */
  async assignPermissionToRole(data: AssignPermissionRequest): Promise<ApiResponse<AssignPermissionResponse>> {
    return apiClient.post('/role/role/permission', data);
  }

  /**
   * Revoke a permission from a role
   * POST /api/v1/role/role/permission/revoke
   */
  async revokePermissionFromRole(data: RevokePermissionRequest): Promise<ApiResponse<AssignPermissionResponse>> {
    return apiClient.post('/role/role/permission/revoke', data);
  }

  // OFFER CODES
  async getOfferCodes(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/offer-codes?${params.toString()}`);
  }

  async getOfferCode(offerId: number): Promise<any> {
    return apiClient.get(`/admin/offer-codes/${offerId}`);
  }

  async createOfferCode(data: any): Promise<any> {
    return apiClient.post('/admin/offer-codes', data);
  }

  async updateOfferCode(offerId: number, data: any): Promise<any> {
    return apiClient.put(`/admin/offer-codes/${offerId}`, data);
  }

  async deleteOfferCode(offerId: number): Promise<any> {
    return apiClient.delete(`/admin/offer-codes/${offerId}`);
  }

  // WALLET
  async getWalletStatistics(): Promise<any> {
    return apiClient.get('/stats/wallet');
  }

  async getWalletBalance(): Promise<any> {
    return apiClient.get('/wallet/balance');
  }

  async getWalletTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/wallet/transactions?${params.toString()}`);
  }

  // VTU
  async getVTUTransactionStats(): Promise<any> {
    return apiClient.get('/stats/vtu');
  }

  async getVTUTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/vtu/transactions?${params.toString()}`);
  }

  async getVTUBalance(): Promise<any> {
    return apiClient.get('/vtu/balance');
  }

  // VTU RECIPIENTS
  async getVTURecipients(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/vtu/recipients?${params.toString()}`);
  }

  async getVTURecipient(recipientId: number): Promise<any> {
    return apiClient.get(`/vtu/recipients/${recipientId}`);
  }

  async getRecentlyUsedRecipients(limit = 10): Promise<any> {
    return apiClient.get(`/vtu/recipients/quick-access/recently-used?limit=${limit}`);
  }

  async getFrequentlyUsedRecipients(limit = 10): Promise<any> {
    return apiClient.get(`/vtu/recipients/quick-access/frequently-used?limit=${limit}`);
  }

  async searchVTURecipients(query: string, transactionType?: string, serviceIdentifier?: string): Promise<any> {
    return apiClient.post('/vtu/recipients/search/suggest', {
      query,
      transaction_type: transactionType,
      service_identifier: serviceIdentifier,
    });
  }

  async updateVTURecipient(recipientId: number, data: any): Promise<any> {
    return apiClient.put(`/vtu/recipients/${recipientId}`, data);
  }

  async deleteVTURecipient(recipientId: number): Promise<any> {
    return apiClient.delete(`/vtu/recipients/${recipientId}`);
  }

  async recordRecipientUsage(recipientId: number, transactionId: number): Promise<any> {
    return apiClient.post(`/vtu/recipients/${recipientId}/record-usage`, { transaction_id: transactionId });
  }

  // REFERRALS
  async getReferrals(): Promise<any> {
    return apiClient.get('/referrals');
  }

  async getReferralPrograms(): Promise<any> {
    return apiClient.get('/referrals/programs');
  }

  async getReferralStats(): Promise<any> {
    return apiClient.get('/referrals/stats');
  }

  async getUserWithReferrals(userId: number): Promise<any> {
    return apiClient.get(`/referrals/single/${userId}`);
  }

  // NOTIFICATIONS
  async getNotificationStats(): Promise<any> {
    return apiClient.get('/notifications/stats');
  }

  async sendNotificationToUser(userId: number, title: string, body: string, type: string, priority: string = 'normal', metadata?: any): Promise<any> {
    return apiClient.post('/admin/notifications/send-to-user', {
      user_id: userId,
      title,
      message: body,
      type,
      priority,
      metadata,
    });
  }

  async sendNotificationToUsers(userIds: number[], title: string, body: string, type: string, priority: string = 'normal'): Promise<any> {
    return apiClient.post('/admin/notifications/send-to-users', {
      user_ids: userIds,
      title,
      message: body,
      type,
      priority,
    });
  }

  async sendBroadcastCampaign(userIds: number[], title: string, body: string, options?: any): Promise<any> {
    return apiClient.post('/admin/test/send-campaign', {
      user_ids: userIds,
      title,
      message: body,
      options,
    });
  }

  // STATISTICS & ANALYTICS
  async getWalletStats(): Promise<any> {
    return apiClient.get('/stats/wallet');
  }

  async getVTUStats(): Promise<any> {
    return apiClient.get('/stats/vtu');
  }

  async getUserStats(): Promise<any> {
    return apiClient.get('/stats/user');
  }

  async getAllStats(): Promise<any> {
    return apiClient.get('/stats/all');
  }

  async getStatsAdmin(): Promise<any> {
    return apiClient.get('/stats/admin');
  }

  async generateReport(data: GenerateReportRequest): Promise<any> {
    return apiClient.post('/admin/reports/generate', data);
  }

  async getAgents(page = 1, per_page = 20): Promise<ApiResponse<PaginatedResponse<Agent>>> {
    return apiClient.get(`/admin/agents?page=${page}&per_page=${per_page}`);
  }

  async getAnalytics(metric: string, period: string): Promise<any> {
    return apiClient.get(`/admin/analytics?metric=${metric}&period=${period}`);
  }

  // NEW VTU STATISTICS ENDPOINTS (May 2026 Update)
  async getAdminVtuStatistics(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<AdminStatisticsData>> {
    return apiClient.get(`/admin/statistics?period=${period}`);
  }

  async getUserVtuStatistics(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<UserVtuStatistics>> {
    return apiClient.get(`/statistics/vtu?period=${period}`);
  }

  async getUserWalletStatistics(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<UserWalletStatistics>> {
    return apiClient.get(`/statistics/wallet?period=${period}`);
  }

  async getUserStatistics(): Promise<ApiResponse<UserStatistics>> {
    return apiClient.get(`/statistics/user`);
  }

  async getCombinedUserStatistics(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<CombinedUserStatistics>> {
    return apiClient.get(`/statistics/all?period=${period}`);
  }

  async getAdminDashboardComprehensive(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<AdminStatisticsData>> {
    return apiClient.get(`/admin/dashboard/comprehensive?period=${period}`);
  }

  // ── NEW ADMIN USER MANAGEMENT ENDPOINTS (from API docs) ──────────────

  /**
   * Get admin dashboard stats (user statistics for dashboard overview)
   * GET /api/v1/admin/stats
   */
  async getAdminStats(): Promise<ApiResponse<AdminStatsResponse>> {
    return apiClient.get('/admin/stats');
  }

  /**
   * Get single user with full details
   * GET /api/v1/admin/users/{id}
   */
  async getAdminUserDetail(userId: number): Promise<ApiResponse<{ user: AdminUserDetail }>> {
    return apiClient.get(`/admin/users/${userId}`);
  }

  /**
   * Update user (admin) - can update details and assign roles
   * PUT /api/v1/admin/users/{id}
   */
  async updateAdminUser(userId: number, data: AdminUpdateUserRequest): Promise<ApiResponse<{ user: AdminUserDetail }>> {
    return apiClient.put(`/admin/users/${userId}`, data);
  }

  /**
   * Soft delete a user
   * DELETE /api/v1/admin/users/{id}
   */
  async softDeleteUser(userId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/admin/users/${userId}`);
  }

  /**
   * Permanently delete a user
   * DELETE /api/v1/admin/users/{id}/force
   */
  async forceDeleteUser(userId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(`/admin/users/${userId}/force`);
  }

  /**
   * Restore a soft-deleted user
   * POST /api/v1/admin/users/{id}/restore
   */
  async restoreUser(userId: number): Promise<ApiResponse<RestoreUserResponse>> {
    return apiClient.post(`/admin/users/${userId}/restore`);
  }

  /**
   * Toggle user active status (activate/deactivate)
   * POST /api/v1/admin/users/{id}/toggle-active
   */
  async toggleUserActive(userId: number): Promise<ApiResponse<ToggleActiveResponse>> {
    return apiClient.post(`/admin/users/${userId}/toggle-active`);
  }

  /**
   * Get user login history
   * GET /api/v1/admin/users/{id}/login-history
   */
  async getUserLoginHistory(userId: number, page = 1, per_page = 20): Promise<ApiResponse<LoginHistoryResponse>> {
    return apiClient.get(`/admin/users/${userId}/login-history?page=${page}&per_page=${per_page}`);
  }
}

class AgentService {
  async getDashboard(): Promise<any> {
    return apiClient.get('/agents/dashboard');
  }

  async getCustomers(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/agents/customers?${params.toString()}`);
  }

  async addCustomer(data: any): Promise<any> {
    return apiClient.post('/agents/customers', data);
  }

  async getCommissions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/agents/commissions?${params.toString()}`);
  }

  async getPerformance(period = 'month'): Promise<any> {
    return apiClient.get(`/agents/performance?period=${period}`);
  }
}

class ReferralService {
  async getInfo(): Promise<any> {
    return apiClient.get('/referral/info');
  }

  async getCommissions(page = 1, per_page = 20): Promise<any> {
    return apiClient.get(`/referral/commissions?page=${page}&per_page=${per_page}`);
  }
}

export const adminService = new AdminService();
export const agentService = new AgentService();
export const referralService = new ReferralService();
