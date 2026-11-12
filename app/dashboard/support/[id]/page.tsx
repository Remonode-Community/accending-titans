'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/shared/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/shared/Button';
import { useAlert } from '@/hooks/useAlert';
import { useAuth } from '@/hooks/useAuth';
import {
  ConversationThread,
  MessageComposer,
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/support';
import { supportService } from '@/services/support.service';
import { formatDate } from '@/utils/format.utils';
import type { SupportAttachmentInput, SupportTicketThread } from '@/types/support.types';

/**
 * Member view of one ticket: the conversation, the status timeline and the
 * lifecycle actions (resolve / reopen with a reason). Replies are blocked on
 * closed tickets — reopening is the explicit path back, mirroring the API.
 */

export default function MemberTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [ticket, setTicket] = useState<SupportTicketThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resolving, setResolving] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const isClosed = ticket?.status === 'closed';
  const canResolve = Boolean(
    ticket && ticket.status !== 'resolved' && ticket.status !== 'closed',
  );
  const canReopen = Boolean(
    ticket && (ticket.status === 'resolved' || ticket.status === 'closed'),
  );

  const fetchTicket = useCallback(async () => {
    if (!id) return;

    try {
      const res = await supportService.getTicket(Number(id));

      if (!res.success || !res.data?.ticket) {
        setError(
          res.code === 404
            ? 'This ticket does not exist or belongs to another account.'
            : res.message || 'Could not load the ticket.',
        );
        setTicket(null);
        return;
      }

      setTicket(res.data.ticket);
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
    fetchTicket();
  }, [fetchTicket]);

  const handleReply = async (payload: {
    message: string;
    attachments?: SupportAttachmentInput[];
  }) => {
    if (!ticket) return;

    const res = await supportService.reply(ticket.id, {
      message: payload.message,
      attachments: payload.attachments?.length ? payload.attachments : undefined,
    });

    if (!res.success || !res.data?.message) {
      throw new Error(res.message || 'Failed to send your message.');
    }

    // Server echoes the stored message and flips the ticket to
    // `awaiting_staff`; reflect both without a full refetch, then refresh
    // quietly so counters stay exact.
    setTicket((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, res.data!.message],
            status: 'awaiting_staff',
            status_label: 'Awaiting support',
            last_replied_at: res.data!.message.created_at,
          }
        : prev,
    );
    void fetchTicket();
  };

  const handleResolve = async () => {
    if (!ticket) return;

    setResolving(true);
    try {
      const res = await supportService.resolve(ticket.id);

      if (!res.success || !res.data?.ticket) {
        showAlert(res.message || 'Could not resolve the ticket.', 'error');
        return;
      }

      setTicket((prev) => (prev ? { ...prev, ...res.data!.ticket, messages: prev.messages } : prev));
      showAlert('Ticket marked as resolved', 'success');
    } finally {
      setResolving(false);
      setShowResolveConfirm(false);
    }
  };

  const handleReopen = async () => {
    if (!ticket) return;

    if (reopenReason.trim().length < 5) {
      setReopenError('Tell us briefly what is still wrong (at least 5 characters).');
      return;
    }

    setReopenSubmitting(true);
    setReopenError(null);
    try {
      const res = await supportService.reopen(ticket.id, reopenReason.trim());

      if (!res.success || !res.data?.ticket) {
        showAlert(res.message || 'Could not reopen the ticket.', 'error');
        return;
      }

      setTicket((prev) => (prev ? { ...prev, ...res.data!.ticket, messages: prev.messages } : prev));
      setShowReopenModal(false);
      setReopenReason('');
      showAlert('Ticket reopened — we will pick it up again', 'success');
      void fetchTicket();
    } finally {
      setReopenSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft size={15} />
          Back to support
        </Link>
        <EmptyState
          icon={XCircle}
          title="Ticket unavailable"
          description={error ?? 'This ticket could not be loaded.'}
          action={{
            label: 'Back to my tickets',
            onClick: () => router.push('/dashboard/support'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={15} />
        Back to support
      </Link>

      {/* Header */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800">
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
                Raised {formatDate(ticket.created_at)}
              </span>
              {ticket.category && <span>· {ticket.category.label}</span>}
              {ticket.assigned_to && (
                <span className="inline-flex items-center gap-1">
                  · <ShieldCheck size={12} />
                  Handled by {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} label={ticket.status_label} />
            <TicketPriorityBadge priority={ticket.priority} label={ticket.priority_label} />
          </div>
        </div>

        {/* Lifecycle actions */}
        {(canResolve || canReopen) && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            {canResolve && (
              <Button
                onClick={() => setShowResolveConfirm(true)}
                disabled={resolving}
                size="sm"
                className="rounded-xl"
              >
                <CheckCircle2 size={14} />
                Mark as resolved
              </Button>
            )}
            {canReopen && (
              <Button
                onClick={() => setShowReopenModal(true)}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <RotateCcw size={14} />
                Reopen ticket
              </Button>
            )}
          </div>
        )}

        {ticket.status === 'resolved' && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            This ticket was marked as resolved
            {ticket.resolved_at ? ` on ${formatDate(ticket.resolved_at)}` : ''}. If the issue
            comes back, reopen it and we will continue right where we left off.
          </div>
        )}
        {isClosed && (
          <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
            This ticket is closed. Reopen it if the issue returns — the whole conversation is
            kept, so nothing is lost.
          </div>
        )}
      </Card>

      {/* Conversation */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-400">
          Conversation · {ticket.messages_count} message{ticket.messages_count === 1 ? '' : 's'}
        </h2>

        <ConversationThread messages={ticket.messages} viewerId={user?.id} />
      </Card>

      {/* Reply */}
      <MessageComposer
        onSubmit={handleReply}
        disabled={isClosed}
        disabledReason="This ticket is closed — reopen it above to continue the conversation."
        placeholder={
          ticket.status === 'resolved'
            ? 'Replying reopens the conversation automatically…'
            : 'Type your reply…'
        }
      />

      {/* Resolve confirmation */}
      <ConfirmDialog
        isOpen={showResolveConfirm}
        onClose={() => setShowResolveConfirm(false)}
        onConfirm={handleResolve}
        title="Mark as resolved?"
        message="Confirm that your issue has been fixed. You can reopen the ticket at any time if it is not."
        confirmLabel="Yes, resolve it"
        tone="primary"
        icon={CheckCircle2}
      />

      {/* Reopen modal */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Reopen ticket"
        subtitle={ticket.ticket_number}
        icon={RotateCcw}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowReopenModal(false)}
              disabled={reopenSubmitting}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReopen}
              disabled={reopenSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B8962E] disabled:opacity-60 sm:w-auto"
            >
              {reopenSubmitting ? 'Reopening…' : 'Reopen ticket'}
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Your reason is posted as a message in the conversation so the team reopens with
          context.
        </p>
        <textarea
          value={reopenReason}
          onChange={(e) => setReopenReason(e.target.value.slice(0, 2000))}
          rows={4}
          placeholder="What is still not working?"
          className={clsx(
            'w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            reopenError && 'border-red-400',
          )}
        />
        {reopenError && (
          <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            {reopenError}
          </p>
        )}
      </Modal>
    </div>
  );
}
