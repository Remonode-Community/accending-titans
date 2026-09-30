'use client';

import Image from 'next/image';
import { Hand, MapPin, Sparkles, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { NetworkCircle, NetworkMember } from '@/types/network.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

interface Props {
  circles: NetworkCircle[];
  members: NetworkMember[];
  /** True when the resolver widened a short page with recent members. */
  isWidened: boolean;
  hasTrade: boolean;
  hasCity: boolean;
  onImproveProfile: () => void;
  onOpenMember?: (userId: number) => void;
  onBlockMember?: (userId: number, name: string) => void;
}

/**
 * The member's circle, with the reasoning shown.
 *
 * THE TWO VISUAL STATES ARE NOT COSMETIC
 * --------------------------------------
 * A row with a score and reasons is a real match. A row with neither is a
 * widened placeholder from the cold-start ladder. They look different on
 * purpose: presenting a recent signup as "someone near you" would be a lie the
 * member can eventually discover, and it trains people to distrust the whole
 * surface.
 */
export const CircleList = ({
  circles,
  members,
  isWidened,
  hasTrade,
  hasCity,
  onImproveProfile,
  onOpenMember,
  onBlockMember,
}: Props) => {
  const matched = members.filter((m) => m.score > 0);
  const placeholders = members.filter((m) => m.score === 0);

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="You're early here"
        description={
          'Nobody else has joined yet. Add your trade and city so the right members find you as soon as they do, and be the first to post an ask.'
        }
        action={{ label: 'Complete my profile', onClick: onImproveProfile, icon: Sparkles }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {circles.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {circles.map((circle) => (
            <div
              key={circle.key}
              className="rounded-xl border border-[#e5e7eb] bg-[#FDFAF3] px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-gray-900">{circle.label}</p>
                <span className="text-xs font-bold text-[#B8962E]">
                  {circle.count} {circle.count === 1 ? 'member' : 'members'}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                {circle.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {matched.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {matched.map((member) => (
            <MemberRow
              key={member.user_id}
              member={member}
              onOpen={onOpenMember}
              onBlock={onBlockMember}
            />
          ))}
        </ul>
      )}

      {isWidened && placeholders.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-gray-100 bg-[#FDFAF3] px-4 py-2.5">
            <p className="text-xs font-semibold text-gray-600">
              Recently joined members — not matched to you yet
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {placeholders.map((member) => (
              <li key={member.user_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} url={member.profile_photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {member.business_name ?? member.business_category ?? 'New member'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!hasTrade || !hasCity) && (
        <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#FDFAF3] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">
                Sharpen your matches
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {!hasTrade && !hasCity
                  ? 'Your trade and city are the two strongest signals for matching. Add both and your circle gets more relevant.'
                  : !hasTrade
                    ? 'Add your trade. Members in the same line of business are the most useful connections you can be shown.'
                    : 'Add your city so members near you show up in your circle.'}
              </p>
              <button
                type="button"
                onClick={onImproveProfile}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#C9A84C] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#B8962E]"
              >
                <Sparkles size={13} />
                Improve my profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberRow = ({
  member,
  onOpen,
  onBlock,
}: {
  member: NetworkMember;
  onOpen?: (userId: number) => void;
  onBlock?: (userId: number, name: string) => void;
}) => (
  <li className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#FDFAF3]">
    <Avatar name={member.name} url={member.profile_photo_url} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
      <p className="truncate text-xs text-gray-500">
        {member.business_name ?? member.business_category ?? 'Member'}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {member.reasons.map((reason) => (
          <span
            key={reason}
            className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8A6F1F]"
          >
            <Hand size={10} />
            {reason}
          </span>
        ))}
        {member.city && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin size={10} />
            {member.city}
          </span>
        )}
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-1.5">
      {onOpen && (
        <button
          type="button"
          onClick={() => onOpen(member.user_id)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          View
        </button>
      )}
      {onBlock && (
        <button
          type="button"
          onClick={() => onBlock(member.user_id, member.name)}
          title={`Block ${member.name}`}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        >
          Block
        </button>
      )}
    </div>
  </li>
);

const Avatar = ({ name, url }: { name: string; url: string | null }) =>
  url ? (
    <Image
      src={url}
      alt={name}
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-sm font-bold text-[#B8962E]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
