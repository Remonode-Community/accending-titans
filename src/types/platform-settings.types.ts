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
  /** Send a wish on the birthday itself. */
  wishes_enabled: boolean;
  /** Email channel for birthday messages. */
  email_enabled: boolean;
  /** Device push channel for birthday messages. */
  push_enabled: boolean;
  /** Send administrators a daily digest when something needs attention. */
  admin_digest_enabled: boolean;
  /** Hour of the day (0-23, server time) at which messages go out. */
  send_hour: number;
}

export interface AdminPlatformSettings {
  features: FeatureFlag[];
  birthday_eligibility: BirthdayEligibilityRule;
  birthday_notifications: BirthdayNotificationSettings;
}

export interface FeatureMapResponse {
  features: Record<string, boolean>;
}
