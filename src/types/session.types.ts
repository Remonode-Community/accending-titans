/**
 * Session Tracking Types
 */

export interface SessionStartResponse {
  session_id: string;
  started_at: string;
}

export interface SessionEndResponse {
  session_id: string;
  duration_minutes: number;
  ended_at: string;
}

export interface TodaySession {
  total_minutes: number;
  sessions_count: number;
}
