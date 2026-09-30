/**
 * Birthday Types
 *
 * Two distinct systems share this file:
 *
 *  1. The platform loyalty scheme (BirthdayReward etc.) where an admin assigns
 *     a gift from a member's portfolio after 8+ subscription months. Pre-existing.
 *
 *  2. Network celebrations (below), where a member's network comes together to
 *     celebrate them and secretly plan a surprise.
 *
 * The two systems share proximity data with the member network, but they do NOT
 * share a definition of permission: a birthday surprise stays open to any
 * verified member, while the member network's circles are much narrower.
 */

import type { NetworkMember } from '@/types/network.types';

/* ──────────────────────────────────────────────
 * Network celebrations
 * ────────────────────────────────────────────── */

/**
 * Lifecycle of the countdown. The server computes this; the client only
 * re-derives the ticking numbers from next_month_day, because the server does
 * not send a full date (that would publish the birth year).
 */
export type BirthdayCountdownState =
  | 'not_set'
  | 'far'
  | 'near'
  | 'approaching'
  | 'tomorrow'
  | 'today';

export interface BirthdayCountdown {
  state: BirthdayCountdownState;
  days: number | null;
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  /** "m-d" only. Never a year — the birth year must not leave the server. */
  next_month_day: string | null;
  is_today: boolean;
}

export interface BirthdayPerson {
  id: number | null;
  name: string;
  profile_photo_url: string | null;
  rank: string | null;
}

/** The celebrant as seen on their celebration page. */
export interface BirthdayCelebrant {
  id: number;
  name: string;
  profile_photo_url: string | null;
  rank: string | null;
  business_name?: string | null;
  business_category?: string | null;
  /** Month and day only, e.g. "October 10". */
  birthday_month_day: string | null;
  /** Free text the celebrant wrote for the network. */
  preferences_note: string | null;
}

export interface BirthdayWish {
  id: number;
  message: string;
  author: BirthdayPerson;
  created_at: string | null;
  is_mine: boolean;
}

export interface BirthdaySuggestion {
  id: number;
  title: string;
  description: string | null;
  estimated_cost: number | null;
  suggested_by: BirthdayPerson;
  votes_count: number;
  viewer_has_voted: boolean;
}

export type BirthdayActivityType =
  | 'dinner'
  | 'surprise_party'
  | 'group_call'
  | 'outing'
  | 'group_contribution'
  | 'digital_gift'
  | 'other';

export type BirthdayActivityStatus = 'proposed' | 'confirmed' | 'declined' | 'done';

export interface BirthdayActivity {
  id: number;
  title: string;
  description: string | null;
  activity_type: BirthdayActivityType;
  proposed_at: string | null;
  status: BirthdayActivityStatus;
  created_by: BirthdayPerson;
}

export interface BirthdayContribution {
  id: number;
  amount: number;
  note: string | null;
  contributor: BirthdayPerson;
}

export interface BirthdayContributions {
  total_pledged: number;
  contributor_count: number;
  items: BirthdayContribution[];
}

/**
 * Planning data. Network-only.
 *
 * The server omits this key entirely for the celebrant, so `planning` being
 * undefined is a guarantee, not a rendering decision. See
 * BirthdayCelebrationPolicy.
 */
export interface BirthdayPlanning {
  suggestions: BirthdaySuggestion[];
  leading_suggestion_id: number | null;
  total_votes: number;
  activities: BirthdayActivity[];
  contributions: BirthdayContributions;
  revealed: boolean;
  planning_locked: boolean;
}

/** Shown to the celebrant once the network has executed the surprise. */
export interface BirthdayRevealed {
  selected_suggestion: { title: string; description: string | null } | null;
  activities: BirthdayActivity[];
  total_pledged: number;
}

export type BirthdayViewerRole = 'celebrant' | 'network';

