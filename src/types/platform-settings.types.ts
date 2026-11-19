export type FeatureKey =
  | 'catalogue'
  | 'subscriptions'
  | 'wallet'
  | 'birthdays'
  | 'network'
  | 'content'
  | 'rankings'
  | 'referrals'
  | 'messages'
  | 'opportunities';

export interface FeatureFlag {
  key: FeatureKey;
  label: string;
  description: string;
  group: string;
  path: string | null;
  enabled: boolean;
  /** Whether an active subscription plan also controls this feature. */
  plan_gated: boolean;
}

/**
 * Why a feature the member cannot use is unavailable.
 *
 * `disabled` — an administrator switched it off platform-wide.
 * `plan` — the member has no plan, or their plan does not include it.
 */
export type FeatureUnavailableReason = 'plan' | 'disabled';

/** Display metadata for one plan-gated feature key. */
export interface FeatureCatalogueEntry {
  key: FeatureKey;
  label: string;
  description: string;
  group: string;
  path: string | null;
  /** Whether the feature is gated behind a subscription plan. */
  plan_gated: boolean;
}

/** The member's active plan entitlement, as returned by `/v1/features`. */
export interface MemberPlanEntitlement {
  has_active_subscription: boolean;
  id: number | null;
  name: string | null;
  slug: string | null;
  price: number | null;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
  payment_status: string | null;
  auto_renew: boolean | null;
  /** Plan-gated feature keys the plan includes, in registry order. */
  features: FeatureKey[];
}

export interface BirthdayEligibilityRule {
  /** Physical gift threshold, in paid subscription months. */
  min_subscription_months: number;
  /** Whether Titans below the threshold are included as shoutout-only. */
  titan_shoutout_enabled: boolean;
}

export interface BirthdayNotificationSettings {
  /** Send a reminder ahead of the birthday. */
  reminders_enabled: boolean;
  /** How many days before the birthday the reminder goes out (1-30). */
  reminder_days_before: number;
  /**
   * The full advance-reminder schedule, in days before the birthday. The
   * backend defaults to 7 / 3 / 1 plus day-of and folds in `reminder_days_before`
   * as well, so the two never drift apart.
   */
  reminder_days_before_list?: number[];
  /** Send a wish on the birthday itself. */
  wishes_enabled: boolean;
  /** Tell every member about the day's celebrants, not only the celebrant. */
  community_enabled: boolean;
  /** Email channel for birthday messages. */
  email_enabled: boolean;
  /** Device push channel for birthday messages. */
  push_enabled: boolean;
  /** Send administrators a daily digest when something needs attention. */
  admin_digest_enabled: boolean;
  /** Send the separate monthly calendar reminder on the 25th. */
  monthly_reminder_enabled: boolean;
  /** Hour of the day (0-23, server time) at which messages go out. */
  send_hour: number;
}

/**
 * Public support and social details.
 *
 * These are administrator-managed and read by the footer, the support and
 * about pages and the error screens, so they are deliberately public. Every
 * field is a string: the backend resolves blanks and the WhatsApp fallback
 * before returning them, so the client never has to guess.
 */
export interface SiteContact {
  support_email: string;
  support_phone: string;
  /** Falls back to `support_phone` on the server when not set separately. */
  whatsapp_number: string;
  location: string;
  facebook_url: string;
  twitter_url: string;
  linkedin_url: string;
  instagram_url: string;
}

/**
 * Rendered before the public request resolves (and when it fails).
 *
 * Mirroring the backend defaults keeps the first paint honest instead of
 * showing empty links; the fetch replaces them with whatever the admin saved.
 */
export const DEFAULT_SITE_CONTACT: SiteContact = {
  support_email: 'support@ascendingtitans.com',
  support_phone: '+234 700 000 0000',
  whatsapp_number: '+234 700 000 0000',
  location: 'Lagos, Nigeria',
  facebook_url: 'https://facebook.com/remonode',
  twitter_url: 'https://twitter.com/remonode',
  linkedin_url: 'https://linkedin.com/company/remonode',
  instagram_url: 'https://instagram.com/remonode',
};

export interface AdminPlatformSettings {
  features: FeatureFlag[];
  default_landing_page?: string;
  birthday_eligibility: BirthdayEligibilityRule;
  birthday_notifications: BirthdayNotificationSettings;
  contact?: SiteContact;
}

export interface FeatureMapResponse {
  features: Record<string, boolean>;
  /**
   * The reason each unavailable feature is unavailable. Absent on older
   * backends; treat a missing entry as "unavailable for an unknown reason".
   */
  unavailable?: Record<string, FeatureUnavailableReason>;
  /** The member's plan entitlement, used by the billing page. */
  plan?: MemberPlanEntitlement;
  /** Labels and grouping for every plan-gated feature key. */
  catalogue?: FeatureCatalogueEntry[];
  /**
   * The administrator-configured default landing page for the member
   * dashboard (e.g. `/dashboard/birthdays`), resolved against this member.
   * `/dashboard` when nothing (valid) is configured.
   */
  default_landing_page?: string;
}
