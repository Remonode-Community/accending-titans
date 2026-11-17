/**
 * The unified birthday calendar: one shape for both halves.
 *
 * Two sources feed the calendar and they are never merged into one identity:
 *
 *  - `admin`  → administrator-managed rows (`calendar_events`): the owner's
 *               imported birthdays, the tentative get-together, the recurring
 *               25th reminder. No account behind them, so `user_id` is null.
 *  - `member` → a registered member's `users.dob`, read live server-side.
 *               Carries `user_id` so the profile can be opened when the
 *               viewer is allowed to.
 *
 * Rows are addressed as `admin:{id}` / `member:{id}` so the two id spaces can
 * never collide. Nothing here ever carries a birth year or an age — the
 * backend does not serialise one, and this client must not invent one.
 */

export type CalendarEventSource = 'admin' | 'member';

export type CalendarEventKind = 'birthday' | 'reminder' | 'event';

export type CalendarRecurrence = 'yearly' | 'monthly' | 'once';

/** One occurrence as the member-facing endpoints return it. */
export interface CalendarOccurrence {
  /** Namespaced: `admin:12`, `member:4`. */
  id: string;
  source: CalendarEventSource;
  kind: CalendarEventKind;
  title: string;
  name: string | null;
  description: string | null;
  /** Concrete occurrence date, `YYYY-MM-DD`. */
  date: string;
  /** `January 5` — pre-formatted for chips and rails. */
  month_day: string;
  /** Signed days from today; 0 = today, 1 = tomorrow, negative = past. */
  days_until: number;
  is_today: boolean;
  is_tentative: boolean;
  recurrence: CalendarRecurrence;
  /** Registered member only; null for managed rows. */
  user_id: number | null;
  profile_photo_url: string | null;
  rank: string | null;
  /** True when the row is the viewer's own birthday. */
  is_self: boolean;
  /** True when the viewer may open this member's profile. */
  can_view_profile: boolean;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  start: string;
  end: string;
  today: string;
  events: CalendarOccurrence[];
  counts: Record<CalendarEventKind, number>;
}

export interface CalendarUpcomingData {
  today: string;
  end: string;
  days: number;
  events: CalendarOccurrence[];
  counts: {
    today: number;
    tomorrow: number;
    week: number;
    later: number;
  };
}

// ── Administrator-managed entries ───────────────────────────────────────

/** One stored row as the admin list endpoint presents it. */
export interface AdminCalendarEvent {
  id: number;
  title: string;
  name: string | null;
  description: string | null;
  kind: CalendarEventKind;
  recurrence: CalendarRecurrence;
  month: number | null;
  day: number | null;
  event_date: string | null;
  is_tentative: boolean;
  is_active: boolean;
  source: CalendarEventSource | 'owner_import';
  visibility: 'public' | 'members';
  next_occurrence: string | null;
  days_until: number | null;
  created_at: string | null;
}

export interface AdminCalendarEventListData {
  events: AdminCalendarEvent[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CalendarEventPayload {
  title?: string;
  name?: string | null;
  description?: string | null;
  kind?: CalendarEventKind;
  recurrence?: CalendarRecurrence;
  month?: number | null;
  day?: number | null;
  event_date?: string | null;
  is_tentative?: boolean;
  is_active?: boolean;
  visibility?: 'public' | 'members';
}

/** A row as the loose-text parser reads it — before any validation. */
export interface ParsedCalendarRow {
  kind: CalendarEventKind;
  recurrence: CalendarRecurrence;
  month: number | null;
  day: number | null;
  title: string;
  name: string | null;
  description: string | null;
  is_tentative: boolean;
}

export interface CalendarPreviewData {
  rows: ParsedCalendarRow[];
  counts: Record<CalendarEventKind, number>;
}

export type ImportRowStatus = 'created' | 'updated' | 'unchanged' | 'reconciled' | 'invalid';

export interface CalendarImportRowResult {
  index: number;
  status: ImportRowStatus;
  title?: string;
  message?: string;
}

export interface CalendarImportReport {
  created: number;
  updated: number;
  unchanged: number;
  reconciled: number;
  invalid: number;
  rows: CalendarImportRowResult[];
}

export interface CalendarEventFilters {
  search?: string;
  month?: number | null;
  kind?: CalendarEventKind | '';
  source?: string;
  is_active?: boolean | null;
  page?: number;
  per_page?: number;
}
