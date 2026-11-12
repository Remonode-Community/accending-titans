'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Loader2, Send } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { supportService } from '@/services/support.service';
import type { SupportAttachmentInput } from '@/types/support.types';

/**
 * The reply composer shared by the member and admin ticket pages.
 *
 * Attachments upload straight to Cloudinary (dedicated `tickets` folder,
 * max 5) before the message is sent — the API takes hosted URLs, not files.
 * The message is blocked while any upload is still in flight so an
 * attachment can never be dropped from a sent message.
 */

const MAX_LENGTH = 5000;

interface MessageComposerProps {
  onSubmit: (payload: { message: string; attachments: SupportAttachmentInput[] }) => Promise<void>;
  submitting?: boolean;
  /** Disables editing entirely (e.g. ticket closed). */
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
  allowAttachments?: boolean;
  submitLabel?: string;
  /** Slot above the input — used by the admin surface for the note toggle. */
  topSlot?: React.ReactNode;
  className?: string;
}

export const MessageComposer = ({
  onSubmit,
  submitting = false,
  disabled = false,
  disabledReason,
  placeholder = 'Type your message…',
  allowAttachments = true,
  submitLabel = 'Send reply',
  topSlot,
  className,
}: MessageComposerProps) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleUpload = async (file: File): Promise<string> => {
    const uploaded = await supportService.uploadAttachment(file);
    setAttachments((prev) => [...prev, uploaded]);
    return uploaded.url;
  };

  // Sending is blocked while an attachment upload is still in flight so an
  // image can never silently drop out of the message.
  const canSend =
    !disabled && !submitting && !sending && !uploading && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;

    setError(null);
    setSending(true);

    try {
      await onSubmit({ message: message.trim(), attachments });
      setMessage('');
      setAttachments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your message.');
    } finally {
      setSending(false);
    }
  };

  if (disabled) {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500',
          className,
        )}
      >
        {disabledReason ?? 'Replies are disabled for this ticket.'}
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {topSlot}

      <div
        className={clsx(
          'rounded-2xl border border-gray-200 bg-white p-4 transition focus-within:border-[#C9A84C] focus-within:ring-4 focus-within:ring-[#C9A84C]/10 dark:border-gray-700 dark:bg-gray-800',
        )}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter sends — a text area still allows normal returns.
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {message.length}/{MAX_LENGTH} · Ctrl+Enter to send
          </p>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition',
              canSend
                ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/20 hover:bg-[#B8962E]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
            )}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Sending…' : submitLabel}
          </button>
        </div>
      </div>

      {allowAttachments && (
        <ImageUploader
          label="Attach images (optional)"
          hint="Up to 5 images, 4MB each. Screenshots help us resolve issues faster."
          value={attachments.map((a) => a.url)}
          onChange={(urls) =>
            setAttachments((prev) => prev.filter((a) => urls.includes(a.url)))
          }
          onUpload={handleUpload}
          max={5}
          onUploadingChange={setUploading}
        />
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
};
