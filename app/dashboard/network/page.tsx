'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HandHeart,
  Hand,
  Layers,
  Plus,
  Settings2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { CircleList } from '@/components/network/CircleList';
import { AskCard } from '@/components/network/AskCard';
import { AskComposer } from '@/components/network/AskComposer';
import { ImpactCard } from '@/components/network/ImpactCard';
import { NetworkSettings } from '@/components/network/NetworkSettings';
import { networkService } from '@/services/network.service';
import type {
  Ask,
  AskBoardResponse,
  CirclesResponse,
  CreateAskRequest,
  ImpactResponse,
} from '@/types/network.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

type Tab = 'circle' | 'asks' | 'impact';

/**
 * The member network.
 *
 * Three tabs because they answer three different questions, and burying them
 * behind separate sidebar entries made the feature feel bigger than it is:
 *
 *   Circle — who is near me, and why
 *   Asks   — what needs doing
 *   Impact — what my membership actually did for me
 *
 * Impact is the tab that earns the subscription, so it is a first-class peer of
 * the other two rather than a line buried in settings.
 *
 * Nothing here hides data. Every action offered comes from a `viewer_can_*`
 * flag the server sent, and the contact block renders only when the server said
 * the number was released.
 */
export default function NetworkPage() {
  const [tab, setTab] = useState<Tab>('circle');
  const [circles, setCircles] = useState<CirclesResponse | null>(null);
  const [board, setBoard] = useState<AskBoardResponse | null>(null);
  const [impact, setImpact] = useState<ImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, b, i] = await Promise.all([
        networkService.getCircles(),
        networkService.getBoard(),
        networkService.getImpact(),
      ]);

      if (c.success && c.data) setCircles(c.data);
      if (b.success && b.data) setBoard(b.data);
      if (i.success && i.data) setImpact(i.data);
    } catch (err) {
      console.error('Failed to load network:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (tone: 'ok' | 'err', text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 4500);
  };

  /** Replace one ask across every list it appears in. */
  const patchAsk = (updated: Ask) => {
    const apply = (list?: Ask[]) =>
      list?.map((a) => (a.id === updated.id ? updated : a));

    setBoard((prev) =>
      prev
        ? {
            ...prev,
            board: apply(prev.board) ?? prev.board,
            my_asks: apply(prev.my_asks) ?? prev.my_asks,
            my_claims: apply(prev.my_claims) ?? prev.my_claims,
          }
        : prev
    );
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

  const postAsk = async (data: CreateAskRequest) => {
    setBusy(true);
    try {
      const res = await networkService.createAsk(data);

      if (res.success) {
        flash('ok', 'Your ask is live. Your circle can see it now.');
        setComposing(false);
        await load();
        return true;
      }

      flash('err', res.message ?? 'Could not post your ask.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const reportAsk = async (ask: Ask) => {
    const reason = window.prompt(
      'What is wrong with this ask? (scam, spam, offensive, misleading)'
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

  const blockMember = async (userId: number, name: string) => {
    const confirmed = window.confirm(
      `Block ${name}? They will no longer appear in your circle, and you will not see their asks.`
    );

    if (!confirmed) return;

    const res = await networkService.blockMember(userId);

    if (res.success) {
      flash('ok', `${name} has been blocked.`);
      await load();
    } else {
      flash('err', res.message ?? 'Could not block that member.');
    }
  };

  if (loading) return <PageSkeleton />;

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'circle', label: 'My circle', icon: Users, count: circles?.members.length },
    {
      key: 'asks',
      label: 'Asks',
      icon: HandHeart,
      count: (board?.board.length ?? 0) + (board?.my_asks.length ?? 0),
    },
    {
      key: 'impact',
      label: 'Impact',
      icon: TrendingUp,
      count: impact ? impact.helped_count + impact.helped_by_count : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Layers className="h-6 w-6 text-[#C9A84C]" />
          Member network
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          The people most likely to be useful to you — and a board where you can
          ask each other for something.
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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-[#C9A84C] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/25' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Circle ── */}
      {tab === 'circle' && (
        <div className="space-y-5">
          <NetworkSettings />

          <div className={`${CARD} overflow-hidden`}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Users className="h-5 w-5 text-[#C9A84C]" />
                Your circle
              </h2>
              {circles?.resolution.is_widened && (
                <p className="mt-1 text-xs text-gray-500">
                  Your circle is still small, so we have shown recently joined
                  members below the ones who actually match you.
                </p>
              )}
            </div>

            {circles && circles.members.length > 0 ? (
              <div className="p-4">
                <CircleList
                  circles={circles.circles}
                  members={circles.members}
                  isWidened={circles.resolution.is_widened}
                  hasTrade={circles.your_signals.has_trade}
                  hasCity={circles.your_signals.has_city}
                  onImproveProfile={() => window.alert('Complete your business profile to sharpen your matches.')}
                  onBlockMember={blockMember}
                />
              </div>
            ) : (
              <EmptyState
                icon={Users}
                variant="card"
                title="You're early here"
                description="Nobody else has joined yet. Add your trade and city so the right members find you as soon as they do."
              />
            )}
          </div>
        </div>
      )}

      {/* ── Asks ── */}
      {tab === 'asks' && (
        <div className="space-y-4">
          {!board?.can_post ? (
            <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#FDFAF3] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Posting is a member benefit
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    You can read the board and respond to anybody. Posting your
                    own ask is available once your subscription is active — so
                    the people answering are people who have paid to be here.
                  </p>
                </div>
              </div>
            </div>
          ) : composing ? (
            <AskComposer onSubmit={postAsk} busy={busy} onDismiss={() => setComposing(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C9A84C]/50 bg-[#FDFAF3] px-4 py-4 text-sm font-bold text-[#8A6F1F] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5"
            >
              <Plus size={16} />
              Post an ask
            </button>
          )}

          {board?.prompts && board.prompts.length > 0 && !composing && (
            <div className="space-y-2">
              {board.prompts.map((prompt) => (
                <div
                  key={prompt.title}
                  className="rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] p-3.5"
                >
                  <p className="text-sm font-bold text-gray-900">{prompt.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                    {prompt.prompt}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8A6F1F]">
                    {prompt.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {board && board.my_asks.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Your asks
              </h3>
              {board.my_asks.map((ask) => (
                <AskCard
                  key={`mine-${ask.id}`}
                  ask={ask}
                  busy={busy}
                  onClaim={(id) => runAction(() => networkService.claimAsk(id))}
                  onFulfil={(id) =>
                    runAction(() => networkService.fulfilAsk(id), 'Recorded. Thank you.')
                  }
                  onWithdraw={(id) => runAction(() => networkService.withdrawClaim(id))}
                  onCancel={(id) => runAction(() => networkService.cancelAsk(id))}
                  onReport={reportAsk}
                />
              ))}
            </section>
          )}

          {board && board.my_claims.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                You responded
              </h3>
              {board.my_claims.map((ask) => (
                <AskCard
                  key={`claim-${ask.id}`}
                  ask={ask}
                  busy={busy}
                  onClaim={() => {}}
                  onFulfil={() => {}}
                  onWithdraw={(id) => runAction(() => networkService.withdrawClaim(id))}
                  onCancel={() => {}}
                  onReport={reportAsk}
                />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              The board
              {board && board.open_near_you > 0 && (
                <span className="ml-2 font-normal normal-case text-gray-400">
                  {board.open_near_you} open near you
                </span>
              )}
            </h3>

            {board && board.board.length > 0 ? (
              board.board.map((ask) => (
                <AskCard
                  key={`board-${ask.id}`}
                  ask={ask}
                  busy={busy}
                  onClaim={(id) => runAction(() => networkService.claimAsk(id))}
                  onFulfil={(id) => runAction(() => networkService.fulfilAsk(id))}
                  onWithdraw={(id) => runAction(() => networkService.withdrawClaim(id))}
                  onCancel={(id) => runAction(() => networkService.cancelAsk(id))}
                  onReport={reportAsk}
                />
              ))
            ) : (
              <EmptyState
                icon={HandHeart}
                variant="card"
                title="Nothing on the board yet"
                description="Be the first. A single specific ask is often enough to get the right person to answer."
              />
            )}
          </section>
        </div>
      )}

      {/* ── Impact ── */}
      {tab === 'impact' && <ImpactCard impact={impact} onRefresh={load} />}

      <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-gray-400">
        <Hand size={13} className="mt-0.5 shrink-0" />
        Acceding Titans introduces members. Conversations and payments happen
        directly between you, so check who you are dealing with before sending
        anything.
      </p>
    </div>
  );
}
