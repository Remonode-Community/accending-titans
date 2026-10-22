'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Gift,
  Lock,
  MapPin,
  PartyPopper,
  Plus,
  Send,
  Sparkles,
  ThumbsUp,
  Trash2,
  Trophy,
  Utensils,
  Video,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { WishWall } from '@/components/birthday/WishWall';
import { formatCurrency } from '@/utils/format.utils';
import type {
  BirthdayActivity,
  BirthdayActivityStatus,
  BirthdayActivityType,
  BirthdayContribution,
  BirthdayRevealed,
  BirthdaySuggestion,
  BirthdayWish,
} from '@/types/birthday.types';
import type { NetworkMember } from '@/types/network.types';

const SHELL =
  'overflow-hidden rounded-[2rem] border border-[#ece7dd] bg-white shadow-[0_24px_60px_-40px_rgba(26,15,11,0.4)]';
const FIELD =
  'w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15';
const PRIMARY =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F3D27A] via-[#E6C56A] to-[#D9B96A] px-4 py-2.5 text-sm font-bold text-[#241410] shadow-[0_10px_24px_-14px_rgba(184,150,46,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50';
const GHOST =
  'inline-flex items-center gap-2 rounded-xl border border-[#ece7dd] bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#8A6F1F] disabled:cursor-not-allowed disabled:opacity-40';

interface JourneyStep {
  id: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
}

/* ─────────────────────────── shared pieces ─────────────────────────── */

function ProgressRing({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1ece2" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black leading-none text-gray-900">{done}</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-400">
          of {total}
        </span>
      </span>
    </div>
  );
}

function JourneyStepper({
  steps,
  active,
  done,
  onSelect,
}: {
  steps: JourneyStep[];
  active: number;
  done: boolean[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="border-b border-[#f1ece2] bg-[#fcfaf6] px-3 py-3 sm:px-5">
      <ol className="scrollbar-hide flex items-center gap-1 overflow-x-auto pb-0.5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === active;
          const isDone = done[index];

          return (
            <li key={step.id} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                  isActive
                    ? 'bg-[#1F120D] text-white shadow-[0_12px_26px_-18px_rgba(31,18,13,0.9)]'
                    : isDone
                      ? 'text-[#8A6F1F] hover:bg-[#FFF8E8]'
                      : 'text-gray-400 hover:bg-white hover:text-gray-600'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                    isActive
                      ? 'bg-[#F3D27A] text-[#241410]'
                      : isDone
                        ? 'bg-[#C9A84C]/15 text-[#8A6F1F]'
                        : 'bg-white text-gray-400 ring-1 ring-[#ece7dd]'
                  }`}
                >
                  {isDone && !isActive ? <Check size={12} /> : isDone ? <Icon size={12} /> : index + 1}
                </span>
                <span className="pr-0.5">
                  <span
                    className={`block text-[8px] font-bold uppercase tracking-[0.14em] ${
                      isActive ? 'text-white/45' : 'text-gray-400'
                    }`}
                  >
                    Step {index + 1}
                  </span>
                  <span className="block whitespace-nowrap text-[11px] font-bold">
                    {step.label}
                  </span>
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-1 h-px w-4 shrink-0 sm:w-6 ${
                    isDone ? 'bg-[#C9A84C]/50' : 'bg-[#e9e2d4]'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeader({
  index,
  total,
  icon: Icon,
  title,
  description,
  meta,
}: {
  index: number;
  total: number;
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3CF] to-[#F3D27A]/70 text-[#8A6F1F]">
          <Icon size={19} />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#B8962E]">
            Step {index + 1} of {total}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-gray-900">{title}</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">{description}</p>
        </div>
      </div>

      {meta && (
        <span className="rounded-full border border-[#C9A84C]/25 bg-[#FFF8E8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6F1F]">
          {meta}
        </span>
      )}
    </div>
  );
}

function JourneyFooter({
  active,
  total,
  done,
  locked,
  onBack,
  onNext,
}: {
  active: number;
  total: number;
  done: boolean;
  locked?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece2] bg-[#fcfaf6] px-5 py-4 sm:px-6">
      <button type="button" onClick={onBack} disabled={active === 0} className={GHOST}>
        <ArrowLeft size={14} />
        Back
      </button>

      <p className="hidden items-center gap-1.5 text-[11px] font-semibold text-gray-400 sm:flex">
        {locked ? (
          <>
            <Lock size={12} className="text-[#B8962E]" />
            Planning is closed
          </>
        ) : done ? (
          <>
            <CheckCircle2 size={13} className="text-[#B8962E]" />
            Step complete — nice work
          </>
        ) : (
          'Optional — you can come back anytime'
        )}
      </p>

      {active < total - 1 ? (
        <button type="button" onClick={onNext} className={GHOST}>
          Continue
          <ArrowRight size={14} />
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9A84C]/30 bg-[#FFF8E8] px-3 py-2 text-[11px] font-bold text-[#8A6F1F]">
          <Sparkles size={12} />
          Final step
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────── network journey ─────────────────────────── */

const NETWORK_STEPS: JourneyStep[] = [
  {
    id: 'wishes',
    label: 'Wish',
    blurb: 'Leave a message on the wall',
    icon: Send,
  },
  {
    id: 'gifts',
    label: 'Gift ideas',
    blurb: 'Suggest and vote on a gift',
    icon: Gift,
  },
  {
    id: 'plan',
    label: 'The plan',
    blurb: 'Agree what the network will do',
    icon: Sparkles,
  },
  {
    id: 'chip',
    label: 'Chip in',
    blurb: 'Pledge what you can towards it',
    icon: Wallet,
  },
  {
    id: 'send',
    label: 'Send it',
    blurb: 'Reveal the surprise to the celebrant',
    icon: PartyPopper,
  },
];

const ACTIVITY_TYPES: Array<{
  value: BirthdayActivityType;
  label: string;
  icon: LucideIcon;
}> = [
  { value: 'dinner', label: 'Dinner', icon: Utensils },
  { value: 'surprise_party', label: 'Surprise party', icon: PartyPopper },
  { value: 'group_call', label: 'Group call', icon: Video },
  { value: 'outing', label: 'Outing', icon: MapPin },
  { value: 'group_contribution', label: 'Contribution', icon: Wallet },
  { value: 'digital_gift', label: 'Digital gift', icon: Gift },
  { value: 'other', label: 'Something else', icon: Sparkles },
];

const STATUS_STYLES: Record<BirthdayActivityStatus, string> = {
  proposed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-[#C9A84C]/12 text-[#8A6F1F]',
  declined: 'bg-gray-100 text-gray-400',
  done: 'bg-emerald-50 text-emerald-700',
};

function activityMeta(type: BirthdayActivityType) {
  return ACTIVITY_TYPES.find((item) => item.value === type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
}

export interface NetworkJourneyProps {
  celebrantName: string;
  wishes: BirthdayWish[];
  planners?: NetworkMember[];
  suggestions: BirthdaySuggestion[];
  leadingSuggestionId: number | null;
  totalVotes: number;
  activities: BirthdayActivity[];
  contributions: BirthdayContribution[];
  totalPledged: number;
  revealed: boolean;
  planningLocked: boolean;
  busy: boolean;
  revealError: string | null;
  onPostWish: (message: string) => Promise<void>;
  onDeleteWish: (wishId: number) => Promise<void>;
  onSuggest: (
    title: string,
    description: string,
    cost: number | null
  ) => Promise<boolean>;
  onVote: (suggestionId: number, vote: boolean) => Promise<boolean>;
  onDeleteSuggestion: (id: number) => Promise<boolean>;
  onAddActivity: (title: string, type: BirthdayActivityType) => Promise<boolean>;
  onActivityStatus: (id: number, status: BirthdayActivityStatus) => Promise<boolean>;
  onContribute: (amount: number, note: string) => Promise<boolean>;
  onReveal: (suggestionId: number | null) => Promise<boolean>;
}

export function NetworkJourney({
  celebrantName,
  wishes,
  planners = [],
  suggestions,
  leadingSuggestionId,
  totalVotes,
  activities,
  contributions,
  totalPledged,
  revealed,
  planningLocked,
  busy,
  revealError,
  onPostWish,
  onDeleteWish,
  onSuggest,
  onVote,
  onDeleteSuggestion,
  onAddActivity,
  onActivityStatus,
  onContribute,
  onReveal,
}: NetworkJourneyProps) {
  const firstName = celebrantName.split(/\s+/)[0] || 'them';

  const [active, setActive] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [showSuggest, setShowSuggest] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideaCost, setIdeaCost] = useState('');

  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState<BirthdayActivityType>('dinner');

  const [pledge, setPledge] = useState('');
  const [pledgeNote, setPledgeNote] = useState('');

  const [confirmReveal, setConfirmReveal] = useState(false);

  const hasWish = wishes.length > 0;
  const hasIdeas = suggestions.length > 0;
  const hasActivity = activities.length > 0;
  const hasPledged = contributions.length > 0;
  const done = [hasWish, hasIdeas, hasActivity, hasPledged, revealed];
  const completed = done.filter(Boolean).length;

  const leadingSuggestion =
    suggestions.find((suggestion) => suggestion.id === leadingSuggestionId) ?? null;
  const target = leadingSuggestion?.estimated_cost ?? null;
  const fundedPercent =
    target && target > 0 ? Math.min(100, Math.round((totalPledged / target) * 100)) : null;

  const submitIdea = async () => {
    if (!ideaTitle.trim()) return;
    setFormError(null);
    const ok = await onSuggest(
      ideaTitle.trim(),
      ideaDescription.trim(),
      ideaCost ? Number(ideaCost) : null
    );
    if (ok) {
      setIdeaTitle('');
      setIdeaDescription('');
      setIdeaCost('');
      setShowSuggest(false);
    } else {
      setFormError('Could not add that idea. Please try again.');
    }
  };

  const submitActivity = async () => {
    if (!activityTitle.trim()) return;
    setFormError(null);
    const ok = await onAddActivity(activityTitle.trim(), activityType);
    if (ok) {
      setActivityTitle('');
    } else {
      setFormError('Could not add that activity. Please try again.');
    }
  };

  const submitPledge = async () => {
    const amount = Number(pledge);
    if (!amount || amount <= 0) return;
    setFormError(null);
    const ok = await onContribute(amount, pledgeNote.trim());
    if (ok) {
      setPledge('');
      setPledgeNote('');
    } else {
      setFormError('Could not record that pledge. Please try again.');
    }
  };

  const reveal = async () => {
    setFormError(null);
    const ok = await onReveal(leadingSuggestionId);
    if (ok) setConfirmReveal(false);
  };

  return (
    <section id="journey" className={`${SHELL} scroll-mt-24`}>
      <div className="border-b border-[#f1ece2] bg-gradient-to-r from-[#FFF8E8] via-white to-white px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B8962E]">
              Celebration studio
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
              Make {firstName}&rsquo;s day
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-gray-500">
              Five small steps, done together. Jump in anywhere — everything saves as you go.
            </p>
          </div>
          <ProgressRing done={completed} total={NETWORK_STEPS.length} />
        </div>
      </div>

      <JourneyStepper
        steps={NETWORK_STEPS}
        active={active}
        done={done}
        onSelect={setActive}
      />

      <div key={active} className="birthday-rise min-h-[24rem] p-5 sm:p-6 lg:p-8">
        {active === 0 && (
          <>
            <StepHeader
              index={0}
              total={NETWORK_STEPS.length}
              icon={Send}
              title={`Leave ${firstName} a wish`}
              description={`Write something ${firstName} will read on the day. Wishes stay hidden until then.`}
              meta={`${wishes.length} on the wall`}
            />
            <div className="mt-5">
              <WishWall
                celebrantName={celebrantName}
                wishes={wishes}
                canPost
                busy={busy}
                embedded
                onPost={onPostWish}
                onDelete={onDeleteWish}
              />
            </div>
          </>
        )}

        {active === 1 && (
          <>
            <StepHeader
              index={1}
              total={NETWORK_STEPS.length}
              icon={Gift}
              title={`What should we get ${firstName}?`}
              description="Add an idea, then vote on the one the group should rally behind."
              meta={`${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`}
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-gray-500">
                {suggestions.length === 0
                  ? 'No ideas yet — start the conversation.'
                  : `${suggestions.length} ${suggestions.length === 1 ? 'idea' : 'ideas'} · leading option is marked`}
              </p>
              {!planningLocked && (
                <button
                  type="button"
                  onClick={() => setShowSuggest((value) => !value)}
                  className={PRIMARY}
                >
                  {showSuggest ? <ArrowLeft size={14} /> : <Plus size={14} />}
                  {showSuggest ? 'Close' : 'Suggest an idea'}
                </button>
              )}
            </div>

            {showSuggest && !planningLocked && (
              <div className="mt-4 rounded-2xl border border-[#C9A84C]/25 bg-[#FFF8E8]/60 p-4">
                <input
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  maxLength={150}
                  placeholder="e.g. A weekend at a boutique resort"
                  aria-label="Gift idea"
                  className={FIELD}
                />
                <textarea
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Why would they love it? (optional)"
                  aria-label="Gift idea details"
                  className={`${FIELD} mt-2.5 resize-none`}
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <input
                    type="number"
                    min={0}
                    value={ideaCost}
                    onChange={(e) => setIdeaCost(e.target.value)}
                    placeholder="Estimated cost (₦)"
                    aria-label="Estimated cost"
                    className={`${FIELD} w-44`}
                  />
                  <button
                    type="button"
                    onClick={() => void submitIdea()}
                    disabled={busy || !ideaTitle.trim()}
                    className={PRIMARY}
                  >
                    <Check size={14} />
                    Add idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggest(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {suggestions.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#ddd5c5] bg-[#fcfaf6] p-8">
                <EmptyState
                  icon={Gift}
                  title="No ideas yet"
                  description="Be the first to suggest something. The group will vote on what to go with."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion) => {
                  const isLeading = suggestion.id === leadingSuggestionId;
                  return (
                    <article
                      key={suggestion.id}
                      className={`relative flex flex-col rounded-2xl border p-4 transition ${
                        isLeading
                          ? 'border-[#C9A84C]/45 bg-gradient-to-br from-[#FFF8E8] to-white shadow-[0_16px_30px_-26px_rgba(184,150,46,0.8)]'
                          : 'border-[#f1ece2] bg-white hover:border-[#C9A84C]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-sm font-black text-gray-900">{suggestion.title}</h4>
                            {isLeading && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8A6F1F]">
                                <Trophy size={9} />
                                Leading
                              </span>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                              {suggestion.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="relative h-4 w-4 overflow-hidden rounded-full bg-[#FDFAF3]">
                                {suggestion.suggested_by.profile_photo_url && (
                                  <Image
                                    src={suggestion.suggested_by.profile_photo_url}
                                    alt=""
                                    fill
                                    sizes="16px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                )}
                              </span>
                              {suggestion.suggested_by.name}
                            </span>
                            {suggestion.estimated_cost !== null && (
                              <span className="font-semibold text-gray-500">
                                ≈ {formatCurrency(suggestion.estimated_cost)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void onDeleteSuggestion(suggestion.id)}
                          aria-label="Remove suggestion"
                          disabled={planningLocked}
                          className="shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f1ece2] pt-3">
                        <button
                          type="button"
                          onClick={() => void onVote(suggestion.id, !suggestion.viewer_has_voted)}
                          disabled={planningLocked}
                          aria-pressed={suggestion.viewer_has_voted}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                            suggestion.viewer_has_voted
                              ? 'bg-[#1F120D] text-white'
                              : 'border border-[#ece7dd] bg-white text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#8A6F1F]'
                          }`}
                        >
                          <ThumbsUp
                            size={12}
                            className={suggestion.viewer_has_voted ? 'fill-[#F3D27A] text-[#F3D27A]' : ''}
                          />
                          {suggestion.viewer_has_voted ? 'Voted' : 'Vote'}
                          <span
                            className={
                              suggestion.viewer_has_voted ? 'text-[#F3D27A]' : 'text-gray-900'
                            }
                          >
                            {suggestion.votes_count}
                          </span>
                        </button>
                        <span className="text-[10px] font-semibold text-gray-400">
                          {suggestion.votes_count === 1 ? '1 vote' : `${suggestion.votes_count} votes`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {planners.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#f1ece2] bg-[#fcfaf6] p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#B8962E]">
                  Loop in your circle
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {planners.slice(0, 6).map((planner) => (
                    <Link
                      key={planner.user_id}
                      href={`/dashboard/birthdays/${planner.user_id}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-[#ece7dd] bg-white py-1 pl-1 pr-2.5 text-[11px] font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#8A6F1F]"
                    >
                      {planner.profile_photo_url ? (
                        <Image
                          src={planner.profile_photo_url}
                          alt=""
                          width={22}
                          height={22}
                          unoptimized
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[9px] font-black text-[#8A6F1F]">
                          {planner.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {planner.name.split(/\s+/)[0]}
                      <ChevronRight
                        size={11}
                        className="text-gray-300 transition group-hover:translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {active === 2 && (
          <>
            <StepHeader
              index={2}
              total={NETWORK_STEPS.length}
              icon={Sparkles}
              title="What does the day look like?"
              description={`Agree on the plan so everyone knows what they are part of. ${firstName} only sees it once you reveal.`}
              meta={`${activities.length} planned`}
            />

            {!planningLocked && (
              <div className="mt-5 rounded-2xl border border-[#f1ece2] bg-[#fcfaf6] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Choose a kind of celebration
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ACTIVITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const selected = type.value === activityType;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setActivityType(type.value)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                          selected
                            ? 'bg-[#1F120D] text-white'
                            : 'border border-[#ece7dd] bg-white text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#8A6F1F]'
                        }`}
                      >
                        <Icon
                          size={12}
                          className={selected ? 'text-[#F3D27A]' : 'text-[#C9A84C]'}
                        />
                        {type.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  <input
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    maxLength={150}
                    placeholder={`e.g. Dinner for ${firstName} and the circle`}
                    aria-label="Activity title"
                    className={`${FIELD} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => void submitActivity()}
                    disabled={busy || !activityTitle.trim()}
                    className={PRIMARY}
                  >
                    <Plus size={14} />
                    Add activity
                  </button>
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#ddd5c5] bg-white p-8">
                <EmptyState
                  icon={Sparkles}
                  title="Nothing planned yet"
                  description="Suggest a dinner, a surprise party or a group call so everyone can coordinate."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {activities.map((activity) => {
                  const meta = activityMeta(activity.activity_type);
                  const Icon = meta.icon;
                  return (
                    <article
                      key={activity.id}
                      className="rounded-2xl border border-[#f1ece2] bg-white p-4 transition hover:border-[#C9A84C]/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E8] text-[#8A6F1F]">
                          <Icon size={15} />
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                            STATUS_STYLES[activity.status] ?? STATUS_STYLES.proposed
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                      <h4 className="mt-2.5 text-sm font-black text-gray-900">{activity.title}</h4>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Proposed by {activity.created_by.name}
                      </p>
                      {activity.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                          {activity.description}
                        </p>
                      )}
                      {activity.status === 'proposed' && !planningLocked && (
                        <button
                          type="button"
                          onClick={() => void onActivityStatus(activity.id, 'confirmed')}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#ece7dd] bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-500 transition hover:border-[#C9A84C]/40 hover:text-[#8A6F1F]"
                        >
                          <Check size={12} />
                          Confirm this plan
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {active === 3 && (
          <>
            <StepHeader
              index={3}
              total={NETWORK_STEPS.length}
              icon={Wallet}
              title="Chip in what you can"
              description="Pledges are intent only — no money leaves any wallet. They simply show the group what is realistic."
              meta={formatCurrency(totalPledged)}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#C9A84C]/25 bg-[#1F120D] p-5 text-white">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Total pledged
                </p>
                <p className="mt-1.5 text-3xl font-black text-[#F3D27A]">
                  {formatCurrency(totalPledged)}
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  from {contributions.length}{' '}
                  {contributions.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#f1ece2] bg-white p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  The goal
                </p>
                <p className="mt-1.5 truncate text-lg font-black text-gray-900">
                  {leadingSuggestion?.title ?? 'No gift chosen yet'}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {target ? `${formatCurrency(target)} estimated` : 'Add a gift idea to set a target'}
                </p>
              </div>
            </div>

            {target !== null && fundedPercent !== null && (
              <div className="mt-3 rounded-2xl border border-[#f1ece2] bg-[#fcfaf6] p-4">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>Progress towards the gift</span>
                  <span className="text-[#8A6F1F]">{fundedPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ece7dd]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F3D27A] to-[#C9A84C] transition-all duration-700"
                    style={{ width: `${fundedPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  {formatCurrency(totalPledged)} of {formatCurrency(target)} pledged
                </p>
              </div>
            )}

            {!planningLocked && (
              <div className="mt-4 rounded-2xl border border-[#f1ece2] bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Add your pledge
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[2000, 5000, 10000, 20000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPledge(String(amount))}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                        Number(pledge) === amount
                          ? 'bg-[#1F120D] text-white'
                          : 'border border-[#ece7dd] bg-white text-gray-500 hover:border-[#C9A84C]/40 hover:text-[#8A6F1F]'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  <input
                    type="number"
                    min={1}
                    value={pledge}
                    onChange={(e) => setPledge(e.target.value)}
                    placeholder="Amount (₦)"
                    aria-label="Pledge amount"
                    className={`${FIELD} w-36`}
                  />
                  <input
                    value={pledgeNote}
                    onChange={(e) => setPledgeNote(e.target.value)}
                    maxLength={200}
                    placeholder="Add a note (optional)"
                    aria-label="Pledge note"
                    className={`${FIELD} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => void submitPledge()}
                    disabled={busy || !pledge || Number(pledge) <= 0}
                    className={PRIMARY}
                  >
                    <Wallet size={14} />
                    Pledge
                  </button>
                </div>

                <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-400">
                  <Lock size={10} className="mt-0.5 shrink-0" />
                  These are pledges of intent only. No money is taken from any wallet.
                </p>
              </div>
            )}

            {contributions.length > 0 && (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#f1ece2] bg-white p-3"
                  >
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#FDFAF3]">
                      {contribution.contributor.profile_photo_url ? (
                        <Image
                          src={contribution.contributor.profile_photo_url}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#8A6F1F]">
                          {contribution.contributor.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-gray-900">
                        {contribution.contributor.name}
                      </p>
                      {contribution.note && (
                        <p className="truncate text-[10px] text-gray-400">{contribution.note}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-black text-gray-900 tabular-nums">
                      {formatCurrency(contribution.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {active === 4 && (
          <>
            <StepHeader
              index={4}
              total={NETWORK_STEPS.length}
              icon={PartyPopper}
              title={revealed ? `${firstName} has seen it all` : 'Ready to send it?'}
              description={
                revealed
                  ? 'The surprise is out. The wall stays open for anyone who still wants to add a message.'
                  : `Revealing shows ${firstName} the gift, the plan and the wall — then closes planning for good.`
              }
              meta={revealed ? 'Revealed' : 'Final step'}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: 'The gift',
                  value: leadingSuggestion?.title ?? 'Still deciding',
                  icon: Gift,
                },
                { label: 'Pledged', value: formatCurrency(totalPledged), icon: Wallet },
                {
                  label: 'The plan',
                  value: `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`,
                  icon: Sparkles,
                },
                {
                  label: 'The wall',
                  value: `${wishes.length} ${wishes.length === 1 ? 'wish' : 'wishes'}`,
                  icon: Send,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#f1ece2] bg-white p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF8E8] text-[#8A6F1F]">
                      <Icon size={14} />
                    </span>
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-black text-gray-900">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[#f1ece2] bg-[#fcfaf6] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                The group&rsquo;s progress
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {NETWORK_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.id} className="flex items-center gap-2.5 text-[11px]">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          done[index]
                            ? 'bg-[#C9A84C]/15 text-[#8A6F1F]'
                            : 'bg-white text-gray-300 ring-1 ring-[#ece7dd]'
                        }`}
                      >
                        {done[index] ? <Check size={11} /> : <Icon size={11} />}
                      </span>
                      <span className={done[index] ? 'font-semibold text-gray-700' : 'text-gray-400'}>
                        {step.blurb}
                      </span>
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        {done[index] ? 'Done' : 'Optional'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {(formError || revealError) && (
              <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
                {formError ?? revealError}
              </p>
            )}

            {revealed ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <p className="text-sm font-black text-emerald-900">The surprise is out</p>
                  <p className="text-xs text-emerald-700">
                    {firstName} can now see the gift, the plan and every wish.
                  </p>
                </div>
              </div>
            ) : planningLocked ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#f1ece2] bg-[#fcfaf6] p-4">
                <Lock size={16} className="text-[#B8962E]" />
                <p className="text-xs font-semibold text-gray-500">
                  Planning is closed. The surprise has already been shared.
                </p>
              </div>
            ) : (
              <div className="mt-5 relative overflow-hidden rounded-2xl border border-[#E6C56A]/30 bg-[#1F120D] p-5 text-white">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(100%_140%_at_100%_0%,rgba(201,168,76,0.18),transparent_60%)]"
                />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E6C56A]/70">
                      The finishing touch
                    </p>
                    <p className="mt-1 text-base font-black text-[#FFF8E8]">
                      Send the celebration to {firstName}
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-white/50">
                      This cannot be undone. Once revealed, planning closes and the wall opens.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {confirmReveal ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void reveal()}
                            disabled={busy}
                            className={PRIMARY}
                          >
                            <PartyPopper size={14} />
                            {busy ? 'Revealing…' : 'Yes, reveal it'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReveal(false)}
                            disabled={busy}
                            className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:opacity-60"
                          >
                            Not yet
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmReveal(true)}
                          className={PRIMARY}
                        >
                          <Gift size={14} />
                          Reveal the surprise
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="birthday-float flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E6C56A]/25 bg-[#E6C56A]/10 text-[#F3D27A]">
                    <PartyPopper size={24} />
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <JourneyFooter
        active={active}
        total={NETWORK_STEPS.length}
        done={done[active]}
        locked={planningLocked && !revealed}
        onBack={() => setActive((value) => Math.max(0, value - 1))}
        onNext={() => setActive((value) => Math.min(NETWORK_STEPS.length - 1, value + 1))}
      />
    </section>
  );
}

/* ─────────────────────────── celebrant journey ─────────────────────────── */

const CELEBRANT_STEPS: JourneyStep[] = [
  {
    id: 'surprise',
    label: 'The surprise',
    blurb: 'What your network arranged',
    icon: Gift,
  },
  {
    id: 'wishes',
    label: 'Wish wall',
    blurb: 'Messages from your people',
    icon: Send,
  },
];

export interface CelebrantJourneyProps {
  firstName: string;
  wishes: BirthdayWish[];
  revealed?: BirthdayRevealed;
  surpriseInProgress: boolean;
  busy: boolean;
  onDeleteWish: (wishId: number) => Promise<void>;
}

export function CelebrantJourney({
  firstName,
  wishes,
  revealed,
  surpriseInProgress,
  busy,
  onDeleteWish,
}: CelebrantJourneyProps) {
  const [active, setActive] = useState(0);

  const done = [Boolean(revealed || surpriseInProgress), wishes.length > 0];

  return (
    <section id="journey" className={`${SHELL} scroll-mt-24`}>
      <div className="border-b border-[#f1ece2] bg-gradient-to-r from-[#FFF8E8] via-white to-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B8962E]">
              Your celebration
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
              Everything they made for you
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-gray-500">
              Two chapters, opened just for you. Start with the surprise, then read every wish.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/25 bg-[#FFF8E8] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6F1F]">
            <Send size={11} />
            {wishes.length} {wishes.length === 1 ? 'wish' : 'wishes'}
          </span>
        </div>
      </div>

      <JourneyStepper
        steps={CELEBRANT_STEPS}
        active={active}
        done={done}
        onSelect={setActive}
      />

      <div key={active} className="birthday-rise min-h-[20rem] p-5 sm:p-6 lg:p-8">
        {active === 0 &&
          (revealed ? (
            <RevealedStage revealed={revealed} firstName={firstName} />
          ) : surpriseInProgress ? (
            <SealedStage firstName={firstName} />
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#ddd5c5] bg-[#fcfaf6] p-8 text-center">
              <Gift size={26} className="mx-auto text-[#C9A84C]" />
              <h3 className="mt-3 text-lg font-black tracking-tight text-gray-900">
                Nothing public yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
                When your network finishes planning, their surprise will appear here.
              </p>
            </div>
          ))}

        {active === 1 && (
          <>
            <StepHeader
              index={1}
              total={CELEBRANT_STEPS.length}
              icon={Send}
              title="Words from your people"
              description="Every message here was written for you. Take your time with them."
              meta={`${wishes.length} on the wall`}
            />
            <div className="mt-5">
              <WishWall
                celebrantName={firstName}
                wishes={wishes}
                canPost={false}
                busy={busy}
                embedded
                onPost={async () => {}}
                onDelete={onDeleteWish}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece2] bg-[#fcfaf6] px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setActive((value) => Math.max(0, value - 1))}
          disabled={active === 0}
          className={GHOST}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <p className="hidden items-center gap-1.5 text-[11px] font-semibold text-gray-400 sm:flex">
          <Sparkles size={12} className="text-[#B8962E]" />
          {active === 0 ? 'Chapter one' : 'Chapter two'}
        </p>

        {active < CELEBRANT_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setActive((value) => Math.min(CELEBRANT_STEPS.length - 1, value + 1))}
            className={GHOST}
          >
            Read the wall
            <ArrowRight size={14} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9A84C]/30 bg-[#FFF8E8] px-3 py-2 text-[11px] font-bold text-[#8A6F1F]">
            <CheckCircle2 size={12} />
            All caught up
          </span>
        )}
      </div>
    </section>
  );
}

function SealedStage({ firstName }: { firstName: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#E6C56A]/30 bg-[#241410] px-6 py-10 text-center text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_0%,rgba(201,168,76,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="birthday-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E6C56A]/30 bg-[#E6C56A]/10 text-[#F3D27A]">
          <Lock size={22} />
        </span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E6C56A]/70">
          Sealed with care
        </p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-[#FFF8E8] sm:text-3xl">
          {firstName}, something is being planned
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          People are quietly organising a surprise for your birthday. We cannot tell you what it
          is yet &mdash; that is the point. It will be waiting for you on the day.
        </p>
        <p className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          <Lock size={10} className="text-[#F3D27A]" />
          Details stay private so the surprise stays a surprise
        </p>
      </div>
    </div>
  );
}

function RevealedStage({
  revealed,
  firstName,
}: {
  revealed: BirthdayRevealed;
  firstName: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#C9A84C]/35 bg-gradient-to-br from-[#FFF8E8] via-white to-[#FBF0D7] p-5 shadow-[0_22px_50px_-30px_rgba(184,150,46,0.55)] sm:p-6">
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#E6C56A]/20 blur-2xl"
      />
      <div aria-hidden className="birthday-float absolute right-5 top-5 text-[#C9A84C]/30">
        <Sparkles size={24} />
      </div>

      <div className="relative">
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#B8962E]">
          The surprise, unwrapped
        </p>
        <h3 className="mt-1.5 flex items-center gap-2.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
          <Gift size={21} className="text-[#B8962E]" />
          What your network arranged
        </h3>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
          {revealed.selected_suggestion ? (
            <div className="rounded-2xl border border-[#C9A84C]/25 bg-white p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B8962E]">
                The gift
              </p>
              <p className="mt-1.5 text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                {revealed.selected_suggestion.title}
              </p>
              {revealed.selected_suggestion.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  {revealed.selected_suggestion.description}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#C9A84C]/25 bg-white p-5 text-sm leading-relaxed text-gray-600">
              Your network has something planned, but no single gift was chosen.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#1F120D] p-4 text-white">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
                Chipped in
              </p>
              <p className="mt-1 text-xl font-black text-[#F3D27A]">
                {formatCurrency(revealed.total_pledged)}
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">from your people, together</p>
            </div>
            {revealed.activities.length > 0 && (
              <div className="rounded-2xl border border-[#C9A84C]/20 bg-white p-4">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Activities
                </p>
                <p className="mt-1 text-xl font-black text-gray-900">
                  {revealed.activities.length}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">planned for you</p>
              </div>
            )}
          </div>
        </div>

        {revealed.activities.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B8962E]">
              What they have in store
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {revealed.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700"
                >
                  <Check size={10} className="text-[#B8962E]" />
                  {activity.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-5 border-t border-[#C9A84C]/20 pt-3.5 text-sm italic text-gray-500">
          Happy birthday, {firstName}. This is what your network does for you.
        </p>
      </div>
    </div>
  );
}