export interface BirthdayCelebrationPage {
  celebrant: BirthdayCelebrant;
  countdown: BirthdayCountdown;
  viewer_role: BirthdayViewerRole;
  is_planning_open: boolean;
  wishes?: BirthdayWish[];
  /** Network only. */
  planning?: BirthdayPlanning;
  /** Celebrant only, and only after the reveal. */
  revealed?: BirthdayRevealed;
  /**
   * Celebrant only, while the network is still planning. Carries no counts or
   * titles on purpose: "3 gift ideas" would itself be a spoiler.
   */
  surprise_in_progress?: boolean;
  /**
   * Network only, and only while planning is open: members most likely to be
   * organising this, drawn from the member network's circle resolution.
   *
   * This is a SUGGESTION, never a restriction. Access to planning is unaffected
   * and still open to any verified member — the server does not narrow
   * `viewPlanning` by proximity, and this field must not be used as though it
   * did. Absent for the celebrant: who is plotting is both unhelpful to them and
   * a hint that planning is organised.
   */
  likely_planners?: NetworkMember[];
}

export interface MyBirthdayProfile {
  is_enabled: boolean;
  preferences_note: string | null;
  has_date_of_birth: boolean;
  birthday_month_day: string | null;
}

export interface MyBirthday {
  profile: MyBirthdayProfile;
  countdown: BirthdayCountdown;
  celebration: {
    year: number;
    status: string;
    is_revealed: boolean;
    network_is_planning: boolean;
  } | null;
}

export interface NetworkBirthday {
  user_id: number;
  name: string;
  profile_photo_url: string | null;
  rank: string | null;
  birthday_month_day: string;
  countdown: BirthdayCountdown;
  is_celebrant: boolean;
  is_network: boolean;
  /**
   * How close this member is to the viewer, resolved by the member network.
   *
   * Informational only — it annotates the viewer's own inferred proximity and
   * grants nothing. `circle_keys` is empty and `score` is 0 when the viewer has
   * no matching signals, which is not an error.
   */
  connection: {
    circle_keys: string[];
    score: number;
  };
}

export interface UpdateMyBirthdayRequest {
  date_of_birth?: string | null;
  clear_date?: boolean;
  is_enabled?: boolean;
  preferences_note?: string | null;
}

export interface CreateSuggestionRequest {
  title: string;
  description?: string | null;
  estimated_cost?: number | null;
}

export interface CreateActivityRequest {
  title: string;
  description?: string | null;
  activity_type?: BirthdayActivityType;
  proposed_at?: string | null;
}

export interface CreateContributionRequest {
  amount: number;
  note?: string | null;
}

export interface RevealRequest {
  selected_suggestion_id?: number | null;
}

/* ──────────────────────────────────────────────
 * Admin moderation
 * ────────────────────────────────────────────── */

export interface AdminCelebration {
  id: number;
  year: number;
  status: 'planning' | 'active' | 'completed';
  is_revealed: boolean;
  revealed_at: string | null;
  celebrant: {
    id: number;
    name: string;
    email: string;
    profile_photo_url: string | null;
    rank: string | null;
  } | null;
  wishes_count: number;
  hidden_wishes_count: number;
}

/* ──────────────────────────────────────────────
 * Platform loyalty scheme (pre-existing)
 * ────────────────────────────────────────────── */

export interface BirthdayEligibility {
    date_of_birth: string | null;
    birthday_this_month: boolean;
    total_subscription_months: number;
    is_eligible_for_reward: boolean;
    is_shoutout_only: boolean;
    current_reward: BirthdayReward | null;
}

export interface BirthdayReward {
    id: number;
    reward_type: string;        // "physical_delivery" | "service" | "shoutout"
    status: string;             // "pending" | "processing" | "delivered" | "cancelled"
    is_shoutout_only: boolean;
    gift_provider?: {
      id: number;
      name: string;
    };
    gift_item?: {
      id: number;
      title: string;
      price: number | null;
    };
}

export interface UpcomingBirthday {
    user_id: number;
    name: string;
    profile_photo_url: string | null;
    /** Month and day only, e.g. "October 10". The year is never returned. */
    birthday_month_day: string;
    days_until_birthday: number;
    rank: string | null;
    total_subscription_months: number;
    business: {
      name: string;
      category: string;
    } | null;
}

export interface AdminBirthdayMember {
    id: number;
    user_id: number;
    name: string;
    email: string;
    birth_date: string;
    age: number;
    rank: string | null;
    total_subscription_months: number;
    is_eligible: boolean;
    is_shoutout_only: boolean;
    reward: BirthdayReward | null;
}

export interface AssignGiftRequest {
    user_id: number;
    gift_provider_user_id: number;
    gift_portfolio_item_id: number;
    reward_type: string;
}
