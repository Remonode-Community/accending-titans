'use client';

import Image from 'next/image';
import { clsx } from 'clsx';
import { Paperclip, ShieldAlert } from 'lucide-react';
import { PersonInitials } from './support-badges';
import type { SupportMessage } from '@/types/support.types';

/**
 * The ticket conversation thread.
 *
 * `viewerId` decides alignment — the signed-in person's messages sit on the
 * right with the gold accent, everyone else's on the left. Internal notes
 * render only when `showInternalNotes` is on (the admin surface); the
 * member API never returns them in the first place, but this keeps the
 * component honest for both callers.
 */

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDay = 86_400_000;

  if (diffMs < oneDay && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const formatBytes = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ConversationThreadProps {
  messages: SupportMessage[];
  /** The signed-in user's id — their messages align right. */
  viewerId?: number;
  /** Staff surface: render internal notes with their dedicated styling. */
  showInternalNotes?: boolean;
  className?: string;
}

export const ConversationThread = ({
  messages,
  viewerId,
  showInternalNotes = false,
  className,
}: ConversationThreadProps) => {
  const visible = showInternalNotes
    ? messages
    : messages.filter((m) => !m.is_internal_note);

  if (visible.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-gray-400">
        No messages in this conversation yet.
      </p>
    );
  }

  return (
    <div className={clsx('space-y-5', className)}>
      {visible.map((msg) => {
        const mine = viewerId !== undefined && msg.author?.id === viewerId;
        const isNote = msg.is_internal_note;

        return (
          <div
            key={msg.id}
            className={clsx('flex gap-3', mine ? 'flex-row-reverse' : 'flex-row')}
          >
            <PersonInitials
              firstName={msg.author?.first_name}
              lastName={msg.author?.last_name}
            />

            <div className={clsx('min-w-0 max-w-[85%] flex-1 sm:max-w-[70%]', mine && 'flex flex-col items-end')}>
              {/* Author + time */}
              <div
                className={clsx(
                  'mb-1 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500',
                  mine && 'flex-row-reverse',
                )}
              >
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {msg.author ? `${msg.author.first_name} ${msg.author.last_name}`.trim() : 'Unknown'}
                </span>
                <span>{formatTime(msg.created_at)}</span>
              </div>

              {/* Bubble */}
              <div
                className={clsx(
                  'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
                  isNote
                    ? // Internal note: dashed amber, unmistakably staff-only.
                      'border-dashed border-amber-300 bg-amber-50 text-gray-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100'
                    : mine
                      ? 'rounded-tr-sm border-[#C9A84C]/30 bg-[#C9A84C]/10 text-gray-900 dark:bg-[#C9A84C]/15 dark:text-gray-100'
                      : 'rounded-tl-sm border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
                )}
              >
                {isNote && (
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <ShieldAlert size={11} />
                    Internal note — not visible to the member
                  </p>
                )}

                <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                {msg.attachments.length > 0 && (
                  <div
                    className={clsx(
                      'mt-3 grid gap-2',
                      msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(
                          'group relative block overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-[#C9A84C]/50 dark:border-gray-600 dark:bg-gray-700/50',
                        )}
                      >
                        <Image
                          src={att.file_url}
                          alt={att.file_name ?? 'Attachment'}
                          width={320}
                          height={200}
                          unoptimized
                          className="h-36 w-full object-cover"
                        />
                        <span className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-300">
                          <Paperclip size={10} />
                          <span className="truncate">{att.file_name ?? 'Attachment'}</span>
                          {att.file_size ? (
                            <span className="shrink-0 text-gray-400">{formatBytes(att.file_size)}</span>
                          ) : null}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
