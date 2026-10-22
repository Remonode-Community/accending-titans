'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, PartyPopper, Sparkles } from 'lucide-react';
import { CelebrationHero } from '@/components/birthday/CelebrationHero';
import { CelebrantJourney, NetworkJourney } from '@/components/birthday/CelebrationJourney';
import { EmptyState } from '@/components/shared/EmptyState';
import { birthdayService } from '@/services/birthday.service';
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
 * setting `viewer_role`. A network member receives the planning studio; the
 * celebrant receives the two-chapter celebration.
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
  const loadedOnce = useRef(false);

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
      // Only the first fetch may replace the page with the skeleton. Refreshes
      // after a mutation must not unmount the journey and lose the active step.
      if (!loadedOnce.current) setLoading(true);
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
      loadedOnce.current = true;
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

  const deleteWish = useCallback(
    async (wishId: number) => {
      await run(() => birthdayService.deleteWish(wishId));
    },
    [run]
  );

  if (userId === null || loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-36 animate-pulse rounded-full bg-[#f3eee4]" />
        <div className="h-[26rem] animate-pulse rounded-[2rem] bg-[#1A0F0B]/90" />
        <div className={`${CARD} h-[28rem] animate-pulse`} />
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
      />

      {isCelebrant ? (
        <CelebrantJourney
          key={userId}
          firstName={firstName}
          wishes={wishes}
          revealed={data.revealed}
          surpriseInProgress={Boolean(data.surprise_in_progress)}
          busy={busy}
          onDeleteWish={deleteWish}
        />
      ) : (
        <NetworkJourney
          key={userId}
          celebrantName={data.celebrant.name}
          wishes={wishes}
          planners={data.likely_planners}
          suggestions={planning?.suggestions ?? []}
          leadingSuggestionId={planning?.leading_suggestion_id ?? null}
          totalVotes={planning?.total_votes ?? 0}
          activities={planning?.activities ?? []}
          contributions={planning?.contributions.items ?? []}
          totalPledged={planning?.contributions.total_pledged ?? 0}
          revealed={Boolean(planning?.revealed)}
          planningLocked={Boolean(planning?.planning_locked)}
          busy={busy}
          revealError={revealError}
          onPostWish={async (message) => {
            const res = await birthdayService.postWish(userId, message);
            if (!res.success) throw new Error(res.message ?? 'Could not post your wish');
            await load();
          }}
          onDeleteWish={deleteWish}
          onSuggest={(title, description, cost) =>
            run(() =>
              birthdayService.createSuggestion(userId, {
                title,
                description,
                estimated_cost: cost,
              })
            )
          }
          onVote={(id, vote) => run(() => birthdayService.vote(id, vote))}
          onDeleteSuggestion={(id) => run(() => birthdayService.deleteSuggestion(id))}
          onAddActivity={(title, type: BirthdayActivityType) =>
            run(() => birthdayService.createActivity(userId, { title, activity_type: type }))
          }
          onActivityStatus={(id, status: BirthdayActivityStatus) =>
            run(() => birthdayService.updateActivityStatus(id, status))
          }
          onContribute={(amount, note) =>
            run(() => birthdayService.createContribution(userId, { amount, note }))
          }
          onReveal={async (suggestionId) => {
            setRevealError(null);
            const res = await birthdayService.reveal(userId, {
              selected_suggestion_id: suggestionId,
            });
            if (!res.success) {
              setRevealError(res.message ?? 'Could not reveal the surprise');
              return false;
            }
            await load();
            return true;
          }}
        />
      )}

      <p className="pb-2 text-center text-[11px] text-gray-400">
        Made with care by the Acceding Titans community.
      </p>
    </div>
  );
}
