'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Gift, Lock, Plus, Sparkles, ThumbsUp, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/format.utils';
import type {
  BirthdayActivity,
  BirthdayActivityStatus,
  BirthdayActivityType,
  BirthdayContribution,
  BirthdaySuggestion,
} from '@/types/birthday.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

interface Props {
  celebrantName: string;
  suggestions: BirthdaySuggestion[];
  leadingSuggestionId: number | null;
  totalVotes: number;
  activities: BirthdayActivity[];
  contributions: BirthdayContribution[];
  totalPledged: number;
  revealed: boolean;
  planningLocked: boolean;
  busy?: boolean;
  onSuggest: (title: string, description: string, cost: number | null) => Promise<boolean>;
  onVote: (suggestionId: number, vote: boolean) => Promise<boolean>;
  onDeleteSuggestion: (id: number) => Promise<boolean>;
  onAddActivity: (title: string, type: BirthdayActivityType) => Promise<boolean>;
  onActivityStatus: (id: number, status: BirthdayActivityStatus) => Promise<boolean>;
  onContribute: (amount: number, note: string) => Promise<boolean>;
}

/** Icon + label per activity kind, so the board reads at a glance. */
const ACTIVITY_META: Record<BirthdayActivityType, { label: string; emoji: string }> = {
  dinner: { label: 'Birthday dinner', emoji: '🍽️' },
  surprise_party: { label: 'Surprise party', emoji: '🎉' },
  group_call: { label: 'Group video call', emoji: '📹' },
  outing: { label: 'Group outing', emoji: '🎟️' },
  group_contribution: { label: 'Group contribution', emoji: '💰' },
  digital_gift: { label: 'Digital gift', emoji: '💝' },
  other: { label: 'Activity', emoji: '✨' },
};

const STATUS_STYLES: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-[#C9A84C]/10 text-[#B8962E]',
  declined: 'bg-gray-100 text-gray-400',
  done: 'bg-emerald-50 text-emerald-700',
};

/**
 * The network's secret planning room.
 *
 * This component is only ever mounted when the server included a `planning`
 * key in the response, which it does exclusively for members of the celebrant's
 * network. Nothing here renders an empty state for the celebrant, because the
 * celebrant never receives the data to render.
 */
