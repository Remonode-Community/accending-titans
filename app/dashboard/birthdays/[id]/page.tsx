'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Lock,
  PartyPopper,
  Sparkles,
  Users,
} from 'lucide-react';
import { CelebrationHero } from '@/components/birthday/CelebrationHero';
import { GiftPlanningPanel } from '@/components/birthday/GiftPlanningPanel';
import { WishWall } from '@/components/birthday/WishWall';
import { EmptyState } from '@/components/shared/EmptyState';
import { birthdayService } from '@/services/birthday.service';
import { formatCurrency } from '@/utils/format.utils';
import type {
  BirthdayActivityStatus,
  BirthdayActivityType,
  BirthdayCelebrationPage,
} from '@/types/birthday.types';

const CARD =
  'rounded-[1.75rem] border border-[#ece7dd] bg-white shadow-[0_18px_40px_-28px_rgba(26,15,11,0.25)]';

/**
 * A single member's birthday celebration.
 *
 * ONE COMPONENT, TWO EXPERIENCES
 * -----------------------------
 * The server decides which of these a visitor gets by omitting `planning` and
 * setting `viewer_role`. A network member receives the planning room; the
 * celebrant receives the celebration.
 *
 * The split is enforced by the data, not by `if` statements: if `planning` is
 * undefined there is nothing to render, because the celebrant's response never
 * contained it. A member who forges a request cannot get it — the API refuses
 * them with 403 regardless of what this component does.
 */
