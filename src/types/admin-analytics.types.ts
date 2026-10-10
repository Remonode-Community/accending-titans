/* ──────────────────────────────────────────────
 * Admin + user analytics types.
 *
 * REPLACES `@/types/vtu.types`, which has been deleted.
 *
 * Acceding Titans is not a virtual-top-up application. The removed file held
 * two unrelated groups of types: the VTU catalogue, purchase and per-product
 * statistics — all gone — and the platform analytics payloads used by
 * `/admin/analytics` and the admin service, which are preserved here.
 *
 * Shapes are reproduced VERBATIM from the deleted file. Several were guessed
 * wrong on a first pass (AdminWalletStats has exactly two fields, not six;
 * AdminPerformanceStats has four, not six), and an analytics type that does not
 * match the payload is worse than no type at all, because it silences the
 * compiler while the page renders `undefined`.
 *
 * One deliberate change: `CombinedUserStatistics` loses its `vtu` member,
 * because `UserVtuStatistics` is one of the deleted types.
 * ────────────────────────────────────────────── */

/* ── Admin analytics ───────────────────────────────────────────── */

export interface AdminWalletStats {
  total_balance: number;
  transactions: Array<{
    type: string;
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface AdminUserStats {
  total: number;
  new: number;
  verified: number;
}

export interface AdminPerformanceStats {
  success_rate: number;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
}

export interface AdminStatisticsData {
  period: 'week' | 'month' | 'year';
  start_date: string;
  end_date: string;
  users: AdminUserStats;
  wallet: AdminWalletStats;
  performance: AdminPerformanceStats;
}

/* ── User analytics ────────────────────────────────────────────── */

export interface UserWalletTransaction {
  type: string;
  status: string;
  count: number;
  amount: number;
}

export interface UserWalletStatistics {
  period: 'week' | 'month' | 'year';
  start_date: string;
  end_date: string;
  current_balance: string;
  credits: {
    count: number;
    amount: number;
  };
  debits: {
    count: number;
    amount: number;
  };
}

export interface UserProfileInfo {
  name: string;
  email: string;
  phone: string;
  joined_date: string;
}

export interface UserStatistics {
  total_transactions: number;
  wallet_balance: string;
  total_spent: number;
  account_age_days: number;
  verification_status: boolean;
  user_info: UserProfileInfo;
}

/**
 * Formerly carried a `vtu: UserVtuStatistics` member. That type is gone, so the
 * combined view is now wallet + user only.
 */
export interface CombinedUserStatistics {
  wallet: UserWalletStatistics;
  user: UserStatistics;
}
