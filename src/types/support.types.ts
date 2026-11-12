/**
 * Support desk types.
 *
 * Field names mirror `SupportTicketSerializer` on the backend exactly, so the
 * payloads flow through without any remapping. The backend always answers
 * HTTP 200 and signals failure through `success` + `code`, which the shared
 * `ApiResponse` envelope already models.
 */

import type { PaginationMeta } from './api.types';

// ============= Vocabulary =============

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'awaiting_member'
  | 'awaiting_staff'
  | 'resolved'
  | 'closed';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportCategory {
  id: number;
  slug: string;
  label: string;
  description?: string | null;
}

/** Minimal category embedded on a ticket. */
export interface SupportCategoryRef {
  id: number;
  slug: string;
  label: string;
}

/** A person reference embedded on tickets/messages. */
export interface SupportPerson {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  profile_photo_url?: string | null;
}

// ============= Attachments =============

/** Rows the API accepts when creating a ticket or sending a message. */
export interface SupportAttachmentInput {
  url: string;
  name?: string;
  type?: string;
  size?: number;
}

/** A stored attachment as returned by the API. */
export interface SupportAttachment {
  id: number;
  file_url: string;
  file_name: string | null;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

// ============= Messages =============

export interface SupportMessage {
  id: number;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  author: SupportPerson | null;
  attachments: SupportAttachment[];
}

/** Trimmed preview shown in list views (never an internal note). */
export interface SupportLatestMessagePreview {
  id: number;
  message: string;
  is_internal_note: false;
  created_at: string;
  author: { id: number; first_name: string; last_name: string } | null;
}

// ============= Tickets =============

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  status_label: string;
  priority: SupportTicketPriority;
  priority_label: string;
  category: SupportCategoryRef | null;
  member: SupportPerson | null;
  assigned_to: SupportPerson | null;
  related_reference: string | null;
  messages_count: number;
  unread_for_member: boolean;
  unread_for_staff: boolean;
  last_replied_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  latest_message: SupportLatestMessagePreview | null;
  created_at: string;
  updated_at: string;
}

/** A ticket with its full conversation thread attached. */
export interface SupportTicketThread extends SupportTicket {
  messages: SupportMessage[];
}

// ============= Counters =============

export interface SupportMemberStats {
  total: number;
  open: number;
  in_progress: number;
  awaiting_member: number;
  awaiting_staff: number;
  resolved: number;
  closed: number;
  unread: number;
}

export interface SupportAdminStats extends SupportMemberStats {
  unassigned: number;
  urgent: number;
}

// ============= Filters =============

export interface SupportTicketFilters {
  status?: SupportTicketStatus | '';
  category?: string | '';
  priority?: SupportTicketPriority | '';
  /** Admin only: 'unassigned' or a user id. */
  assigned_to?: string | '';
  search?: string;
}

// ============= Responses =============

export interface SupportTicketListData {
  tickets: SupportTicket[];
  stats: SupportMemberStats;
  pagination: PaginationMeta;
}

export interface SupportAdminTicketListData {
  tickets: SupportTicket[];
  stats: SupportAdminStats;
  pagination: PaginationMeta;
}

export interface SupportTicketDetailData {
  ticket: SupportTicketThread;
}

export interface SupportCategoriesData {
  categories: SupportCategory[];
}

export interface SupportAgentsData {
  agents: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url?: string | null;
  }>;
}

export interface SupportTicketData {
  ticket: SupportTicket;
}

/** Admin reply / internal note response. */
export interface SupportStaffReplyData {
  message: SupportMessage;
  ticket_status: SupportTicketStatus;
}

// ============= Payloads =============

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  /** Category slug, e.g. `wallet_issue`. */
  category: string;
  priority?: SupportTicketPriority;
  related_reference?: string;
  attachments?: SupportAttachmentInput[];
}

export interface ReplySupportTicketPayload {
  message: string;
  attachments?: SupportAttachmentInput[];
}

export interface AdminReplyPayload extends ReplySupportTicketPayload {
  is_internal_note?: boolean;
}
