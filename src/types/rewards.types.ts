/**
 * Reward System Type Definitions
 */

import { TransactionStatus } from './api.types';

// Transaction Types
export type RewardTransactionType =
  | 'cashback'
  | 'bonus'
  | 'streak'
  | 'referral'
  | 'first_transaction'
  | 'redemption';

// TransactionStatus is imported from api.types for consistency

// Loyalty Tiers
export type LoyaltyTierLevel = 0 | 1 | 2 | 3;
export type LoyaltyTierName = 'None' | 'Bronze' | 'Silver' | 'Gold';

// Campaign Types
export type CampaignType = 'cashback' | 'bonus' | 'streak';
export type CampaignStatus = 'active' | 'paused' | 'expired';

// Abuse Flag Types
export type AbuseFlagType =
  | 'duplicate_phone'
  | 'duplicate_device'
  | 'suspicious_funding'
  | 'self_referral'
  | 'reward_farming';

export type AbuseSeverity = 'low' | 'medium' | 'high';
export type ReferralStatus = 'pending' | 'eligible' | 'paid';

// ============= REWARD WALLET & BALANCE =============

export interface RewardBalance {
  balance: number;
  locked_balance: number;
  available_balance: number;
  currency: string;
}

// ============= REWARD TRANSACTIONS =============

export interface RewardTransaction {
  id: number;
  type: RewardTransactionType;
  amount: number;
  reference_id: string;
  reference_type: string;
  status: TransactionStatus;
  reason: string;
  created_at: string;
}

