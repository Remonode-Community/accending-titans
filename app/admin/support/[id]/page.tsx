'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Lock,
  UserCheck,
  XCircle,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { PersonInitials } from '@/components/support';
import {
  ConversationThread,
  MessageComposer,
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/support';
import { useAuthStore } from '@/store/auth.store';
import { supportService } from '@/services/support.service';
import { formatDate, formatRelativeTime } from '@/utils/format.utils';
import type {
  SupportAgentsData,
  SupportAttachmentInput,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketThread,
} from '@/types/support.types';

/**
 * Staff view of one ticket: the full conversation (including internal
 * notes), reply/inline-note composer, and the management controls —
 * assignment, status and priority — all wired to their dedicated endpoints.
 */

const STATUS_OPTIONS: Array<{ value: SupportTicketStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_member', label: 'Awaiting member' },
  { value: 'awaiting_staff', label: 'Awaiting support' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: Array<{ value: SupportTicketPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((r) => r === 'admin')),
    [user],
  );

  const [ticket, setTicket] = useState<SupportTicketThread | null>(null);
  const [agents, setAgents] = useState<SupportAgentsData['agents']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SupportTicketStatus | ''>('');
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<SupportTicketPriority | ''>('');
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [asInternalNote, setAsInternalNote] = useState(false);

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  const fetchTicket = useCallback(async () => {
    if (!id) return;

    try {
      const res = await supportService.getAdminTicket(Number(id));

      if (!res.success || !res.data?.ticket) {
        setError(
          res.code === 404
            ? 'This ticket does not exist.'
            : res.message || 'Could not load the ticket.',
        );
        setTicket(null);
        return;
      }

      const loaded = res.data.ticket;
      setTicket(loaded);
      setSelectedAgent(loaded.assigned_to ? String(loaded.assigned_to.id) : '');
      setSelectedStatus(loaded.status);
      setSelectedPriority(loaded.priority);
      setError(null);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Could not load the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // `loading` starts as true, so the first render is the skeleton without
    // any synchronous state change; later calls are quiet refreshes that
    // keep the thread visible.
    if (isAdmin) fetchTicket();
  }, [isAdmin, fetchTicket]);

  useEffect(() => {
    supportService
      .getAgents()
      .then((res) => {
        if (res.success && res.data) setAgents(res.data.agents);
      })
      .catch(() => undefined);
  }, [isAdmin]);

  const handleAssign = async () => {
    if (!ticket || !selectedAgent) return;

    setAssigning(true);
    try {
      const res = await supportService.assign(ticket.id, Number(selectedAgent));

      if (!res.success || !res.data?.ticket) {
        setError(res.message || 'Could not assign the ticket.');
        return;
      }

      setTicket((prev) => (prev ? { ...prev, ...res.data!.ticket, messages: prev.messages } : prev));
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = (next: SupportTicketStatus) => {
    if (!ticket || next === ticket.status) return;
    setSelectedStatus(next);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!ticket || !selectedStatus) return;

    const res = await supportService.updateStatus(ticket.id, selectedStatus);

    if (!res.success || !res.data?.ticket) {
      setError(res.message || 'Could not update the status.');
      return;
    }

    setTicket((prev) => (prev ? { ...prev, ...res.data!.ticket, messages: prev.messages } : prev));
    setStatusConfirmOpen(false);
  };

  const handlePriorityChange = async (next: SupportTicketPriority) => {
    if (!ticket || next === ticket.priority) return;

    setSelectedPriority(next);
    setUpdatingPriority(true);
    try {
      const res = await supportService.updatePriority(ticket.id, next);

      if (!res.success || !res.data?.ticket) {
        setError(res.message || 'Could not update the priority.');
        setSelectedPriority(ticket.priority);
        return;
      }

      setTicket((prev) => (prev ? { ...prev, ...res.data!.ticket, messages: prev.messages } : prev));
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleReply = useCallback(
    async (payload: {
      message: string;
      attachments?: SupportAttachmentInput[];
    }) => {
      if (!ticket) return;

      const res = await supportService.adminReply(ticket.id, {
        message: payload.message,
        is_internal_note: asInternalNote,
        attachments: payload.attachments?.length ? payload.attachments : undefined,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to send your message.');
      }

      // Append locally (internal notes never hit the member), then refresh
      // quietly so counters and status stay exact.
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, res.data!.message],
              messages_count: prev.messages_count + 1,
              ...(asInternalNote
                ? {}
                : {
                    status: res.data!.ticket_status,
                    status_label:
                      STATUS_OPTIONS.find((o) => o.value === res.data!.ticket_status)?.label ??
                      res.data!.ticket_status,
                  }),
            }
          : prev,
      );
      void fetchTicket();
    },
    [ticket, asInternalNote, fetchTicket],
  );

  if (!isAdmin) return null;

  if (loading) return <PageSkeleton />;

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft size={15} />
          Back to support desk
        </Link>
        <EmptyState
          icon={XCircle}
          title="Ticket unavailable"
          description={error}
          action={{ label: 'Back to queue', onClick: () => router.push('/admin/support') }}
        />
      </div>
    );
  }

  if (!ticket) return null;

  const memberName = ticket.member
    ? `${ticket.member.first_name} ${ticket.member.last_name}`.trim()
    : 'Unknown member';

  const controlSelectClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#C9A84C] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={15} />
        Back to support desk
      </Link>

      {/* Ticket header + management controls */}
      <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B8962E] dark:text-[#D4B85A]">
              {ticket.ticket_number}
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.subject}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {formatDate(ticket.created_at)}
              </span>
              {ticket.category && <span>· {ticket.category.label}</span>}
              {ticket.related_reference && <span>· Ref: {ticket.related_reference}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
            <TicketPriorityBadge priority={ticket.priority} label={ticket.priority_label} />
          </div>
        </div>

        {/* Member card */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/40">
          <PersonInitials
            firstName={ticket.member?.first_name}
            lastName={ticket.member?.last_name}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {memberName}
            </p>
            <p className="truncate text-xs text-gray-400">{ticket.member?.email ?? ''}</p>
          </div>
          {ticket.first_response_at && (
            <p className="hidden shrink-0 text-[11px] text-gray-400 sm:block">
              First response {formatRelativeTime(ticket.first_response_at)}
            </p>
          )}
        </div>

        {/* Management controls */}
        <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3 dark:border-gray-700">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <UserCheck size={11} />
              Assign to
            </label>
            <div className="flex gap-2">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className={controlSelectClass}
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning || !selectedAgent}
                className="shrink-0 rounded-xl bg-[#C9A84C] px-3 text-xs font-bold text-white transition hover:bg-[#B8962E] disabled:opacity-50"
              >
                {assigning ? '…' : 'Assign'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <ClipboardList size={11} />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as SupportTicketStatus)}
              className={controlSelectClass}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Priority
              {updatingPriority && <span className="text-gray-300">updating…</span>}
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => handlePriorityChange(e.target.value as SupportTicketPriority)}
              className={controlSelectClass}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && ticket && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        {ticket.status === 'closed' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
            <Lock size={13} className="mt-0.5 shrink-0" />
            This ticket is closed. Setting it back to an active status clears the resolved
            and closed stamps so the history stays honest.
          </div>
        )}
      </Card>

      {/* Conversation (includes internal notes for staff) */}
      <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-400">
          Conversation · {ticket.messages_count} message{ticket.messages_count === 1 ? '' : 's'}
        </h2>

        <ConversationThread
          messages={ticket.messages}
          viewerId={user?.id}
          showInternalNotes
        />
      </Card>

      {/* Composer with internal-note toggle */}
      <MessageComposer
        onSubmit={handleReply}
        submitLabel={asInternalNote ? 'Add note' : 'Send reply'}
        placeholder={
          asInternalNote
            ? 'Internal note — only visible to staff…'
            : 'Reply to the member…'
        }
        topSlot={
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            <input
              type="checkbox"
              checked={asInternalNote}
              onChange={(e) => setAsInternalNote(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber-600"
            />
            Internal note (member never sees this)
          </label>
        }
      />

      {/* Status change confirmation */}
      <ConfirmDialog
        isOpen={statusConfirmOpen}
        onClose={() => {
          setStatusConfirmOpen(false);
          setSelectedStatus(ticket.status);
        }}
        onConfirm={confirmStatusChange}
        title={`Change status to "${STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? selectedStatus}"?`}
        message={
          selectedStatus === 'resolved'
            ? 'The member will be notified that the issue is resolved.'
            : selectedStatus === 'closed'
              ? 'The member will be notified that the ticket is closed. They can reopen it if the issue returns.'
              : 'The ticket status will be updated. Member-facing changes are announced.'
        }
        confirmLabel="Update status"
        tone="primary"
        icon={CheckCircle2}
      />
    </div>
  );
}
