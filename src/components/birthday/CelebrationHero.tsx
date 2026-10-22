'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  Briefcase,
  Cake,
  CalendarDays,
  Gift,
  Lock,
  PartyPopper,
  Send,
  Sparkles,
} from 'lucide-react';
import { resolveTarget } from '@/components/birthday/BirthdayCountdownCard';
import type {
  BirthdayCelebrant,
  BirthdayCountdown,
  BirthdayViewerRole,
} from '@/types/birthday.types';

interface Props {
  celebrant: BirthdayCelebrant;
  countdown: BirthdayCountdown;
  viewerRole: BirthdayViewerRole;
  wishesCount: number;
  surpriseInProgress: boolean;
  planningOpen: boolean;
}

const CONFETTI = [
  { left: '3%', delay: '0s', duration: '8.5s', color: '#F3D27A', width: 7, height: 12 },
  { left: '9%', delay: '2.4s', duration: '10s', color: '#FFF3CF', width: 5, height: 9 },
  { left: '15%', delay: '1.1s', duration: '9.2s', color: '#C9A84C', width: 9, height: 14 },
  { left: '22%', delay: '4.6s', duration: '11s', color: '#E8B4B8', width: 6, height: 10 },
  { left: '29%', delay: '0.7s', duration: '9.8s', color: '#F3D27A', width: 5, height: 8 },
  { left: '36%', delay: '3.2s', duration: '8.2s', color: '#FFF3CF', width: 8, height: 13 },
  { left: '44%', delay: '5.4s', duration: '10.6s', color: '#C9A84C', width: 6, height: 10 },
  { left: '51%', delay: '1.8s', duration: '9.4s', color: '#E8B4B8', width: 7, height: 11 },
  { left: '58%', delay: '6.1s', duration: '11.4s', color: '#F3D27A', width: 5, height: 9 },
  { left: '65%', delay: '2.9s', duration: '8.8s', color: '#FFF3CF', width: 9, height: 14 },
  { left: '72%', delay: '0.4s', duration: '10.2s', color: '#C9A84C', width: 6, height: 10 },
  { left: '79%', delay: '4.2s', duration: '9.6s', color: '#E8B4B8', width: 8, height: 12 },
  { left: '85%', delay: '1.4s', duration: '10.8s', color: '#F3D27A', width: 5, height: 9 },
  { left: '91%', delay: '3.7s', duration: '8.6s', color: '#FFF3CF', width: 7, height: 11 },
  { left: '97%', delay: '5.8s', duration: '11.2s', color: '#C9A84C', width: 6, height: 10 },
];

