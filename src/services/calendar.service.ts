/**
 * Calendar Service
 *
 * Two halves behind one client:
 *
 *  - Member-facing reads (`/birthdays/calendar*`) — a single month window and
 *    an upcoming rail, both assembled server-side so the client never has to
 *    know that a row came from the owner's list or from a member's profile.
 *
 *  - Administrator CRUD (`/admin/calendar-events`) — gated server-side by the
 *    `manage_birthday_rewards` permission. Writes answer HTTP 200/201 with a
 *    `{success, code}` envelope, so every method returns the raw envelope for
 *    the page to branch on instead of throwing.
 *
 * `preview` deliberately writes nothing (parse only) — an administrator
 * checks a pasted list before committing it, and `import` reports per-row
 * outcomes (created / updated / unchanged / reconciled / invalid) because an
 * idempotent re-import must be able to say "nothing changed".
 */

import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdminCalendarEvent,
  AdminCalendarEventListData,
  CalendarEventFilters,
  CalendarEventPayload,
  CalendarImportReport,
  CalendarMonthData,
  CalendarPreviewData,
  CalendarUpcomingData,
} from '@/types/calendar.types';

const MEMBER_BASE = '/birthdays/calendar';
const ADMIN_BASE = '/admin/calendar-events';

/** Build `?a=1&b=2` from defined, non-empty filter values only. */
const buildQuery = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

class CalendarService {
  // ── Member-facing ────────────────────────────────────────────────────

  /** One calendar month, ready to lay into a grid. */
  async getMonth(year: number, month: number): Promise<ApiResponse<CalendarMonthData>> {
    return apiClient.get(`${MEMBER_BASE}${buildQuery({ year, month })}`);
  }

  /** The upcoming rail with countdowns (bounded window, max 92 days). */
  async getUpcoming(days = 30): Promise<ApiResponse<CalendarUpcomingData>> {
    return apiClient.get(`${MEMBER_BASE}/upcoming${buildQuery({ days })}`);
  }

  // ── Administrator: list ──────────────────────────────────────────────

  /** Stored entries only (no member rows) with filters and server-side pagination. */
  async adminList(filters: CalendarEventFilters = {}): Promise<ApiResponse<AdminCalendarEventListData>> {
    const query = buildQuery({
      search: filters.search,
      month: filters.month ?? undefined,
      kind: filters.kind || undefined,
      source: filters.source || undefined,
      is_active:
        filters.is_active === null || filters.is_active === undefined ? undefined : String(filters.is_active),
      page: filters.page,
      per_page: filters.per_page,
    });

    return apiClient.get(`${ADMIN_BASE}${query}`);
  }

  // ── Administrator: CRUD ──────────────────────────────────────────────

  async createEvent(payload: CalendarEventPayload): Promise<ApiResponse<{ event: AdminCalendarEvent }>> {
    return apiClient.post(ADMIN_BASE, payload);
  }

  async updateEvent(
    id: number,
    payload: CalendarEventPayload,
  ): Promise<ApiResponse<{ event: AdminCalendarEvent }>> {
    return apiClient.put(`${ADMIN_BASE}/${id}`, payload);
  }

  async deleteEvent(id: number): Promise<ApiResponse> {
    return apiClient.delete(`${ADMIN_BASE}/${id}`);
  }

  // ── Administrator: import ────────────────────────────────────────────

  /**
   * Parse a pasted list without writing anything. The backend refuses text
   * it cannot read with `success:false` + code 422 so the page can show the
   * parser's reason rather than an empty preview.
   */
  async previewImport(text: string): Promise<ApiResponse<CalendarPreviewData>> {
    return apiClient.post(`${ADMIN_BASE}/preview`, { text });
  }

  /** Commit a list. Repeatable: the same list reports `unchanged`, never duplicates. */
  async importList(text: string): Promise<ApiResponse<CalendarImportReport>> {
    return apiClient.post(`${ADMIN_BASE}/import`, { text });
  }
}

export const calendarService = new CalendarService();
