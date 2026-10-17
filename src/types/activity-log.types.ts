/**
 * Activity Log types.
 *
 * These mirror the real endpoint contract in
 * `ActivityLogController::present()` and its `pagination` block.
 *
 * WHY THEY ARE SEPARATE FROM THE OLD SHAPE
 * ----------------------------------------
 * The previous screen typed a `metadata: Record<string, any>` and rendered a
 * fixed set of columns against 150 rows generated in the browser. The shape
 * below is the one the server actually returns, and it is deliberately strict
 * — `metadata` is typed rather than `any` so that adding a key is a decision
 * somebody has to make in both places.
 */

export type AuditStatus = 'success' | 'failure' | 'pending';

export interface AuditLogEntry {
  id: number;
  /** Null when the account has since been deleted — the row outlives it. */
  actor_id: number | null;
  /** Snapshot taken at the time of the event, never re-resolved. */
  actor_name: string | null;
  actor_email: string | null;
  /** Dotted verb, e.g. `user.role.assign`. */
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  status: AuditStatus;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogStats {
  total_events: number;
  successful_events: number;
  failed_events: number;
  unique_actors: number;
  events_today: number;
  top_actions: Array<{ action: string; count: number }>;
}

export interface AuditLogPagination {
  current_page: number;
  per_page: number;
  /**
   * The size of the whole filtered result set, NOT the current page.
   * Read straight from the server so the header can never claim a number the
   * table does not support — the specific lie the mocked version told.
   */
  total: number;
  last_page: number;
}

export interface ActivityLogFilters {
  search?: string;
  action?: string;
  status?: AuditStatus | '';
  date_from?: string;
  date_to?: string;
}

export interface ActivityLogListResponse {
  logs: AuditLogEntry[];
  pagination: AuditLogPagination;
  /** Echoed by the server so the UI shows the filter actually applied. */
  applied_filters: Record<string, string | number>;
}

export interface ActivityLogActionsResponse {
  /** Derived from rows that exist, not a hardcoded verb list. */
  actions: string[];
}