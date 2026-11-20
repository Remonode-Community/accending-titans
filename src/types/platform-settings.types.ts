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
  landing?: LandingContent;
}

/* ────────────────────────────────────────────
 * Landing page content
 * ──────────────────────────────────────────── */

/**
 * One frame of the landing-page hero carousel.
 *
 * `image_url` is whatever the administrator saved: a Cloudinary URL returned by
 * the upload endpoint, or any pasted CDN link. `service` is the short label the
 * slide promotes (it also titles the indicator for screen readers).
 */
export interface LandingHeroSlide {
  image_url: string;
  headline: string;
  subtext: string;
  service: string;
}

export interface LandingHero {
  /** The gold second line of the headline, e.g. "with Acceding Titans". */
  headline_accent: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  slides: LandingHeroSlide[];
}

/**
 * A business shown in the "Businesses That Use …" strip.
 *
 * `logo` may be blank: the card then draws the gradient with `initials`.
 * `website` is normalised to an absolute https URL by the API.
 */
export interface ShowcaseBusiness {
  /** Present on responses; the admin editor keys rows by index instead. */
  id?: number;
  name: string;
  website: string;
  logo: string;
  /** Tailwind gradient utilities, e.g. "from-violet-600 to-indigo-600". */
  gradient: string;
  initials: string;
  rating: number;
  industry: string;
}

export interface LandingShowcase {
  heading_prefix: string;
  heading_accent: string;
  subheading: string;
  businesses: ShowcaseBusiness[];
}

export interface LandingContent {
  hero: LandingHero;
  showcase: LandingShowcase;
}

/**
 * Rendered before the public request resolves, and by the admin screen before
 * its payload arrives. Mirrors the backend defaults, so an installation that
 * never opened the settings screen looks and behaves exactly as before.
 */
export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    headline_accent: 'with Acceding Titans',
    primary_cta_label: 'Get Started Free',
    secondary_cta_label: 'Explore Services',
    slides: [
      {
        image_url:
          'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1920&q=90',
        headline: 'Showcase Your Business',
        subtext:
          'Display your products and services to thousands of engaged entrepreneurs and grow your sales',
        service: 'Business Catalogue',
      },
      {
        image_url:
          'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1920&q=90',
        headline: 'Network & Collaborate',
        subtext:
          'Connect with like-minded business owners, find partners, and unlock unlimited opportunities',
        service: 'Community Networking',
      },
      {
        image_url:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=90',
        headline: 'Promote Your Services',
        subtext:
          'Reach thousands of members with targeted advertising through text, images, and video content',
        service: 'Advertising Platform',
      },
      {
        image_url:
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=90',
        headline: 'Find Jobs & Opportunities',
        subtext:
          'Post gigs, find skilled professionals, and discover new business opportunities in your network',
        service: 'Job Opportunities',
      },
    ],
  },
  showcase: {
    heading_prefix: 'Businesses That Use',
    heading_accent: 'Acceding Titans',
    subheading:
      'Join hundreds of forward-thinking companies already growing their reach on our platform',
    businesses: [
      {
        name: 'Remonode',
        website: 'https://remonode.com',
        logo: 'https://api.remopay.remonode.com/remonode.jpg',
        gradient: 'from-violet-600 to-indigo-600',
        initials: 'RM',
        rating: 5.0,
        industry: 'Technology',
      },
      {
        name: 'Remopay',
        website: 'https://remopay.remonode.com',
        logo: 'https://api.remopay.remonode.com/remopay.png',
        gradient: 'from-emerald-500 to-teal-600',
        initials: 'RE',
        rating: 5.0,
        industry: 'Finance',
      },
      {
        name: 'Remonyx',
        website: 'https://bluewavedigital.ng',
        logo: 'https://api.remopay.remonode.com/remonyx.png',
        gradient: 'from-sky-500 to-blue-600',
        initials: 'BD',
        rating: 4.7,
        industry: 'Telcom',
      },
      {
        name: 'AFRIDataNG',
        website: 'https://afridata-cta.vercel.app',
        logo: 'https://api.remopay.remonode.com/AFRIDataNG.png',
        gradient: 'from-white to-white',
        initials: 'PB',
        rating: 4.6,
        industry: 'Telcom',
      },
      {
        name: 'MassAxis',
        website: 'https://massaxis.com',
        logo: 'https://api.remopay.remonode.com/massaxis.jpg',
        gradient: 'from-rose-500 to-pink-600',
        initials: 'AC',
        rating: 4.5,
        industry: 'Food & Beverage',
      },
      {
        name: 'LuxuryX',
        website: 'https://luxuryxtech.org.ng/',
        logo: 'https://api.remopay.remonode.com/luxuryx.png',
        gradient: 'from-red-500 to-rose-600',
        initials: 'LU',
        rating: 4.8,
        industry: 'Blockchain',
      },
      {
        name: 'feMOJ World',
        website: 'https://luxuryxtech.org.ng/',
        logo: 'https://api.remopay.remonode.com/femoj_world.png',
        gradient: 'from-red-500 to-rose-600',
        initials: 'FW',
        rating: 4.8,
        industry: 'E-Commerce',
      },
    ],
  },
};

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