export interface RewardTransactionResponse {
  success: boolean;
  data: RewardTransaction[];
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// ============= CAMPAIGNS =============

export interface Campaign {
  id: number;
  name: string;
  type: CampaignType;
  description: string | null;
  reward_amount: number | null;
  reward_percentage: number | null;
  start_date: string;
  end_date: string;
  reward_for_you: number;
  status?: CampaignStatus;
  tier_level_required?: number;
  conditions?: {
    min_transactions: number;
    min_funding: number;
    max_volume?: number;
    min_days_active?: number;
    exclude_flagged?: boolean;
  };
  created_by?: number;
  created_at?: string;
  issued_count?: number;
  beneficiaries?: number;
  average_reward?: number;
  days_remaining?: number;
}

export interface RedemptionResponse {
  success: boolean;
  data: {
    message: string;
    amount: number;
    new_balance: number;
  };
}

// ============= ELIGIBILITY CHECK =============

export interface EligibilityCheck {
  email_verified: boolean;
  phone_verified: boolean;
  minimum_wallet_funding_100: boolean;
  minimum_transactions_1: boolean;
  no_abuse_flags: boolean;
  high_severity_flags: boolean;
  eligible_for_rewards: boolean;
  eligibility_messages: string[];
}

// ============= STATISTICS =============

export interface RewardStatistics {
  total_earned: number;
  total_redeemed: number;
  current_balance: number;
}

// ============= LOYALTY TIERS =============

export interface LoyaltyTier {
  id: number;
  name: LoyaltyTierName;
  level: LoyaltyTierLevel;
  requirements?: {
    min_transactions: number;
    min_volume: number;
    min_funding: number;
    min_days_active: number;
  };
  multipliers: {
    cashback: number;
    referral: number;
    bonus: number;
  };
  benefits: string[];
}

export interface CurrentTier {
  current_tier: LoyaltyTier;
  progress_to_next: {
    next_tier_name: string;
    next_tier_level: number;
    transaction_progress: string;
    volume_progress: string;
    funding_progress: string;
    days_active_progress: string;
  };
  current_metrics: {
    transactions: number;
    total_volume: number;
    total_funding: number;
    days_active: number;
  };
  benefits: {
    cashback_multiplier: number;
    referral_multiplier: number;
    bonus_multiplier: number;
  };
}

// ============= TRANSACTION STREAKS =============

export interface TransactionStreak {
  current_count: number;
  best_count: number;
  started_at: string;
  last_transaction_at: string;
}

export interface StreakData {
  daily_streak: TransactionStreak;
  weekly_streak: TransactionStreak;
}

// ============= REFERRAL SYSTEM =============

export interface ReferralMilestone {
  referral_link_id: number;
  referred_user: {
    id: number;
    name: string;
    email: string;
  };
  progress_percentage: number;
  milestones: {
    email_verified: {
      completed: boolean;
      completed_at: string | null;
    };
    phone_verified: {
      completed: boolean;
      completed_at: string | null;
    };
    wallet_funded_100: {
      completed: boolean;
      completed_at: string | null;
    };
    first_transaction: {
      completed: boolean;
      completed_at: string | null;
    };
  };
  is_fully_qualified: boolean;
  payout_earned: number;
  payout_paid_at: string | null;
  status: ReferralStatus;
}

export interface PayoutStatus {
  total_earned: number;
  total_pending: number;
  total_paid: number;
  referrals_qualified: number;
  referrals_pending: number;
  last_payout_date: string | null;
}

// ============= ADMIN TYPES =============

export interface RewardDashboard {
  total_issued: number;
  total_redeemed: number;
  pending_rewards: number;
  outstanding_liability: number;
  total_transactions: number;
  unique_beneficiaries: number;
}

export interface AdminRewardTransaction {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  type: RewardTransactionType;
  amount: number;
  status: TransactionStatus;
  reference_id: string;
  reference_type: string;
  reason: string;
  created_at: string;
}

export interface UserRewardDetails {
  user: {
    id: number;
    name: string;
    email: string;
  };
  reward_wallet: RewardBalance;
  statistics: RewardStatistics;
  recent_transactions: RewardTransaction[];
}

export interface ManualRewardResponse {
  id: number;
  user_id: number;
  amount: number;
  type: RewardTransactionType;
  status: TransactionStatus;
  created_at: string;
}

// ============= ABUSE FLAGS =============

export interface AbuseFlag {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  flag_type: AbuseFlagType;
  severity: AbuseSeverity;
  metadata: Record<string, any>;
  flagged_by: string;
  created_at: string;
  resolved_at: string | null;
}

export interface UserAbuseFlagsSummary {
  user: {
    id: number;
    name: string;
    email: string;
  };
  summary: {
    total_flags: number;
    unresolved_flags: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
  };
  flags: Array<{
    id: number;
    flag_type: AbuseFlagType;
    severity: AbuseSeverity;
    created_at: string;
    resolved_at: string | null;
  }>;
}

// ============= LOYALTY MANAGEMENT ADMIN =============

export interface LoyaltyDashboard {
  users_per_tier: Array<{ tier: string; user_count: number; average_multiplier: number }>;
  average_metrics: {
    transactions: number;
    volume: number;
    funding: number;
  };
  total_users_with_progress: number;
}

export interface AdminLoyaltyUser {
  id: number;
  name: string;
  email: string;
  tier: LoyaltyTierName;
  tier_level: LoyaltyTierLevel;
  transaction_count: number;
  total_volume: number;
  total_funding: number;
  days_active: number;
  last_upgraded_at: string;
}

export interface AdminLoyaltyProgress {
  user: {
    id: number;
    name: string;
    email: string;
  };
  current_tier: {
    id: number;
    name: LoyaltyTierName;
    level: LoyaltyTierLevel;
  };
  progress: {
    transaction_count: number;
    total_volume: number;
    total_funding: number;
    days_active: number;
  };
  next_tier_progress: {
    next_tier: LoyaltyTierName;
    transactions_needed: number;
    volume_needed: number;
    funding_needed: number;
    days_needed: number;
  };
}

// ============= REFERRAL ADMIN =============

export interface ReferralDashboard {
  total_referrals: number;
  qualified_for_payout: number;
  payout_pending: number;
  payout_completed: number;
  total_amount_pending: number;
  total_amount_paid: number;
  pending_payout: number;
  completed_payouts: number;
  total_paid_out: number;
  outstanding_balance: number;
  average_referral_value: number;
  referrals_by_status: {
    pending_milestone: number;
    ready_for_payout: number;
    completed: number;
  };
  milestone_completion_rates: {
    email_verified: number;
    phone_verified: number;
    wallet_funded: number;
    first_transaction: number;
  };
}

export interface AdminReferralMilestone {
  id: number;
  referral_link_id: number;
  referred_user: {
    id: number;
    name: string;
    email: string;
  };
  referrer: {
    id: number;
    name: string;
    email: string;
  };
  progress_percentage: number;
  payout_earned: number;
  status: ReferralStatus;
  payout_paid_at: string | null;
}

// ============= ANALYTICS METRICS =============

export interface TransactionMetric {
  date: string;
  count: number;
  total_amount: number;
}

export interface TransactionGrowthMetrics {
  period: string;
  days: number;
  data: TransactionMetric[];
}

export interface RewardImpactMetrics {
  period_days: number;
  transactions_with_rewards: number;
  total_transactions: number;
  active_users: number;
  average_transaction_value: number;
  average_reward_value: number;
  reward_coverage_percentage: number;
}

export interface CashbackLiability {
  total_cashback_issued: number;
  total_cashback_redeemed: number;
  outstanding_liability: number;
  users_with_balance: number;
  average_liability_per_user: number;
}

export interface RewardDistribution {
  type: RewardTransactionType;
  count: number;
  total_amount: number;
}

export interface TopRewardedUser {
  user_id: number;
  reward_count: number;
  total_rewards: number;
}

export interface ConversionFunnel {
  registered_users: number;
  email_verified: number;
  phone_verified: number;
  wallet_funded: number;
  first_transaction: number;
  reward_earned: number;
  conversion_rates: {
    registration_to_email: number;
    email_to_phone: number;
    phone_to_funding: number;
    funding_to_transaction: number;
    transaction_to_reward: number;
  };
}

// ============= API RESPONSE TYPES =============
// Moved to api.types.ts for centralization

