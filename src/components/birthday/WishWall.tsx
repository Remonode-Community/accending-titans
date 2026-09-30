'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/utils/format.utils';
import type { BirthdayWish } from '@/types/birthday.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

interface Props {
  celebrantId: number;
  celebrantName: string;
  wishes: BirthdayWish[];
  canPost: boolean;
  busy?: boolean;
  onPost: (message: string) => Promise<void>;
  onDelete: (wishId: number) => Promise<void>;
}

/**
 * The birthday wall.
 *
 * Wishes are shared content, so this renders identically for the network and
 * for the celebrant. The difference is upstream: the server returns an empty
 * list to the celebrant until the surprise is revealed, so there is nothing to
 * hide here and no way to reveal it by inspecting the DOM.
 */
export function WishWall({
  celebrantId,
  celebrantName,
  wishes,
  canPost,
  busy = false,
  onPost,
  onDelete,
}: Props) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setError(null);
    try {
      await onPost(trimmed);
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your wish');
    }
  };

  return (
    <section className={CARD}>
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
          <Gift size={17} />
        </span>
        <div>
          <h2 className="text-base font-black tracking-tight text-gray-900">
            Birthday wall
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {wishes.length === 0
              ? 'Be the first to leave a message'
              : `${wishes.length} ${wishes.length === 1 ? 'wish' : 'wishes'} for ${celebrantName.split(/\s+/)[0]}`}
          </p>
        </div>
      </div>

      {/* Composer */}
      {canPost && (
        <div className="border-b border-[#e5e7eb] bg-[#FDFAF3]/40 p-4 sm:p-5">
          <label htmlFor="wish-message" className="sr-only">
            Your birthday message
          </label>
          <textarea
            id="wish-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Write something they'd love to read…"
            className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
          />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] text-gray-400">
              {message.length}/500
              {error && <span className="ml-2 font-semibold text-red-600">{error}</span>}
            </p>
            <Button
              size="sm"
              onClick={submit}
              isLoading={busy}
              disabled={busy || message.trim().length === 0}
            >
              <Send size={13} />
              Post wish
            </Button>
          </div>
        </div>
      )}

      {/* Wall */}
      {wishes.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Gift}
            title="No wishes yet"
            description={
              canPost
                ? 'Your message will appear here for them to read on the day.'
                : 'Wishes appear here as the network writes them.'
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {wishes.map((wish) => (
            <li key={wish.id} className="group px-5 py-4 sm:px-6">
              <div className="flex gap-3.5">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#e5e7eb] bg-[#FDFAF3]">
                  {wish.author.profile_photo_url ? (
                    <Image
                      src={wish.author.profile_photo_url}
                      alt={wish.author.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-black text-[#B8962E]">
                      {(wish.author.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {wish.author.id ? (
                      <Link
                        href={`/dashboard/birthdays/${wish.author.id}`}
                        className="text-sm font-bold text-gray-900 transition hover:text-[#C9A84C]"
                      >
                        {wish.author.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-gray-900">
                        {wish.author.name}
                      </span>
                    )}
                    {wish.author.rank && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#B8962E]">
                        {wish.author.rank}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">
                      {wish.created_at ? formatDateTime(wish.created_at) : ''}
                    </span>
                    {wish.is_mine && (
                      <button
                        type="button"
                        onClick={() => void onDelete(wish.id)}
                        aria-label="Remove your wish"
                        className="ml-auto rounded-lg p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {wish.message}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-[#e5e7eb] px-5 py-3 text-[11px] text-gray-400 sm:px-6">
        Wishes stay hidden from the celebrant until the day, so nothing here can
        give away a surprise.
      </p>
    </section>
  );
}
