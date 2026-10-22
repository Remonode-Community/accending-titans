'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Quote, Send, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/utils/format.utils';
import type { BirthdayWish } from '@/types/birthday.types';

const CARD =
  'rounded-[1.75rem] border border-[#ece7dd] bg-white shadow-[0_18px_40px_-28px_rgba(26,15,11,0.25)]';

const ACCENTS = [
  'from-[#F3D27A]/60',
  'from-[#E8B4B8]/60',
  'from-[#BFD8C4]/60',
  'from-[#C9C2F0]/60',
];

interface Props {
  celebrantName: string;
  wishes: BirthdayWish[];
  canPost: boolean;
  busy?: boolean;
  /** Renders the wall without its own card shell, for use inside a stepper stage. */
  embedded?: boolean;
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
  celebrantName,
  wishes,
  canPost,
  busy = false,
  embedded = false,
  onPost,
  onDelete,
}: Props) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const firstName = celebrantName.split(/\s+/)[0] || 'them';

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
    <section
      className={
        embedded
          ? 'overflow-hidden rounded-2xl border border-[#f1ece2] bg-white'
          : CARD
      }
    >
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1ece2] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF3CF] to-[#F3D27A]/70 text-[#8A6F1F]">
              <Gift size={16} />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight text-gray-900">Birthday wall</h2>
              <p className="mt-0.5 text-xs text-gray-400">
                {wishes.length === 0
                  ? 'Be the first to leave a message'
                  : `${wishes.length} ${wishes.length === 1 ? 'wish' : 'wishes'} for ${firstName}`}
              </p>
            </div>
          </div>

          {wishes.length > 0 && (
            <span className="rounded-full border border-[#C9A84C]/25 bg-[#FDFAF3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8962E]">
              {wishes.length} on the wall
            </span>
          )}
        </div>
      )}

      {/* Composer */}
      {canPost && (
        <div className="border-b border-[#f1ece2] bg-gradient-to-br from-[#FFF8E8]/70 via-white to-[#FDFAF3] p-4 sm:p-5">
          <label htmlFor="wish-message" className="sr-only">
            Your birthday message
          </label>
          <div className="rounded-[1.35rem] border border-[#C9A84C]/25 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <textarea
              id="wish-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={`Write something ${firstName} will love to read…`}
              className="w-full resize-none rounded-xl border-0 bg-transparent px-2 py-1.5 text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece2] pt-2.5">
              <p className="pl-2 text-[11px] text-gray-400">
                {message.length}/500
                {error && <span className="ml-2 font-semibold text-red-600">{error}</span>}
              </p>
              <button
                type="button"
                onClick={submit}
                disabled={busy || message.trim().length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F3D27A] via-[#E6C56A] to-[#D9B96A] px-4 py-2 text-sm font-bold text-[#241410] shadow-[0_10px_24px_-14px_rgba(184,150,46,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={13} />
                {busy ? 'Posting…' : 'Post wish'}
              </button>
            </div>
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
        <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {wishes.map((wish, index) => (
            <li
              key={wish.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#f1ece2] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#C9A84C]/35 hover:shadow-[0_18px_34px_-24px_rgba(26,15,11,0.4)]"
            >
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${ACCENTS[index % ACCENTS.length]} to-transparent`}
              />

              <Quote size={18} className="shrink-0 text-[#C9A84C]/35" />
              <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {wish.message}
              </p>

              <div className="mt-4 flex items-center gap-2.5 border-t border-[#f6f1e8] pt-3">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#f1ece2] bg-[#FDFAF3]">
                  {wish.author.profile_photo_url ? (
                    <Image
                      src={wish.author.profile_photo_url}
                      alt={wish.author.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#B8962E]">
                      {(wish.author.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    {wish.author.id ? (
                      <Link
                        href={`/dashboard/birthdays/${wish.author.id}`}
                        className="truncate text-xs font-bold text-gray-900 transition hover:text-[#B8962E]"
                      >
                        {wish.author.name}
                      </Link>
                    ) : (
                      <span className="truncate text-xs font-bold text-gray-900">
                        {wish.author.name}
                      </span>
                    )}
                    {wish.author.rank && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#B8962E]">
                        {wish.author.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {wish.created_at ? formatDateTime(wish.created_at) : ''}
                  </p>
                </div>

                {wish.is_mine && (
                  <button
                    type="button"
                    onClick={() => void onDelete(wish.id)}
                    aria-label="Remove your wish"
                    className="ml-auto rounded-lg p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-[#f1ece2] px-5 py-3 text-[11px] leading-relaxed text-gray-400 sm:px-6">
        Wishes stay hidden from the celebrant until the day, so nothing here can give away a
        surprise.
      </p>
    </section>
  );
}