export default function CelebrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [userId, setUserId] = useState<number | null>(null);
  const [data, setData] = useState<BirthdayCelebrationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void params.then((p) => {
      const id = Number(p.id);
      if (!cancelled) setUserId(Number.isFinite(id) && id > 0 ? id : null);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const load = useCallback(async () => {
    if (userId === null) return;
    try {
      setLoading(true);
      setError(null);
      const res = await birthdayService.getCelebration(userId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message ?? 'Could not load this celebration');
      }
    } catch {
      setError('Could not load this celebration');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  /** Wraps a mutation, shows a busy state, then reloads so the server stays authoritative. */
  const run = useCallback(
    async (action: () => Promise<{ success: boolean; message?: string }>) => {
      setBusy(true);
      try {
        const res = await action();
        if (!res.success) {
          setError(res.message ?? 'That did not work');
          return false;
        }
        await load();
        return true;
      } catch {
        setError('That did not work');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load]
  );

  if (userId === null || loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-36 animate-pulse rounded-full bg-[#f3eee4]" />
        <div className="h-[26rem] animate-pulse rounded-[2rem] bg-[#1A0F0B]/90" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${CARD} h-56 animate-pulse`} />
          <div className={`${CARD} h-56 animate-pulse`} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`${CARD} p-8`}>
        <EmptyState
          icon={PartyPopper}
          title="Celebration unavailable"
          description={error}
          action={{
            label: 'Back to birthdays',
            onClick: () => (window.location.href = '/dashboard/birthdays'),
          }}
        />
      </div>
    );
  }

  if (!data) return null;

  const isCelebrant = data.viewer_role === 'celebrant';
  const planning = data.planning;
  const firstName = data.celebrant.name.split(/\s+/)[0] || 'them';
  const wishes = data.wishes ?? [];
  const planningOpen = Boolean(planning && !planning.planning_locked);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/birthdays"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#ece7dd] bg-white px-3.5 py-2 text-xs font-bold text-gray-500 shadow-sm transition hover:border-[#C9A84C]/40 hover:text-[#B8962E]"
        >
          <ArrowLeft size={14} />
          All birthdays
        </Link>

        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <Sparkles size={12} className="text-[#C9A84C]" />
          Made for {firstName}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {error}
        </p>
      )}

      <CelebrationHero
        celebrant={data.celebrant}
        countdown={data.countdown}
        viewerRole={data.viewer_role}
        wishesCount={wishes.length}
        surpriseInProgress={Boolean(isCelebrant && data.surprise_in_progress)}
        planningOpen={planningOpen}
      />

      {/* ── The celebrant's view: the tease, then the reveal ── */}
      {isCelebrant &&
        (data.surprise_in_progress ? (
          <SurpriseSealed firstName={firstName} />
        ) : data.revealed ? (
          <RevealedPanel revealed={data.revealed} firstName={firstName} />
        ) : null)}

      {/* ── Network-only: who else is likely helping ── */}
      {!isCelebrant && data.likely_planners && data.likely_planners.length > 0 && (
        <LikelyPlanners planners={data.likely_planners} />
      )}

      {/* ── Network-only planning ── */}
      {!isCelebrant && planning && (
        <section id="planning" className="scroll-mt-24">
          <SectionHeading
            overline="Behind the scenes"
            title="Planning room"
            description={`Organise ${firstName}'s surprise together — suggest a gift, vote on ideas, and keep the plan in one place.`}
          />

          <GiftPlanningPanel
            celebrantName={firstName}
            suggestions={planning.suggestions}
            leadingSuggestionId={planning.leading_suggestion_id}
            totalVotes={planning.total_votes}
            activities={planning.activities}
            contributions={planning.contributions.items}
            totalPledged={planning.contributions.total_pledged}
            revealed={planning.revealed}
            planningLocked={planning.planning_locked}
            busy={busy}
            onSuggest={(t, d, c) =>
              run(() =>
                birthdayService.createSuggestion(userId, {
                  title: t,
                  description: d,
                  estimated_cost: c,
                })
              )
            }
            onVote={(id, v) => run(() => birthdayService.vote(id, v))}
            onDeleteSuggestion={(id) => run(() => birthdayService.deleteSuggestion(id))}
            onAddActivity={(t, type: BirthdayActivityType) =>
              run(() => birthdayService.createActivity(userId, { title: t, activity_type: type }))
            }
            onActivityStatus={(id, s: BirthdayActivityStatus) =>
              run(() => birthdayService.updateActivityStatus(id, s))
            }
            onContribute={(amount, note) =>
              run(() => birthdayService.createContribution(userId, { amount, note }))
            }
          />
        </section>
      )}

      {/* ── Wishes ── */}
      <section id="wishes" className="scroll-mt-24">
        <SectionHeading
          overline={isCelebrant ? 'Just for you' : 'Say something'}
          title={isCelebrant ? 'Your wish wall' : 'The birthday wall'}
          description={
            isCelebrant
              ? 'Every message here was written for you. Take your time.'
              : `Leave a message ${firstName} will keep. It unlocks on the day.`
          }
        />

        <WishWall
          celebrantId={userId}
          celebrantName={data.celebrant.name}
          wishes={wishes}
          canPost={!isCelebrant}
          busy={busy}
          onPost={async (message) => {
            const res = await birthdayService.postWish(userId, message);
            if (!res.success) throw new Error(res.message ?? 'Could not post your wish');
            await load();
          }}
          onDelete={async (wishId) => {
            await run(() => birthdayService.deleteWish(wishId));
          }}
        />
      </section>

      {/* ── Network: the final reveal ── */}
      {!isCelebrant && planning && !planning.revealed && (
        <RevealPanel
          userId={userId}
          firstName={firstName}
          leadingSuggestionId={planning.leading_suggestion_id}
          busy={busy}
          error={revealError}
          onReveal={async (suggestionId) => {
            setRevealError(null);
            const res = await birthdayService.reveal(userId, {
              selected_suggestion_id: suggestionId,
            });
            if (!res.success) {
              setRevealError(res.message ?? 'Could not reveal the surprise');
              return;
            }
            await load();
          }}
        />
      )}

      <p className="pb-2 text-center text-[11px] text-gray-400">
        Made with care by the Acceding Titans community.
      </p>
    </div>
  );
}

function SectionHeading({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B8962E]">
          {overline}
        </p>
        <h2 className="mt-1.5 text-xl font-black tracking-tight text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

/** Shown to the celebrant while the network is still plotting. */
function SurpriseSealed({ firstName }: { firstName: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#E6C56A]/30 bg-[#241410] px-6 py-10 text-center text-white shadow-[0_25px_60px_-30px_rgba(26,15,11,0.7)] sm:px-10">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_0%,rgba(201,168,76,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="birthday-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="birthday-float absolute left-6 top-8 text-[#E6C56A]/30"
      >
        <Sparkles size={22} />
      </div>
      <div
        aria-hidden
        className="birthday-float absolute bottom-8 right-8 text-[#E6C56A]/25"
        style={{ animationDelay: '1.6s' }}
      >
        <Gift size={26} />
      </div>

      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E6C56A]/30 bg-[#E6C56A]/10 text-[#F3D27A]">
          <Lock size={22} />
        </span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E6C56A]/70">
          Sealed with care
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#FFF8E8] sm:text-3xl">
          {firstName}, something is being planned
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          People are quietly organising a surprise for your birthday. We cannot tell you what it
          is yet &mdash; that is the point. It will be waiting for you on the day.
        </p>
        <p className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          <Lock size={10} className="text-[#F3D27A]" />
          Details stay private so the surprise stays a surprise
        </p>
      </div>
    </section>
  );
}

/** Shown to the celebrant once the network has executed the surprise. */
function RevealedPanel({
  revealed,
  firstName,
}: {
  revealed: NonNullable<BirthdayCelebrationPage['revealed']>;
  firstName: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#C9A84C]/35 bg-gradient-to-br from-[#FFF8E8] via-white to-[#FBF0D7] p-6 shadow-[0_25px_60px_-32px_rgba(184,150,46,0.55)] sm:p-8">
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#E6C56A]/20 blur-2xl"
      />
      <div
        aria-hidden
        className="birthday-float absolute right-6 top-6 text-[#C9A84C]/30"
      >
        <Sparkles size={26} />
      </div>

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8962E]">
          The surprise, unwrapped
        </p>
        <h2 className="mt-2 flex items-center gap-2.5 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          <Gift size={24} className="text-[#B8962E]" />
          What your network arranged
        </h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          {revealed.selected_suggestion ? (
            <div className="rounded-[1.5rem] border border-[#C9A84C]/25 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8962E]">
                The gift
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                {revealed.selected_suggestion.title}
              </p>
              {revealed.selected_suggestion.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {revealed.selected_suggestion.description}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-[#C9A84C]/25 bg-white p-5 text-sm leading-relaxed text-gray-600 sm:p-6">
              Your network has something planned, but no single gift was chosen.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-[#C9A84C]/20 bg-[#1F120D] p-5 text-white">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
                Chipped in
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#F3D27A]">
                {formatCurrency(revealed.total_pledged)}
              </p>
              <p className="mt-1 text-[11px] text-white/45">from your people, together</p>
            </div>
            {revealed.activities.length > 0 && (
              <div className="rounded-[1.5rem] border border-[#C9A84C]/20 bg-white p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">
                  Activities
                </p>
                <p className="mt-1.5 text-2xl font-black text-gray-900">
                  {revealed.activities.length}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">planned for you</p>
              </div>
            )}
          </div>
        </div>

        {revealed.activities.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8962E]">
              What they have in store
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {revealed.activities.map((a) => (
                <li
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                >
                  <Check size={11} className="text-[#B8962E]" />
                  {a.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 border-t border-[#C9A84C]/20 pt-4 text-sm italic text-gray-500">
          Happy birthday, {firstName}. This is what your network does for you.
        </p>
      </div>
    </section>
  );
}

/** Members who are most likely to be reachable about the plan. */
function LikelyPlanners({
  planners,
}: {
  planners: NonNullable<BirthdayCelebrationPage['likely_planners']>;
}) {
  return (
    <section className={CARD}>
      <div className="flex items-start gap-3 border-b border-[#f1ece2] px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#B8962E]">
          <Users size={16} />
        </span>
        <div>
          <h2 className="text-sm font-black tracking-tight text-gray-900">
            Others in your circle
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
            Members you are most likely to reach about this. Anyone in the network can help —
            this is only a shortcut.
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {planners.map((planner) => (
          <Link
            key={planner.user_id}
            href={`/dashboard/birthdays/${planner.user_id}`}
            className="group flex items-center gap-3 rounded-2xl border border-[#f1ece2] bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-[#C9A84C]/40 hover:shadow-[0_14px_28px_-20px_rgba(26,15,11,0.45)]"
          >
            {planner.profile_photo_url ? (
              <Image
                src={planner.profile_photo_url}
                alt={planner.name}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-xs font-black text-[#B8962E]">
                {planner.name.charAt(0).toUpperCase()}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900 transition group-hover:text-[#B8962E]">
                {planner.name}
              </p>
              {planner.business_name && (
                <p className="truncate text-[11px] text-gray-400">{planner.business_name}</p>
              )}
              {planner.reasons.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {planner.reasons.slice(0, 2).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-[#C9A84C]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#8A6F1F]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ArrowRight
              size={14}
              className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#C9A84C]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The network's final action: tell the celebrant. */
function RevealPanel({
  firstName,
  leadingSuggestionId,
  busy,
  error,
  onReveal,
}: {
  userId: number;
  firstName: string;
  leadingSuggestionId: number | null;
  busy: boolean;
  error: string | null;
  onReveal: (suggestionId: number | null) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#3B2416] bg-[#1A0F0B] p-6 text-white shadow-[0_25px_60px_-32px_rgba(26,15,11,0.8)] sm:p-8">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(100%_140%_at_100%_0%,rgba(201,168,76,0.18),transparent_60%)]"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E6C56A]/70">
            The finishing touch
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#FFF8E8]">
            Ready to tell {firstName}?
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
            Revealing shows {firstName} everything above — the gift, the activities and the
            wall — and closes planning so nothing changes on the day. You cannot undo it.
          </p>

          {error && (
            <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {confirming ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await onReveal(leadingSuggestionId);
                    setConfirming(false);
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFF3CF] via-[#F3D27A] to-[#D9B96A] px-4 py-2.5 text-sm font-bold text-[#241410] transition hover:brightness-105 disabled:opacity-60"
                >
                  <PartyPopper size={14} />
                  {busy ? 'Revealing…' : 'Yes, reveal it'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Not yet
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFF3CF] via-[#F3D27A] to-[#D9B96A] px-4 py-2.5 text-sm font-bold text-[#241410] transition hover:brightness-105"
              >
                <Gift size={14} />
                Reveal the surprise
              </button>
            )}
          </div>
        </div>

        <span className="birthday-float flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E6C56A]/25 bg-[#E6C56A]/10 text-[#F3D27A]">
          <PartyPopper size={26} />
        </span>
      </div>
    </section>
  );
}
