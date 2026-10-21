export type ActivityLogStatus = 'success' | 'failure' | 'pending';

export interface ActivityLogMetadata {
  method?: string;
  path?: string;
  status_code?: number;
  device?: 'web' | 'mobile' | 'api' | string;
  browser?: string;
  payload?: Record<string, unknown>;
  truncated?: boolean;
}

export interface ActivityLogEntry {
  id: number;
  actor_id: number | null;
  actor_name: string;
  actor_email: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  status: ActivityLogStatus;
  ip_address: string;
  user_agent: string;
  metadata: ActivityLogMetadata;
  created_at: string;
}

export interface ActivityLogStats {
  total_events: number;
  successful_events: number;
  failed_events: number;
  unique_actors: number;
  events_today: number;
  top_actions: Array<{ action: string; count: number }>;
}

export interface ActivityLogPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ActivityLogIndexResponse {
  logs: ActivityLogEntry[];
  stats: ActivityLogStats;
  pagination: ActivityLogPagination;
}

export interface ActivityLogQuery {
  page?: number;
  per_page?: number;
  search?: string;
  action?: string;
  status?: ActivityLogStatus;
  date_from?: string;
  date_to?: string;
}
