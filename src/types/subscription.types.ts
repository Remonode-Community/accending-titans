/**
 * Subscription Types
 * Based on Paystack Subscription API — Business & Birthdays Backend
 *
 * A plan's `features` are keys from `config/features.php` (for example
 * `network`, `birthdays`, `catalogue`). They are the entitlements that decide
 * which parts of the app a subscriber may use. Timing access is no longer part
 * of a plan.
 *
 * @see plans/business-birthdays-implementation-plan.md
 */

// ──────────────────────────────────────────────
// Subscription Plan
// ──────────────────────────────────────────────
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  duration_days: number;
  interval: string | null;
  currency: string | null;
  /** Registry keys this plan includes. */
  features: string[] | null;
}

// ──────────────────────────────────────────────
// Active Subscription
// ──────────────────────────────────────────────
export interface ActiveSubscription {
  id: number;
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  price: number;
  start_date: string;       // YYYY-MM-DD
  end_date: string;         // YYYY-MM-DD
  days_remaining: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  auto_renew: boolean;
  /** Registry keys this subscription's plan unlocks. */
  plan_features: string[];
  interval: string | null;
  currency: string | null;
  paystack_subscription_code: string | null;
  next_payment_date: string | null; // YYYY-MM-DD
}

// ──────────────────────────────────────────────
// Subscription History Item
// ──────────────────────────────────────────────
export interface SubscriptionHistoryItem {
  id: number;
  plan: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_status: string;
  is_active: boolean;
  created_at: string;
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────
export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

// ──────────────────────────────────────────────
// API Response Payloads
// ──────────────────────────────────────────────

export interface PlansResponse {
  plans: SubscriptionPlan[];
}

export interface InitializeSubscriptionResponse {
  authorization_url: string;
  reference: string;
  plan: {
    id: number;
    name: string;
    price: number;
  };
}

export interface VerifyAndCreateResponse {
  subscription: {
    id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    days_remaining: number;
    payment_status: string;
    auto_renew: boolean;
    paystack_subscription_code: string | null;
    next_payment_date: string | null;
  };
}

export interface MySubscriptionResponse {
  has_active_subscription: boolean;
  subscription: ActiveSubscription | null;
}

export interface HistoryResponse {
  subscriptions: SubscriptionHistoryItem[];
  pagination: PaginationInfo;
}

export interface EnableDisableResponse {
  subscription_id: number;
  paystack_status: string;
}

export interface ManageLinkResponse {
  link: string;
  subscription_code: string;
}

export interface CancelAutoRenewResponse {
  subscription_id: number;
  auto_renew: boolean;
}

// ──────────────────────────────────────────────
// Request Types
// ──────────────────────────────────────────────

export interface SubscriptionInitializeRequest {
  plan_id: number;
  authorization_code?: string;
}

export interface VerifyAndCreateRequest {
  reference: string;
  plan_id: number;
}

export interface EnableDisableRequest {
  subscription_code: string;
  email_token: string;
}

export interface HistoryQueryParams {
  page?: number;
  per_page?: number;
}

// ──────────────────────────────────────────────
// Admin Types
// ──────────────────────────────────────────────

export interface AdminSubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  duration_days: number;
  interval: string;
  currency: string;
  /** Registry keys this plan includes. */
  features: string[] | null;
  is_active: boolean;
  description?: string | null;
  send_invoices?: boolean;
  send_sms?: boolean;
  invoice_limit?: number;
  paystack_plan_code?: string | null;
  subscribers_count?: number;
  total_revenue?: number;
}

export interface CreatePlanRequest {
  name: string;
  slug: string;
  price: number;
  duration_days: number;
  interval?: string;
  currency?: string;
  description?: string;
  send_invoices?: boolean;
  send_sms?: boolean;
  invoice_limit?: number;
  features?: string[];
  is_active?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  slug?: string;
  price?: number;
  duration_days?: number;
  interval?: string;
  currency?: string;
  description?: string;
  send_invoices?: boolean;
  send_sms?: boolean;
  invoice_limit?: number;
  features?: string[];
  is_active?: boolean;
}

export interface AdminSubscriptionList {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  plan_name: string;
  price: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
  payment_status: string;
  auto_renew: boolean;
  created_at: string;
}
