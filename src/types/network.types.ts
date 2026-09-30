/* ──────────────────────────────────────────────
 * Member network types.
 *
 * The shapes here mirror the API exactly. Two conventions are worth stating up
 * front, because both are load-bearing and easy to break:
 *
 * 1. NO `whatsapp` FIELD APPEARS IN ANY LIST TYPE. A member's contact number is
 *    only ever present on `AskContact`, and only when `is_revealed` is true.
 *    If you find yourself wanting a number in a listing, you are building a
 *    phone-number extractor.
 *
 * 2. `score === 0` WITH EMPTY `reasons` MEANS "WIDENED", not "no match". The
 *    resolver tops up a short page with recent members rather than showing an
 *    empty state, and marks the page `resolution.is_widened`. Those rows must
 *    never be labelled as matches.
 * ────────────────────────────────────────────── */

export type NetworkCircleKey = 'trade' | 'local' | 'cohort' | 'tenure' | 'nearby';

export type MatchResolutionStep = 'scored' | 'newest' | 'empty';

export interface NetworkMember {
  user_id: number;
  name: string;
  profile_photo_url: string | null;
  business_name: string | null;
  business_category: string | null;
  city: string | null;
  rank: string | null;
  /** 0–100. Below the threshold means this row came from the widened fallback. */
  score: number;
  /** Human-readable justifications, e.g. ["same trade", "same city"]. */
  reasons: string[];
  /**
   * Always false in listings. Present so the interface can never render a
   * number that the server withheld.
   */
  whatsapp_shared: boolean;
}

export interface NetworkCircle {
  key: NetworkCircleKey;
  label: string;
  description: string;
  count: number;
}

export interface NetworkResolution {
  step: MatchResolutionStep;
  is_widened: boolean;
  threshold: number;
}

export interface MemberSignals {
  category_code: string | null;
  city: string | null;
  cohort_key: string | null;
  tenure_band: number | null;
  /** Drives the "add your trade to get better matches" prompt. */
  has_trade: boolean;
  has_city: boolean;
}

export interface CirclesResponse {
  circles: NetworkCircle[];
  members: NetworkMember[];
  resolution: NetworkResolution;
  your_signals: MemberSignals;
  /** False for non-subscribers: they may read but not post. */
  can_post: boolean;
}

export interface NetworkPreferences {
  is_discoverable: boolean;
  share_whatsapp: boolean;
  notify_on_match: boolean;
}

export interface UpdatePreferencesRequest {
  is_discoverable?: boolean;
  share_whatsapp?: boolean;
  notify_on_match?: boolean;
}

/* ──────────────────────────────────────────────
 * Asks
 * ────────────────────────────────────────────── */

export type AskKind = 'need' | 'offer';

export type AskStatus = 'open' | 'claimed' | 'fulfilled' | 'cancelled' | 'expired';

export interface AskContact {
  is_revealed: boolean;
  /** Null unless `is_revealed`. Never assume presence. */
  whatsapp: string | null;
}

export interface AskActor {
  user_id: number;
  name: string;
  profile_photo_url: string | null;
  business_name?: string | null;
}

export interface Ask {
  id: number;
  kind: AskKind;
  title: string;
  description: string;
  category_code: string | null;
  city: string | null;
  /** Free text. Never a number — the platform moves no money here. */
  budget_note: string | null;
  status: AskStatus;
  expires_at: string | null;
  created_at: string;
  asker: AskActor | null;
  claimed_by: AskActor | null;
  contact: AskContact;
  viewer_can_claim: boolean;
  viewer_can_fulfil: boolean;
  viewer_can_cancel: boolean;
  viewer_can_withdraw: boolean;
  is_own: boolean;
  /* Detail view only. */
  match_scope?: Record<string, unknown> | null;
  claimed_at?: string | null;
  fulfilled_at?: string | null;
}

export interface AskPrompt {
  title: string;
  prompt: string;
  reason: string;
}

export interface AskBoardResponse {
  board: Ask[];
  my_asks: Ask[];
  my_claims: Ask[];
  can_post: boolean;
  prompts: AskPrompt[];
  open_near_you: number;
}

export interface CreateAskRequest {
  kind: AskKind;
  title: string;
  description: string;
  budget_note?: string | null;
}

/* ──────────────────────────────────────────────
 * Impact — the renewal-screen payload
 * ────────────────────────────────────────────── */

export interface ImpactEntry {
  direction: 'helped' | 'helped_by';
  member_name: string;
  ask_title: string | null;
  created_at: string | null;
}

export interface ImpactResponse {
  helped_count: number;
  helped_by_count: number;
  recent: ImpactEntry[];
}

/* ──────────────────────────────────────────────
 * Safety
 * ────────────────────────────────────────────── */

export interface BlockEntry {
  user_id: number;
  name: string;
  profile_photo_url: string | null;
  created_at: string;
}

export interface MyReport {
  id: number;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

/* ──────────────────────────────────────────────
 * Admin moderation
 * ────────────────────────────────────────────── */

export interface AdminAskRow {
  id: number;
  kind: AskKind;
  title: string;
  description: string;
  status: AskStatus;
  category_code: string | null;
  city: string | null;
  budget_note: string | null;
  asker: { user_id: number; name: string; email: string } | null;
  claimer: { user_id: number; name: string } | null;
  report_count: number;
  created_at: string;
}

export interface AdminReportTarget {
  type: 'ask' | 'wish' | 'unknown';
  exists: boolean;
  id?: number;
  title?: string;
  description?: string;
  status?: AskStatus;
  asker_name?: string | null;
  message?: string;
  celebration_id?: number;
}

export interface AdminReportRow {
  id: number;
  reason: string;
  details: string | null;
  status: string;
  target: AdminReportTarget;
  reporter: { user_id: number; name: string; email: string } | null;
  created_at: string;
}

export interface NetworkOverview {
  asks: {
    open: number;
    claimed: number;
    fulfilled: number;
    cancelled: number;
    expired: number;
    total: number;
  };
  /** Of asks that reached a claimer, the share that completed. Null if none. */
  fulfilment_rate: number | null;
  reports: { pending: number };
  members: {
    discoverable: number;
    sharing_whatsapp: number;
    indexed: number;
    blocks: number;
  };
  edges: number;
}
