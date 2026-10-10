// Phone number validation regex (E.164 format or local format like 08XXXXXXXXX)
export const E164_PHONE_REGEX = /^(\+[1-9]\d{1,14}|0[0-9]{10})$/;

// Currency formatting
export const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
};

// Transaction statuses
export const TRANSACTION_STATUSES = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  success: { label: 'Success', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
} as const;

// Transaction types
//
// `airtime` and `data` were removed with the VTU feature. `wallet_topup` is a
// wallet funding, not a virtual top-up, and is kept.
export const TRANSACTION_TYPES = {
  bills: { label: 'Bill Payment', icon: 'FileText' },
  wallet_topup: { label: 'Wallet Top-up', icon: 'Plus' },
  wallet_withdrawal: { label: 'Withdrawal', icon: 'Minus' },
} as const;

// Commission tiers
export const COMMISSION_TIERS = {
  bronze: { label: 'Bronze', rate: 1.0 },
  silver: { label: 'Silver', rate: 1.5 },
  gold: { label: 'Gold', rate: 2.0 },
  platinum: { label: 'Platinum', rate: 2.5 },
} as const;

// Page sizes
export const PAGE_SIZES = [10, 20, 50, 100];

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    verifyEmail: '/auth/verify-email',
  },
  users: {
    profile: '/users/profile',
    preferences: '/users/preferences',
    changePassword: '/users/change-password',
  },
  transactions: {
    list: '/transactions',
    detail: (id: string) => `/transactions/${id}`,
    payBills: '/transactions/bills/pay',
    receipt: (id: string) => `/transactions/${id}/receipt`,
  },
  wallet: {
    balance: '/wallet/balance',
    transactions: '/wallet/transactions',
  },
  payments: {
    initialize: '/payments/initialize',
    verify: '/payments/verify',
  },
  providers: {
    list: '/providers',
    plans: (provider: string) => `/providers/${provider}/plans`,
  },
} as const;
