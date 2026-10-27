import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  SessionStartResponse,
  SessionEndResponse,
  TodaySession,
} from '@/types/session.types';

class SessionService {
  /** POST /sessions/start */
  async start(): Promise<ApiResponse<SessionStartResponse>> {
    return apiClient.post('/sessions/start');
  }

  /** POST /sessions/end */
  async end(sessionId: string): Promise<ApiResponse<SessionEndResponse>> {
    return apiClient.post('/sessions/end', { session_id: sessionId });
  }

  /** GET /sessions/today */
  async getToday(): Promise<ApiResponse<TodaySession>> {
    return apiClient.get('/sessions/today');
  }
}

export const sessionService = new SessionService();