export function GiftPlanningPanel({
  celebrantName,
  suggestions,
  leadingSuggestionId,
  totalVotes,
  activities,
  contributions,
  totalPledged,
  revealed,
  planningLocked,
  busy = false,
  onSuggest,
  onVote,
  onDeleteSuggestion,
  onAddActivity,
  onActivityStatus,
  onContribute,
}: Props) {
  const firstName = celebrantName.split(/\s+/)[0] || 'them';

  const [showSuggest, setShowSuggest] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState<BirthdayActivityType>('dinner');

  const [pledge, setPledge] = useState('');
  const [pledgeNote, setPledgeNote] = useState('');

  const submitSuggestion = async () => {
    if (!title.trim()) return;
    setError(null);
    try {
      await onSuggest(title.trim(), description.trim(), cost ? Number(cost) : null);
      setTitle('');
      setDescription('');
      setCost('');
      setShowSuggest(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the suggestion');
    }
  };

  const submitActivity = async () => {
    if (!activityTitle.trim()) return;
    setError(null);
    try {
      await onAddActivity(activityTitle.trim(), activityType);
      setActivityTitle('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the activity');
    }
  };

  const submitPledge = async () => {
    const amount = Number(pledge);
    if (!amount || amount <= 0) return;
    setError(null);
    try {
      await onContribute(amount, pledgeNote.trim());
      setPledge('');
      setPledgeNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the pledge');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Gift voting ── */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="border-b border-[#e5e7eb] bg-gradient-to-r from-[#FDFAF3] to-transparent px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#B8962E]">
                <Gift size={17} />
              </span>
              <div>
                <h2 className="text-base font-black tracking-tight text-gray-900">
                  What should we get {firstName}?
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {totalVotes === 0
                    ? 'Add the first idea, then let the group vote.'
                    : `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'} cast · leading option marked`}
                </p>
              </div>
            </div>

            {!planningLocked && (
              <Button size="sm" variant="outline" onClick={() => setShowSuggest((v) => !v)}>
                <Plus size={13} />
                Suggest
              </Button>
            )}
          </div>
        </div>

        {/* Secret banner */}
        <div className="flex items-start gap-2.5 border-b border-[#C9A84C]/20 bg-[#C9A84C]/[0.07] px-5 py-3 sm:px-6">
          <Lock size={13} className="mt-0.5 shrink-0 text-[#B8962E]" />
          <p className="text-[11px] leading-relaxed text-[#B8962E]">
            Only you and the other members of {firstName}&rsquo;s network can see
            this. {firstName} is not sent any of it, and cannot retrieve it from
            the API either.
          </p>
        </div>

        {showSuggest && !planningLocked && (
          <div className="space-y-3 border-b border-[#e5e7eb] bg-[#FDFAF3]/50 p-4 sm:p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="e.g. A weekend at a boutique resort"
              aria-label="Gift idea"
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Why do you think they'd love it? (optional)"
              aria-label="Gift idea details"
              className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Estimated cost (₦)"
                aria-label="Estimated cost"
                className="w-44 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
              />
              <Button size="sm" onClick={submitSuggestion} isLoading={busy}>
                <Check size={13} />
                Add idea
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSuggest(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {suggestions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Gift}
              title="No ideas yet"
              description="Be the first to suggest something. The group will vote on what to go with."
            />
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e7eb]">
            {suggestions.map((s) => {
              const isLeading = s.id === leadingSuggestionId;
              return (
                <li
                  key={s.id}
                  className={`flex gap-3.5 px-5 py-4 transition sm:px-6 ${
                    isLeading ? 'bg-[#FDFAF3]/60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void onVote(s.id, !s.viewer_has_voted)}
                    aria-pressed={s.viewer_has_voted}
                    aria-label={`Vote for ${s.title}`}
                    className={`mt-0.5 flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border transition ${
                      s.viewer_has_voted
                        ? 'border-[#C9A84C] bg-[#C9A84C] text-white'
                        : 'border-[#e5e7eb] bg-white text-gray-400 hover:border-[#C9A84C]/50 hover:text-[#C9A84C]'
                    }`}
                  >
                    <ThumbsUp size={13} className={s.viewer_has_voted ? 'fill-white' : ''} />
                    <span className="mt-0.5 text-[11px] font-black leading-none tabular-nums">
                      {s.votes_count}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{s.title}</p>
                      {isLeading && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B8962E]">
                          <Trophy size={10} />
                          Leading
                        </span>
                      )}
                      {revealed && leadingSuggestionId === s.id && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Chosen
                        </span>
                      )}
                    </div>

                    {s.description && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        {s.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                      {s.suggested_by.id && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="relative h-4 w-4 overflow-hidden rounded-full bg-[#FDFAF3]">
                            {s.suggested_by.profile_photo_url && (
                              <Image
                                src={s.suggested_by.profile_photo_url}
                                alt=""
                                fill
                                sizes="16px"
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </span>
                          {s.suggested_by.name}
                        </span>
                      )}
                      {s.estimated_cost !== null && (
                        <span className="font-semibold text-gray-500">
                          ≈ {formatCurrency(s.estimated_cost)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onDeleteSuggestion(s.id)}
                    aria-label="Remove suggestion"
                    className="h-7 shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Activities ── */}
      <section className={CARD}>
        <div className="border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
          <h2 className="text-base font-black tracking-tight text-gray-900">
            Celebration activities
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Coordinate what the network will actually do on the day.
          </p>
        </div>

        {!planningLocked && (
          <div className="flex flex-wrap gap-2.5 border-b border-[#e5e7eb] bg-[#FDFAF3]/40 p-4 sm:p-5">
            <input
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              maxLength={150}
              placeholder="Add an activity, e.g. Dinner at Lodge 44"
              aria-label="Activity title"
              className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
            />
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as BirthdayActivityType)}
              aria-label="Activity type"
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A84C]"
            >
              {Object.entries(ACTIVITY_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.emoji} {meta.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={submitActivity} isLoading={busy} disabled={!activityTitle.trim()}>
              <Plus size={13} />
              Add
            </Button>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Sparkles}
              title="Nothing planned yet"
              description="Suggest a dinner, a surprise party or a group call so everyone can coordinate."
            />
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e7eb]">
            {activities.map((a) => {
              const meta = ACTIVITY_META[a.activity_type] ?? ACTIVITY_META.other;
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span aria-hidden className="text-lg">
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{a.title}</p>
                    <p className="text-[11px] text-gray-400">
                      Proposed by {a.created_by.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[a.status] ?? STATUS_STYLES.proposed}`}
                  >
                    {a.status}
                  </span>
                  {a.status === 'proposed' && !planningLocked && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onActivityStatus(a.id, 'confirmed')}
                      aria-label={`Confirm ${a.title}`}
                    >
                      <Check size={13} />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Contributions ── */}
      <section className={CARD}>
        <div className="border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
          <h2 className="text-base font-black tracking-tight text-gray-900">
            Group contribution
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Record what the group intends to chip in so you know what is realistic.
          </p>
        </div>

        <div className="border-b border-[#e5e7eb] bg-[#FDFAF3]/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {formatCurrency(totalPledged)}
            </span>
            <span className="text-xs text-gray-500">
              pledged by {contributions.length}{' '}
              {contributions.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-400">
            <Lock size={11} className="mt-0.5 shrink-0" />
            These are pledges of intent only. No money is taken from any wallet and
            nothing is held on their behalf.
          </p>

          {!planningLocked && (
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <input
                type="number"
                min={1}
                value={pledge}
                onChange={(e) => setPledge(e.target.value)}
                placeholder="Amount (₦)"
                aria-label="Pledge amount"
                className="w-36 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
              />
              <input
                value={pledgeNote}
                onChange={(e) => setPledgeNote(e.target.value)}
                maxLength={200}
                placeholder="Note (optional)"
                aria-label="Pledge note"
                className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
              />
              <Button
                size="sm"
                onClick={submitPledge}
                isLoading={busy}
                disabled={!pledge || Number(pledge) <= 0}
              >
                Pledge
              </Button>
            </div>
          )}
        </div>

        {contributions.length > 0 && (
          <ul className="divide-y divide-[#e5e7eb]">
            {contributions.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#FDFAF3]">
                  {c.contributor.profile_photo_url && (
                    <Image
                      src={c.contributor.profile_photo_url}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {c.contributor.name}
                  </p>
                  {c.note && <p className="truncate text-[11px] text-gray-400">{c.note}</p>}
                </div>
                <span className="shrink-0 text-sm font-black text-gray-900 tabular-nums">
                  {formatCurrency(c.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

