'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cake, PartyPopper, Sparkles } from 'lucide-react';
import type { BirthdayCountdown } from '@/types/birthday.types';

/**
 * Live birthday countdown.
 *
 * WHY THE TICKING HAPPENS HERE AND NOT ON THE SERVER
 * --------------------------------------------------
 * The server sends `next_month_day` ("10-10") and never a full date, because a
 * full ISO date would publish the member's birth year. That means the client
 * owns turning month/day into a target instant — so the seconds tick locally
 * rather than polling the API.
 *
 * The server's `days` value is used as the source of truth for the headline
 * figure and re-validated on every poll, so a client clock that is badly wrong
 * cannot leave the page claiming a birthday is in the wrong number of days.
 */

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

interface Props {
  countdown: BirthdayCountdown;
  celebrantName: string;
  /** First name only reads better in "Happy birthday, Adaeze". */
  compact?: boolean;
}

/** Resolves "m-d" to the next local occurrence of that calendar day. */
function resolveTarget(monthDay: string): Date | null {
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(monthDay);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const now = new Date();
  // Local midnight of the candidate year, so the comparison is by calendar day.
  let target = new Date(now.getFullYear(), month - 1, day, 0, 0, 0, 0);
  if (target.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    target = new Date(now.getFullYear() + 1, month - 1, day, 0, 0, 0, 0);
  }

  return target;
}

export function BirthdayCountdownCard({ countdown, celebrantName, compact = false }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);

  const firstName = useMemo(
    () => celebrantName.trim().split(/\s+/)[0] || 'someone',
    [celebrantName]
  );

  useEffect(() => {
    if (countdown.state === 'today' || countdown.state === 'not_set') {
      setRemaining(null);
      return;
    }

    const target = countdown.next_month_day ? resolveTarget(countdown.next_month_day) : null;
    if (!target) {
      setRemaining(null);
      return;
    }

    const tick = () => setRemaining(target.getTime() - Date.now());
    tick();

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [countdown.state, countdown.next_month_day]);

  // ── Not set ──
  if (countdown.state === 'not_set') {
    return (
      <div className={`${CARD} p-5 text-center sm:p-6`}>
        <Cake size={26} className="mx-auto text-[#C9A84C]" />
        <p className="mt-3 text-sm font-bold text-gray-900">No birthday set yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
          Add your date of birth and your network can start planning something special.
        </p>
      </div>
    );
  }

  // ── Today ──
  if (countdown.state === 'today') {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/15 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <div className="p-6 text-center sm:p-8">
          <PartyPopper size={34} className="mx-auto text-[#B8962E]" />
          <p className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            🎉 It&rsquo;s {firstName}&rsquo;s birthday!
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Your network is celebrating you today. Open your page to see the wishes
            they have left.
          </p>
        </div>
      </div>
    );
  }

  // ── Countdown ──
  const totalSeconds = remaining !== null ? Math.max(0, Math.floor(remaining / 1000)) : null;
  const days = totalSeconds !== null ? Math.floor(totalSeconds / 86400) : countdown.days ?? 0;
  const hours = totalSeconds !== null ? Math.floor((totalSeconds % 86400) / 3600) : countdown.hours ?? 0;
  const minutes = totalSeconds !== null ? Math.floor((totalSeconds % 3600) / 60) : countdown.minutes ?? 0;
  const seconds = totalSeconds !== null ? totalSeconds % 60 : countdown.seconds ?? 0;

  const units: Array<{ label: string; value: number }> = [
    { label: days === 1 ? 'Day' : 'Days', value: days },
    { label: hours === 1 ? 'Hour' : 'Hours', value: hours },
    { label: minutes === 1 ? 'Minute' : 'Minutes', value: minutes },
    { label: seconds === 1 ? 'Second' : 'Seconds', value: seconds },
  ];

  // The closer it gets, the warmer the treatment, so the page builds anticipation
  // without needing a separate design for each state.
  const isImminent =
    countdown.state === 'tomorrow' || countdown.state === 'approaching';

  return (
    <div
      className={
        isImminent
          ? 'overflow-hidden rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/10 shadow-[0_10px_35px_rgba(0,0,0,0.04)]'
          : `${CARD} p-5 sm:p-6`
      }
    >
      <div className={compact ? '' : 'text-center'}>
        {!compact && (
          <>
            <div className="flex items-center justify-center gap-2">
              {isImminent ? (
                <Sparkles size={18} className="text-[#B8962E]" />
              ) : (
                <Cake size={18} className="text-[#C9A84C]" />
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8962E]">
                {countdown.state === 'tomorrow' ? 'Tomorrow' : 'Coming up'}
              </p>
            </div>
            <p className="mt-2 text-sm font-bold text-gray-900">
              {countdown.state === 'tomorrow'
                ? `🎂 ${firstName}'s birthday is tomorrow`
                : `🎂 Until ${firstName}'s birthday`}
            </p>
          </>
        )}

        <div className={`mt-4 flex items-stretch justify-center gap-2.5 sm:gap-3 ${compact ? '' : ''}`}>
          {units.map((unit) => (
            <div
              key={unit.label}
              className="min-w-[62px] rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] px-2 py-2.5 text-center sm:min-w-[76px] sm:px-3"
            >
              <p className="text-xl font-black leading-none text-gray-900 tabular-nums sm:text-2xl">
                {String(unit.value).padStart(2, '0')}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
