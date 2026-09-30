'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Gift,
  Lock,
  PartyPopper,
  Rocket,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { BirthdayCountdownCard } from '@/components/birthday/BirthdayCountdownCard';
import { GiftPlanningPanel } from '@/components/birthday/GiftPlanningPanel';
import { WishWall } from '@/components/birthday/WishWall';
import { birthdayService } from '@/services/birthday.service';
import { formatCurrency } from '@/utils/format.utils';
import type {
  BirthdayActivityStatus,
  BirthdayActivityType,
  BirthdayCelebrationPage,
} from '@/types/birthday.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

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
    void load();
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
        <div className={`${CARD} h-10 w-40 animate-pulse`} />
        <div className={`${CARD} h-40 animate-pulse`} />
        <div className={`${CARD} h-64 animate-pulse`} />
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
          action={{ label: 'Back to birthdays', onClick: () => (window.location.href = '/dashboard/birthdays') }}
        />
      </div>
    );
  }

  if (!data) return null;

  const isCelebrant = data.viewer_role === 'celebrant';
  const planning = data.planning;
  const firstName = data.celebrant.name.split(/\s+/)[0] || 'them';

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/birthdays"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#C9A84C]"
      >
        <ArrowLeft size={15} />
        All birthdays
      </Link>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {error}
        </p>
      )}

      {/* ── Celebrant identity ── */}
      <section className={CARD}>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#e5e7eb] bg-[#FDFAF3] sm:h-24 sm:w-24">
            {data.celebrant.profile_photo_url ? (
              <Image
                src={data.celebrant.profile_photo_url}
                alt={data.celebrant.name}
                fill
                sizes="96px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-black text-[#B8962E]">
                {data.celebrant.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              {data.celebrant.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              {data.celebrant.rank && (
                <span className="font-semibold text-[#B8962E]">{data.celebrant.rank}</span>
              )}
              {data.celebrant.birthday_month_day && (
                <span className="inline-flex items-center gap-1">
                  <Rocket size={12} className="text-[#C9A84C]" />
                  {data.celebrant.birthday_month_day}
                </span>
              )}
              {data.celebrant.business_name && (
                <span className="inline-flex items-center gap-1">
                  <Store size={12} className="text-[#C9A84C]" />
                  {data.celebrant.business_name}
                </span>
              )}
            </div>

            {data.celebrant.preferences_note && (
              <p className="mt-3 rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] px-4 py-2.5 text-sm italic leading-relaxed text-gray-600">
                &ldquo;{data.celebrant.preferences_note}&rdquo;
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Countdown ── */}
      <BirthdayCountdownCard
        countdown={data.countdown}
        celebrantName={data.celebrant.name}
      />

      {/* ── The celebrant's view: the tease, then the reveal ── */}
      {isCelebrant &&
        (data.surprise_in_progress ? (
          <section className="overflow-hidden rounded-2xl border border-[#C9A84C]/35 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/10 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="p-6 text-center sm:p-8">
              <Sparkles size={28} className="mx-auto text-[#B8962E]" />
              <h2 className="mt-3 text-xl font-black tracking-tight text-gray-900">
                Your network is preparing something
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                People are quietly organising a surprise for your birthday. We
                can&rsquo;t tell you what it is yet &mdash; that&rsquo;s the point.
                It will be waiting for you on the day.
              </p>
              <p className="mx-auto mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B8962E]">
                <Lock size={11} />
                The details are kept private so the surprise stays a surprise
              </p>
            </div>
          </section>
        ) : data.revealed ? (
          <RevealedPanel revealed={data.revealed} firstName={firstName} />
        ) : null)}

      {/* ── Network-only: who else is likely helping ── */}
      {!isCelebrant && data.likely_planners && data.likely_planners.length > 0 && (
        <section className={CARD}>
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Users size={15} className="text-[#C9A84C]" />
              Others in your circle
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Members you&rsquo;re most likely to be able to reach about this.
              Anyone in the network can help, though — this is only a shortcut.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {data.likely_planners.map((planner) => (
              <li key={planner.user_id}>
                <Link
                  href={`/dashboard/birthdays/${planner.user_id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-[#FDFAF3]"
                >
                  {planner.profile_photo_url ? (
                    <Image
                      src={planner.profile_photo_url}
                      alt={planner.name}
                      width={36}
                      height={36}
                      unoptimized
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-xs font-bold text-[#B8962E]">
                      {planner.name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {planner.name}
                    </p>
                    {planner.business_name && (
                      <p className="truncate text-xs text-gray-500">
                        {planner.business_name}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {planner.reasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-[#C9A84C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#8A6F1F]"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Network-only planning ── */}
      {!isCelebrant && planning && (
        <PlanningSection
          userId={userId}
          firstName={firstName}
          planning={planning}
          busy={busy}
          onSuggest={(t, d, c) =>
            run(() => birthdayService.createSuggestion(userId, { title: t, description: d, estimated_cost: c }))
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
      )}

      {/* ── Wishes ── */}
      <WishWall
        celebrantId={userId}
        celebrantName={data.celebrant.name}
        wishes={data.wishes ?? []}
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
    </div>
  );
}

function PlanningSection({
  userId,
  firstName,
  planning,
  busy,
  onSuggest,
  onVote,
  onDeleteSuggestion,
  onAddActivity,
  onActivityStatus,
  onContribute,
}: {
  userId: number;
  firstName: string;
  planning: NonNullable<BirthdayCelebrationPage['planning']>;
  busy: boolean;
  onSuggest: (title: string, description: string, cost: number | null) => Promise<boolean>;
  onVote: (id: number, vote: boolean) => Promise<boolean>;
  onDeleteSuggestion: (id: number) => Promise<boolean>;
  onAddActivity: (title: string, type: BirthdayActivityType) => Promise<boolean>;
  onActivityStatus: (id: number, status: BirthdayActivityStatus) => Promise<boolean>;
  onContribute: (amount: number, note: string) => Promise<boolean>;
}) {
  return (
    <section aria-label="Birthday planning">
      <div className="mb-3 flex items-center gap-2.5">
        <Briefcase size={15} className="text-[#C9A84C]" />
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#B8962E]">
          Planning room
        </h2>
        <span className="text-[11px] text-gray-400">
          — organise {firstName}&rsquo;s surprise
        </span>
      </div>

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
        onSuggest={onSuggest}
        onVote={onVote}
        onDeleteSuggestion={onDeleteSuggestion}
        onAddActivity={onAddActivity}
        onActivityStatus={onActivityStatus}
        onContribute={onContribute}
      />
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
    <section className="overflow-hidden rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/12 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#C9A84C]/20 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-gray-900">
          <Gift size={17} className="text-[#B8962E]" />
          What your network arranged
        </h2>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {revealed.selected_suggestion ? (
          <div className="rounded-xl border border-[#C9A84C]/25 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8962E]">
              The gift
            </p>
            <p className="mt-1.5 text-base font-black text-gray-900">
              {revealed.selected_suggestion.title}
            </p>
            {revealed.selected_suggestion.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {revealed.selected_suggestion.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Your network has something planned, but no single gift was chosen.
          </p>
        )}

        {revealed.total_pledged > 0 && (
          <p className="text-sm text-gray-600">
            They chipped in{' '}
            <span className="font-black text-gray-900">
              {formatCurrency(revealed.total_pledged)}
            </span>{' '}
            between them.
          </p>
        )}

        {revealed.activities.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8962E]">
              Activities
            </p>
            <ul className="mt-2 space-y-1.5">
              {revealed.activities.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Sparkles size={12} className="shrink-0 text-[#C9A84C]" />
                  {a.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="pt-1 text-xs italic text-gray-400">
          Happy birthday, {firstName}. This is what your network does for you.
        </p>
      </div>
    </section>
  );
}

/** The network's final action: tell the celebrant. */
function RevealPanel({
  userId,
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
    <section className={`${CARD} p-5 sm:p-6`}>
      <h2 className="text-base font-black tracking-tight text-gray-900">
        Ready to tell {firstName}?
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
        Revealing shows {firstName} everything above &mdash; the gift, the
        activities and the wall &mdash; and closes planning so nothing changes
        on the day. You cannot undo it.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={async () => {
              await onReveal(leadingSuggestionId);
              setConfirming(false);
            }}
            isLoading={busy}
            disabled={busy}
          >
            Yes, reveal it
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
            Not yet
          </Button>
        </div>
      ) : (
        <Button size="sm" className="mt-4" onClick={() => setConfirming(true)}>
          <PartyPopper size={13} />
          Reveal the surprise
        </Button>
      )}
    </section>
  );
}
