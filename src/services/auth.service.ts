import { apiClient } from './api-client';
import {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  SendPhoneVerificationOTPRequest,
  SendPhoneVerificationOTPResponse,
  ResendPhoneVerificationOTPRequest,
  ResendPhoneVerificationOTPResponse,
  VerifyPhoneWithOTPRequest,
  VerifyPhoneRequest,
  RequestPhoneVerificationRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  UserPreferences,
  ApiResponse,
} from '@/types/api.types';
import type {
  AuthSession,
  ChangePasswordPayload,
  MemberProfile,
  NotificationPreferences,
  SaveProfilePayload,
} from '@/types/profile.types';

class AuthService {
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/auth/register', data);
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', data);
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout', {});
    apiClient.logout();
    return response;
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/auth/verify-email-with-otp', data);
  }

  async resendEmailVerificationOTP(email: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/resend-email-verification-otp', { email });
  }

  async sendPhoneVerificationOTP(
    data: SendPhoneVerificationOTPRequest
  ): Promise<ApiResponse<SendPhoneVerificationOTPResponse>> {
    return apiClient.post('/otp/request', data);
  }

  async resendPhoneVerificationOTP(
    data: ResendPhoneVerificationOTPRequest
  ): Promise<ApiResponse<ResendPhoneVerificationOTPResponse>> {
    return apiClient.post('/otp/resend', data);
  }

  async verifyPhoneWithOTP(
    data: VerifyPhoneWithOTPRequest
  ): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/otp/verify', data);
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ email: string }>> {
    return apiClient.post('/auth/forgot-password', data);
  }

  async verifyPasswordResetOtp(data: { email: string; otp: string }): Promise<ApiResponse<{ email: string; reset_token: string }>> {
    return apiClient.post('/auth/verify-password-reset-otp', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/reset-password', data);
  }

  async requestPhoneVerification(
    data: RequestPhoneVerificationRequest
  ): Promise<ApiResponse<void>> {
    return apiClient.post('/users/request-phone-verification', data);
  }

  async verifyPhone(data: VerifyPhoneRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/users/verify-phone', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.put('/users/change-password', data);
  }

  async getUser(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/auth/user');
  }
}

class UserService {
  /**
   * Current member profile. GET /auth/profile returns it under `data.profile`
   * (the envelope already supplies the outer `data`, so the controller must not
   * use a `data` key of its own or this reads data.data.profile).
   */
  async getProfile(): Promise<ApiResponse<{ profile: MemberProfile }>> {
    return apiClient.get('/auth/profile');
  }

  /** Persist profile edits. Sends the same nested shape the endpoint accepts. */
  async saveProfile(
    payload: SaveProfilePayload
  ): Promise<ApiResponse<{ profile: MemberProfile }>> {
    return apiClient.put('/auth/profile', payload);
  }

  /**
   * POST /auth/change-password revokes every existing token and returns a fresh
   * one, so the caller MUST store the returned token or the member is logged out.
   */
  async changePassword(
    payload: ChangePasswordPayload
  ): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/auth/change-password', payload);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<{ user: User }>> {
    const formData = new FormData();

    // Convert UpdateProfileRequest to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return apiClient.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * The member's own API tokens — the closest thing this app has to "active
   * sessions". Revoking one signs that client out on its next request.
   */
  async getSessions(): Promise<ApiResponse<{ sessions: AuthSession[] }>> {
    return apiClient.get('/auth/sessions');
  }

  async revokeSession(id: number): Promise<ApiResponse<Record<string, never>>> {
    return apiClient.delete(`/auth/sessions/${id}`);
  }

  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get('/notifications/preferences');
  }

  async updatePreferences(
    data: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.put('/notifications/preferences', data);
  }

  async deleteAccount(
    password: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/delete-account', { password, reason });
  }

  async enable2FA(): Promise<
    ApiResponse<{
      qr_code: string;
      secret: string;
      backup_codes: string[];
    }>
  > {
    return apiClient.post('/users/enable-2fa', {});
  }
}

export const authService = new AuthService();
export const userService = new UserService();
