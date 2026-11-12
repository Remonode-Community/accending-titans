/**
 * Referral System Type Definitions
 * Based on the backend API responses from ReferralController
 */

// ============= REFERRAL PROGRAM =============

export interface ReferralProgram {
  id: number;
  name: string;
  url: string;
  lifetime_minutes: number;
  created_at: string;
  updated_at: string;
}

// ============= REFERRAL LINK =============

export interface ReferralLink {
  code: string;
  link: string;
  program: string;
  created_at: string;
}

export interface ReferralLinkFull {
  id: number;
  user_id: number;
  referral_program_id: number;
  code: string;
  created_at: string;
  updated_at: string;
  link: string;
}

export interface AdminReferralLink {
  code: string;
  link: string;
  program: string;
  referrals: AdminReferredUser[];
}

export interface AdminReferredUser {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
}

// ============= REFERRAL STATISTICS =============

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  pending_rewards: number;
  available_balance: number;
}

// ============= ADMIN REFERRAL LIST =============

export interface AdminReferralItem {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  program: string;
  code: string;
  link: string;
  referrals_count: number;
  referrals: Array<{
    user: {
      id: number;
      name: string | null;
      email: string;
    };
    referred_at: string;
  }>;
}

// ============= SINGLE USER REFERRAL DATA (Admin) =============

export interface UserReferralData {
  id: number;
  name: string | null;
  email: string;
  referralLinks: AdminReferralLink[];
  authReferralLink: string | null;
}

// ============= POINTS CONVERSION =============

export interface PointsConversion {
  converted_amount: number;
}

// ============= REFERRED USERS (New Paginated Endpoint) =============

export interface ReferredUserDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  referred_at: string;
}

export interface ReferredUsersPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ReferredUsersData {
  referred_users: ReferredUserDetail[];
  pagination: ReferredUsersPagination;
}

export interface ReferredUsersResponse {
  success: boolean;
  message: string;
  data: ReferredUsersData;
}

// ============= API RESPONSE WRAPPERS =============

export interface ReferralApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: number;
}

export interface AdminReferralListResponse {
  success: boolean;
  message: string;
  data: {
    referrals: AdminReferralItem[];
  };
}
