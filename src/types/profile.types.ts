/**
 * Contract for GET/PUT /api/v1/auth/profile and POST /api/v1/auth/change-password.
 *
 * Mirrors app/Http/Resources/ProfileResource.php on the backend. Keys are nested
 * (basicInfo / identityInfo / bankInfo) because that is the shape updateProfile
 * accepts, so GET and PUT round-trip without a translation layer.
 */

export interface ProfileBasicInfo {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  dob: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  business_name: string | null;
  whatsapp_number: string | null;
}

export interface ProfileIdentityInfo {
  nin: string | null;
  phone: string | null;
}

export interface ProfileBankInfo {
  account_number: string | null;
  account_name: string | null;
  bank_code: string | null;
  bank_name: string | null;
  bvn: string | null;
}

export interface ProfileMeta {
  membership_id: string | null;
  photo_url: string | null;
  is_titan_member: boolean;
  current_rank: string | null;
  is_profile_complete: boolean;
  email_verified_at: string | null;
  created_at: string | null;
}

export interface MemberProfile {
  basicInfo: ProfileBasicInfo;
  identityInfo: ProfileIdentityInfo;
  bankInfo: ProfileBankInfo;
  profile: ProfileMeta;
}

export interface SaveProfilePayload {
  basicInfo?: Partial<ProfileBasicInfo>;
  identityInfo?: Partial<ProfileIdentityInfo>;
  bankInfo?: Partial<ProfileBankInfo>;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Mirrors the notification_preferences table.
 * `enabled` is the master switch and `update_notifications` is stored but not
 * currently surfaced in the UI, so both are carried through untouched.
 */
export interface NotificationPreferences {
  enabled: boolean;
  transaction_notifications: boolean;
  system_notifications: boolean;
  promotion_notifications: boolean;
  update_notifications: boolean;
  alert_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

/** One of the member's own API tokens, presented as a signed-in session. */
export interface AuthSession {
  id: number;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
  is_current: boolean;
}

/** Mirrors the backend rule: 081XXXXXXXXX or +23481XXXXXXXXX. */
export const NIGERIAN_PHONE_RE = /^(0|\+234)[0-9]{10}$/;