export function CelebrationHero({
  celebrant,
  countdown,
  viewerRole,
  wishesCount,
  surpriseInProgress,
  planningOpen,
}: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);

  const firstName = useMemo(
    () => celebrant.name.trim().split(/\s+/)[0] || 'You',
    [celebrant.name]
  );

  const isToday = countdown.state === 'today' || countdown.is_today;

  useEffect(() => {
    if (isToday) return;

    const target = countdown.next_month_day ? resolveTarget(countdown.next_month_day) : null;
    if (!target) return;

    const tick = () => setRemaining(target.getTime() - Date.now());
    const initial = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [countdown.next_month_day, isToday]);

  const totalSeconds = remaining !== null ? Math.max(0, Math.floor(remaining / 1000)) : null;
  const days = totalSeconds !== null ? Math.floor(totalSeconds / 86400) : countdown.days ?? 0;
  const hours =
    totalSeconds !== null ? Math.floor((totalSeconds % 86400) / 3600) : countdown.hours ?? 0;
  const minutes =
    totalSeconds !== null ? Math.floor((totalSeconds % 3600) / 60) : countdown.minutes ?? 0;
  const seconds = totalSeconds !== null ? totalSeconds % 60 : countdown.seconds ?? 0;

  const units = [
    { label: days === 1 ? 'Day' : 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Mins', value: minutes },
    { label: 'Secs', value: seconds },
  ];

  const isNetwork = viewerRole === 'network';

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#3B2416] bg-[#1A0F0B] text-white shadow-[0_35px_90px_-35px_rgba(26,15,11,0.75)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(130%_120%_at_12%_0%,#52301B_0%,#2C1912_42%,#160D0A_100%)]"
      />
      <div
        aria-hidden
        className="birthday-glow absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#C9A84C]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="birthday-glow absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#8C2F39]/35 blur-3xl"
        style={{ animationDelay: '2.5s' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,243,207,0.04)_38%,transparent_62%)]"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="birthday-confetti"
            style={{
              left: piece.left,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#E6C56A]/80">
            <Sparkles size={12} />
            The celebration
          </p>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isToday ? 'animate-pulse bg-[#F3D27A]' : 'bg-[#8FBF9F]'
              }`}
            />
            {isToday
              ? 'Today'
              : countdown.state === 'tomorrow'
                ? 'Tomorrow'
                : `${days} ${days === 1 ? 'day' : 'days'} to go`}
          </span>
        </div>

        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="birthday-rise">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                <div className="birthday-ring-spin absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#E6C56A,#7A4B22,#F3D27A,#FFF3CF,#C9A84C,#E6C56A)] opacity-90" />
                <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-[#1A0F0B] bg-[#2C1A12]">
                  {celebrant.profile_photo_url ? (
                    <Image
                      src={celebrant.profile_photo_url}
                      alt={celebrant.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                      priority
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-3xl font-black text-[#F3D27A]">
                      {celebrant.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E6C56A]/70">
                  {isToday ? 'Happy birthday' : 'Counting down to'}
                </p>
                <h1 className="mt-2 text-3xl font-black leading-[1.05] tracking-tight text-[#FFF8E8] sm:text-4xl lg:text-[2.9rem]">
                  {isToday ? (
                    <>
                      {firstName}
                      <span className="text-[#F3D27A]">.</span>
                    </>
                  ) : (
                    <>
                      {firstName}&rsquo;s
                      <br />
                      <span className="bg-gradient-to-r from-[#FFF3CF] via-[#F3D27A] to-[#C9A84C] bg-clip-text text-transparent">
                        celebration
                      </span>
                    </>
                  )}
                </h1>
                <p className="mt-2 text-sm font-medium text-white/55">{celebrant.name}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {celebrant.rank && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6C56A]/25 bg-[#E6C56A]/10 px-3 py-1 text-[11px] font-bold text-[#F3D27A]">
                  <Award size={11} />
                  {celebrant.rank}
                </span>
              )}
              {celebrant.birthday_month_day && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold text-white/75">
                  <CalendarDays size={11} className="text-[#E6C56A]" />
                  {celebrant.birthday_month_day}
                </span>
              )}
              {celebrant.business_name && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold text-white/75">
                  <Briefcase size={11} className="text-[#E6C56A]" />
                  {celebrant.business_name}
                </span>
              )}
            </div>

            {celebrant.preferences_note && (
              <blockquote className="mt-5 max-w-xl border-l-2 border-[#E6C56A]/40 pl-4 text-sm italic leading-relaxed text-white/65">
                &ldquo;{celebrant.preferences_note}&rdquo;
              </blockquote>
            )}

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60">
              {isToday
                ? isNetwork
                  ? `The day is here. Add your message to ${firstName}'s wall and make it one to remember.`
                  : 'Your network has been waiting for this day. Their wishes are waiting for you below.'
                : isNetwork
                  ? `Help ${firstName} feel celebrated. Pick a gift, plan something together, or leave a wish for the day.`
                  : 'Your people are getting ready to celebrate you. Here is everything you need to know.'}
            </p>
          </div>

          <div className="birthday-rise" style={{ animationDelay: '140ms' }}>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:p-6">
              <div
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F3D27A]/70 to-transparent"
              />

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Countdown
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6C56A]/15 text-[#F3D27A]">
                  <Cake size={15} />
                </span>
              </div>

              {isToday ? (
                <div className="mt-5 rounded-2xl border border-[#E6C56A]/25 bg-[#E6C56A]/10 px-4 py-7 text-center">
                  <PartyPopper size={30} className="mx-auto text-[#F3D27A]" />
                  <p className="mt-3 text-2xl font-black tracking-tight text-[#FFF8E8]">
                    The day is here
                  </p>
                  <p className="mx-auto mt-1 max-w-[15rem] text-xs leading-relaxed text-white/55">
                    {isNetwork
                      ? 'Wishes are open all day. Say something they will keep.'
                      : 'Take your time. Every message on the wall was left for you.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-4 gap-2">
                    {units.map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.07] px-1 py-3 text-center"
                      >
                        <p className="bg-gradient-to-b from-[#FFF8E8] to-[#D9B96A] bg-clip-text text-xl font-black leading-none tabular-nums text-transparent sm:text-2xl">
                          {String(unit.value).padStart(2, '0')}
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                          {unit.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[11px] font-medium text-white/45">
                    {countdown.state === 'tomorrow'
                      ? 'Tomorrow is the day. The wall opens at midnight.'
                      : `${days} ${days === 1 ? 'day' : 'days'} until the wishes go live.`}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className="birthday-rise mt-8 flex flex-wrap items-center gap-3"
          style={{ animationDelay: '240ms' }}
        >
          <a
            href="#wishes"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFF3CF] via-[#F3D27A] to-[#D9B96A] px-5 py-3 text-sm font-bold text-[#241410] shadow-[0_12px_30px_-12px_rgba(243,210,122,0.7)] transition hover:brightness-105"
          >
            {isNetwork ? <Send size={15} /> : <Gift size={15} />}
            {isNetwork ? 'Leave a wish' : wishesCount > 0 ? 'Read the wall' : 'Your wish wall'}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>

          {isNetwork && planningOpen && (
            <a
              href="#planning"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              <Sparkles size={14} className="text-[#F3D27A]" />
              Planning room
            </a>
          )}

          {!isNetwork && surpriseInProgress && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-semibold text-white/60">
              <Lock size={13} className="text-[#F3D27A]" />
              Your surprise is sealed until the day
            </span>
          )}

          <span className="ml-auto inline-flex items-center gap-2 text-[11px] font-semibold text-white/40">
            <span className="h-1 w-1 rounded-full bg-[#F3D27A]/70" />
            {wishesCount > 0
              ? `${wishesCount} ${wishesCount === 1 ? 'wish' : 'wishes'} on the wall`
              : isNetwork
                ? 'Be the first to leave a wish'
                : surpriseInProgress
                  ? 'Your wall unlocks on the day'
                  : 'No wishes yet'}
          </span>
        </div>
      </div>
    </section>
  );
}
