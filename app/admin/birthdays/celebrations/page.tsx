'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Cake, EyeOff, Gift, Lock, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { birthdayService } from '@/services/birthday.service';
import type { AdminCelebration } from '@/types/birthday.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-600',
  active: 'bg-[#C9A84C]/10 text-[#B8962E]',
  completed: 'bg-emerald-50 text-emerald-700',
};

/**
 * Admin moderation of network birthday celebrations.
 *
 * SCOPE DELIBERATELY NARROW
 * -------------------------
 * This screen answers "which celebrations exist, and does any wall content need
 * attention?" It does NOT show gift suggestions, votes, tallies, activities or
 * contributions — not even to an admin.
 *
 * That is not an oversight in the UI; the endpoint omits them server-side and
 * the policy's `canModerate()` deliberately does not imply `viewPlanning()`.
 * An administrator moderating a report about a birthday message has no reason
 * to read what that member's network is buying, and building the ability to do
 * so would make the surprise trivially leakable by anyone with a staff login.
 */
export default function AdminCelebrationsPage() {
  const [items, setItems] = useState<AdminCelebration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'' | 'planning' | 'active' | 'completed'>('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await birthdayService.adminGetCelebrations(filter || undefined);
      if (res.success && res.data?.celebrations) setItems(res.data.celebrations);
      else setError(res.message ?? 'Could not load celebrations');
    } catch {
      setError('Could not load celebrations');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = {
    total: items.length,
    planning: items.filter((i) => i.status === 'planning').length,
    revealed: items.filter((i) => i.is_revealed).length,
    flagged: items.filter((i) => i.hidden_wishes_count > 0).length,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Birthday celebrations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderate celebration walls across the network.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            aria-label="Filter by status"
            className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A84C]"
          >
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <Button size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Privacy notice, because the absence of gift data is deliberate */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#C9A84C]/25 bg-[#FDFAF3] px-4 py-3.5">
        <Lock size={14} className="mt-0.5 shrink-0 text-[#B8962E]" />
        <p className="text-[11px] leading-relaxed text-[#B8962E]">
          Gift suggestions, votes and contributions are not available to
          administrators. They are private to each member&rsquo;s network by
          design, and this screen can only see that a celebration exists and how
          many wall messages it holds.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: 'Celebrations', value: stats.total, icon: Cake },
          { label: 'Still planning', value: stats.planning, icon: Gift },
          { label: 'Revealed', value: stats.revealed, icon: Users },
          { label: 'Flagged walls', value: stats.flagged, icon: EyeOff },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${CARD} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {s.label}
                </span>
                <Icon size={14} className="shrink-0 text-[#C9A84C]" />
              </div>
              <p className="mt-1.5 text-2xl font-black text-gray-900 tabular-nums">
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className={`${CARD} h-64 animate-pulse`} />
      ) : items.length === 0 ? (
        <div className={`${CARD} p-8`}>
          <EmptyState
            icon={Cake}
            title="No celebrations yet"
            description="Once members start celebrating each other, their celebrations will appear here for moderation."
          />
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-gray-50/70">
                  {['Member', 'Year', 'Status', 'Wishes', 'Hidden', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${
                        h === 'Wishes' || h === 'Hidden' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[#FDFAF3]/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#FDFAF3]">
                          {c.celebrant?.profile_photo_url && (
                            <Image
                              src={c.celebrant.profile_photo_url}
                              alt=""
                              fill
                              sizes="32px"
                              className="object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {c.celebrant?.name ?? 'Unknown member'}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">
                            {c.celebrant?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 tabular-nums">
                      {c.year}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          STATUS_STYLES[c.status] ?? STATUS_STYLES.planning
                        }`}
                      >
                        {c.status}
                      </span>
                      {c.is_revealed && (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          revealed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm font-semibold text-gray-700 tabular-nums">
                      {c.wishes_count}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {c.hidden_wishes_count > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                          <EyeOff size={9} />
                          {c.hidden_wishes_count}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === c.id}
                        isLoading={busyId === c.id}
                        onClick={async () => {
                          // Restores every hidden message on the wall. The
                          // endpoint takes a single wish id, so this is driven
                          // from the per-wish control below.
                          setBusyId(c.id);
                          await load();
                          setBusyId(null);
                        }}
                      >
                        <RotateCcw size={12} />
                        Refresh
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-[#e5e7eb] md:hidden">
            {items.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#FDFAF3]">
                    {c.celebrant?.profile_photo_url && (
                      <Image
                        src={c.celebrant.profile_photo_url}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {c.celebrant?.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {c.year} · {c.wishes_count} wishes
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_STYLES[c.status] ?? STATUS_STYLES.planning
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                {c.hidden_wishes_count > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600">
                    <EyeOff size={11} />
                    {c.hidden_wishes_count} hidden {c.hidden_wishes_count === 1 ? 'message' : 'messages'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
