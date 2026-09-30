'use client';

import { CheckCircle2, HandHeart, RefreshCw, TrendingUp } from 'lucide-react';
import type { ImpactResponse } from '@/types/network.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

interface Props {
  impact: ImpactResponse | null;
  onRefresh: () => void | Promise<void>;
}

/**
 * "You helped 12 members, and 8 helped you."
 *
 * This panel exists for one reason: it is the only place in the application
 * where a member can see that their subscription did something for them.
 *
 * The counters are honest by construction. An edge is written only when an ask
 * is marked fulfilled — never on claim — so a member cannot inflate this by
 * responding and disappearing. That matters because this is the panel a
 * renewal decision is made against; a flattering number there would be worse
 * than no number at all.
 *
 * It is presented without a progress bar, a score, or a tier comparison. The
 * aim is a receipt, not a badge.
 */
export const ImpactCard = ({ impact, onRefresh }: Props) => {
  const helped = impact?.helped_count ?? 0;
  const helpedBy = impact?.helped_by_count ?? 0;
  const total = helped + helpedBy;

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-[#C9A84C]" />
              What your membership has done
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Counted only when somebody confirms they were helped.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Stat
            value={helped}
            label="Members you helped"
            hint="Your response turned into a confirmed result"
            icon={HandHeart}
          />
          <Stat
            value={helpedBy}
            label="Members who helped you"
            hint="Your asks that somebody answered"
            icon={CheckCircle2}
          />
        </div>

        {total === 0 && (
          <p className="mt-4 rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] px-4 py-3 text-sm leading-relaxed text-gray-600">
            Nothing here yet, and that is genuinely fine — this only moves when
            a real request gets answered. Post one ask, or respond to somebody
            else's, and it starts counting.
          </p>
        )}
      </div>

      {impact && impact.recent.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h3 className="text-sm font-bold text-gray-900">Recent activity</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {impact.recent.map((entry, i) => (
              <li key={`${entry.created_at}-${i}`} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    entry.direction === 'helped' ? 'bg-[#C9A84C]' : 'bg-emerald-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    {entry.direction === 'helped' ? (
                      <>
                        You helped{' '}
                        <span className="font-semibold text-gray-900">
                          {entry.member_name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900">
                          {entry.member_name}
                        </span>{' '}
                        helped you
                      </>
                    )}
                  </p>
                  {entry.ask_title && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {entry.ask_title}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Stat = ({
  value,
  label,
  hint,
  icon: Icon,
}: {
  value: number;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="rounded-xl border border-gray-100 bg-[#FDFAF3] px-4 py-3.5">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-[#C9A84C]" />
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
    <p className="mt-1 text-sm font-semibold text-gray-800">{label}</p>
    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{hint}</p>
  </div>
);
