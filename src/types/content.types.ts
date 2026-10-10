/**
 * Content Submission Types
 * Based on backend content review system
 */

import type { PaginationMeta } from '@/types/api.types';

export interface ContentSubmission {
  id: number;
  title: string;
  content_type: string;     // "advertisement" | "promotional_video" | "graphic" | "photo"
  status: string;           // "pending_review" | "approved" | "rejected"
  media_url: string;
  duration_seconds: number | null;
  description: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  estimated_review_completion: string;
}

export interface SubmitContentRequest {
  title: string;
  content_type: string;
  media_url: string;
  duration_seconds?: number;
  description?: string;
}

/**
 * What `GET /content/my-submissions` actually returns inside `data`.
 *
 * The array is under `submissions`, NOT `data`. Modelling the real shape is the
 * point: the shared `PaginatedResponse<T>` implies `data.data`, which this
 * endpoint never produces.
 */
export interface ContentSubmissionListResponse {
  submissions: ContentSubmission[];
  pagination: PaginationMeta;
}

// ── Admin types ───────────────────────────────────────────────────────
//
// The moderation screen renders ONE card for all three tabs (pending,
// approved, rejected), so all three endpoints must agree on the submission
// shape. They did not: /pending omitted `status`, /all omitted `media_url`,
// and the two disagreed on whether `submitter` was an object or a bare
// string. Neither returned `user_name`, which is what the card actually read,
// so that field rendered blank on every tab.
//
// The server now returns one shape from every admin content endpoint
// (see ContentReviewController::adminSubmissionPayload). These types describe
// that shape; `PendingMeta` is the only extra key on the pending queue.

export interface ContentSubmitter {
  id: number | null;
  name: string;
  email: string | null;
}

export interface ContentReviewer {
  id: number;
  name: string;
}

export interface AdminContentSubmission {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  duration_seconds: number | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;
  rejection_reason: string | null;
  submitter: ContentSubmitter;
  reviewer: ContentReviewer | null;
  hours_elapsed: number;
  auto_approval_in_hours: number;
  is_auto_approvable: boolean;
}

/** `data` for GET /admin/content/pending — the same list, plus a total. */
export interface AdminPendingListResponse {
  pending_count: number;
  submissions: AdminContentSubmission[];
  pagination: PaginationMeta;
}

/** `data` for GET /admin/content/all. */
export interface AdminSubmissionListResponse {
  submissions: AdminContentSubmission[];
  pagination: PaginationMeta;
}

export interface RejectContentRequest {
  reason: string;
}
