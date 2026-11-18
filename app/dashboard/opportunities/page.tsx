'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Hand, HandHeart } from 'lucide-react';
import { ProtectedPageWrapper } from '@/components/ProtectedPageWrapper';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { AskCard } from '@/components/network/AskCard';
import { networkService } from '@/services/network.service';
import type { Ask } from '@/types/network.types';

/**
 * Opportunities.
 *
 * Jobs, partnerships and business deals from other members. The server defines
 * an opportunity as an OPEN ask — a member looking for a supplier, a partner or
 * a hand, or a member offering a skill. There is deliberately no second store
 * to keep in sync: this page reads the open slice of the same ask board the
 * network page renders, so an opportunity can never drift from an ask.
 *
 * Nothing here decides what may be shown. `viewer_can_*` and the contact block
 * arrive already resolved by the server, and the card renders exactly that.
 */
export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Ask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await networkService.getOpportunities();

      if (res.success && res.data) {
        setOpportunities(res.data.opportunities ?? []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The fetch is an external system and owns its own loading state; there is
    // no event to derive it from (same pattern as the network page).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const flash = (tone: 'ok' | 'err', text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 4500);
  };

  const runAction = async (
    action: () => Promise<{ success: boolean; message?: string }>,
    successText?: string
  ) => {
    setBusy(true);
    try {
      const res = await action();

      if (res.success) {
        if (successText) flash('ok', successText);
        await load();
      } else {
        flash('err', res.message ?? 'That did not work.');
      }
    } finally {
      setBusy(false);
    }
  };

  const report = async (ask: Ask) => {
    const reason = window.prompt(
      'What is wrong with this opportunity? (scam, spam, offensive, misleading)'
    );

    if (!reason) return;

    const res = await networkService.reportContent({
      targetableType: 'App\\Models\\Ask',
      targetableId: ask.id,
      reason,
    });

    flash(
      res.success ? 'ok' : 'err',
      res.success ? 'Report received. Thank you.' : res.message ?? 'Could not report that.'
    );
  };

  if (loading) return <PageSkeleton />;

  return (
    <ProtectedPageWrapper>
      <div className="mx-auto max-w-7xl space-y-5">
        <section>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Briefcase className="h-6 w-6 text-[#C9A84C]" />
            Opportunities
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Jobs, partnerships and business deals posted by members. An
            opportunity is an open ask — somebody looking for a supplier, a
            partner or a hand, or somebody offering what they do.
          </p>
        </section>

        {toast && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              toast.tone === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.text}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            <HandHeart size={15} />
            Open right now
            {opportunities.length > 0 && (
              <span className="font-normal normal-case text-gray-400">
                {opportunities.length} open
              </span>
            )}
          </h2>

          {opportunities.length > 0 ? (
            <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((ask) => (
                <AskCard
                  key={ask.id}
                  ask={ask}
                  busy={busy}
                  onClaim={(id) =>
                    runAction(
                      () => networkService.claimAsk(id),
                      'You responded. Find it under Network → Asks so you can follow up.'
                    )
                  }
                  onFulfil={(id) =>
                    runAction(() => networkService.fulfilAsk(id), 'Recorded. Thank you.')
                  }
                  onWithdraw={(id) => runAction(() => networkService.withdrawClaim(id))}
                  onCancel={(id) => runAction(() => networkService.cancelAsk(id))}
                  onReport={report}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No opportunities available yet"
              description="When a member posts an open ask — a job, a partnership or a deal — it will appear here. Check back soon, or post an ask of your own from the network board."
            />
          )}
        </section>

        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-gray-400">
          <Hand size={13} className="mt-0.5 shrink-0" />
          Acceding Titans introduces members. Conversations and payments happen
          directly between you, so check who you are dealing with before sending
          anything.
        </p>
      </div>
    </ProtectedPageWrapper>
  );
}
