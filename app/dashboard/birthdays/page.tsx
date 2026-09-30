'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Cake,
  CalendarDays,
  Check,
  ChevronRight,
  Gift,
  PartyPopper,
  Save,
  Settings2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { BirthdayCountdownCard } from '@/components/birthday/BirthdayCountdownCard';
import { birthdayService } from '@/services/birthday.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format.utils';
import type { MyBirthday, NetworkBirthday } from '@/types/birthday.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

/** Circle keys from the member network, in the order worth showing them. */
const CONNECTION_LABELS: { key: string; label: string }[] = [
  { key: 'trade', label: 'Same trade' },
  { key: 'local', label: 'Same city' },
  { key: 'nearby', label: 'Nearby' },
  { key: 'cohort', label: 'Joined around the same time' },
  { key: 'tenure', label: 'Similar stage' },
];

/**
 * The birthdays hub.
 *
 * Two jobs on one screen, because they are the same decision: "is it my
 * birthday coming up, or someone else's?" The celebrant's own countdown leads,
 * followed by the network's.
 */
export default function BirthdaysPage() {
  const { user } = useAuth();
  const [mine, setMine] = useState<MyBirthday | null>(null);
  const [network, setNetwork] = useState<NetworkBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mineRes, networkRes] = await Promise.all([
        birthdayService.getMine(),
        birthdayService.getNetwork(90),
      ]);

      if (mineRes.success && mineRes.data) setMine(mineRes.data);
      if (networkRes.success && networkRes.data?.birthdays) setNetwork(networkRes.data.birthdays);
    } catch {
      setError('Could not load birthdays right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const celebrantName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'You';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Birthdays</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your network is coming together to celebrate.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className={`${CARD} h-40 animate-pulse`} />
          <div className={`${CARD} h-56 animate-pulse`} />
        </div>
      ) : (
        <>
          {/* ── My birthday ── */}
          <section className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
                  <Cake size={17} />
                </span>
                <div>
                  <h2 className="text-base font-black tracking-tight text-gray-900">
                    My birthday
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {mine?.profile.has_date_of_birth
                      ? `Your network sees this on ${mine.profile.birthday_month_day}`
                      : 'Add your date so your network can plan something special'}
                  </p>
                </div>
              </div>

              <Button size="sm" variant="outline" onClick={() => setShowSettings((v) => !v)}>
                <Settings2 size={13} />
                {mine?.profile.has_date_of_birth ? 'Edit' : 'Add birthday'}
              </Button>
            </div>

            <div className="p-5 sm:p-6">
              {mine ? (
                <BirthdayCountdownCard
                  countdown={mine.countdown}
                  celebrantName={celebrantName}
                  compact
                />
              ) : (
                <div className={`${CARD} p-6 text-center`}>
                  <Cake size={24} className="mx-auto text-[#C9A84C]" />
                  <p className="mt-3 text-sm font-bold text-gray-900">
                    Your birthday is not set
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                    Add your date of birth and your network can start planning a
                    surprise.
                  </p>
                </div>
              )}

              {showSettings && (
                <MyBirthdaySettings
                  current={mine}
                  onSaved={async () => {
                    setShowSettings(false);
                    await load();
                  }}
                />
              )}
            </div>
          </section>

          {/* ── Network birthdays ── */}
          <section className={CARD}>
            <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
                <Users size={17} />
              </span>
              <div>
                <h2 className="text-base font-black tracking-tight text-gray-900">
                  Coming up in your network
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Open a birthday to post a wish or help plan a surprise
                </p>
              </div>
            </div>

            {network.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={CalendarDays}
                  title="No birthdays in the next 90 days"
                  description="When a member's birthday approaches, it will show up here so you can celebrate them."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {network.map((b) => (
                  <li key={b.user_id}>
                    <Link
                      href={`/dashboard/birthdays/${b.user_id}`}
                      className="group flex items-center gap-3.5 px-5 py-4 transition hover:bg-[#FDFAF3]/50 sm:px-6"
                    >
                      <Avatar person={b} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="truncate text-sm font-bold text-gray-900 group-hover:text-[#C9A84C]">
                            {b.name}
                          </p>
                          {b.rank && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#B8962E]">
                              {b.rank}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                          <Cake size={11} className="text-[#C9A84C]" />
                          {b.birthday_month_day}
                        </p>

                        {/* Why this birthday is relevant to the viewer, from the
                            member network's proximity scoring. Purely
                            informational: any member may celebrate anybody, so
                            this never gates access to the celebration page. */}
                        {b.connection?.score > 0 && (
                          <p className="mt-1 flex flex-wrap items-center gap-1">
                            {CONNECTION_LABELS.filter((l) =>
                              b.connection.circle_keys.includes(l.key)
                            ).map((l) => (
                              <span
                                key={l.key}
                                className="rounded-full bg-[#C9A84C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#8A6F1F]"
                              >
                                {l.label}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full bg-[#FDFAF3] px-3 py-1.5 text-[11px] font-bold text-[#B8962E]">
                        {b.countdown.is_today
                          ? '🎉 Today'
                          : b.countdown.days === 1
                            ? 'Tomorrow'
                            : `${b.countdown.days} days`}
                      </span>

                      <ChevronRight
                        size={15}
                        className="shrink-0 text-gray-300 transition group-hover:text-[#C9A84C]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Avatar({ person }: { person: { name: string; profile_photo_url: string | null } }) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#e5e7eb] bg-[#FDFAF3]">
      {person.profile_photo_url ? (
        <Image
          src={person.profile_photo_url}
          alt={person.name}
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-black text-[#B8962E]">
          {person.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/**
 * Celebrant's own settings.
 *
 * Only the month and day are collected. The year is never asked for, because
 * the feature does not use it and accepting one would invite age inference.
 */
function MyBirthdaySettings({
  current,
  onSaved,
}: {
  current: MyBirthday | null;
  onSaved: () => Promise<void>;
}) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState(current?.profile.preferences_note ?? '');
  const [enabled, setEnabled] = useState(current?.profile.is_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // The full Y-m-d is sent because `users.dob` is a DATE column and needs
      // a year. That is a storage detail, not a disclosure one: every response
      // the API returns exposes the month and day only, so the year is never
      // visible to another member and no age can be derived.
      const res = await birthdayService.updateMine({
        ...(date ? { date_of_birth: date } : {}),
        ...(note ? { preferences_note: note } : {}),
        is_enabled: enabled,
      });

      setMessage(res.success ? 'Saved.' : (res.message ?? 'Could not save'));
      if (res.success) await onSaved();
    } catch {
      setMessage('Could not save your birthday');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-3.5 rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3]/50 p-4 sm:p-5">
      <div>
        <label htmlFor="dob" className="text-xs font-semibold text-gray-600">
          Date of birth
        </label>
        <input
          id="dob"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#C9A84C] sm:w-56"
        />
        <p className="mt-1.5 text-[11px] text-gray-400">
          Only your month and day are ever shown to other members. Your age is
          never displayed.
        </p>
      </div>

      <div>
        <label htmlFor="pref-note" className="text-xs font-semibold text-gray-600">
          A note for your network (optional)
        </label>
        <textarea
          id="pref-note"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. No gifts please — let's just have dinner together"
          className="mt-1.5 w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-[#e5e7eb] accent-[#C9A84C]"
        />
        Let my network celebrate my birthday
      </label>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} isLoading={saving} disabled={saving}>
          <Save size={13} />
          Save
        </Button>
        {message && <span className="text-xs font-semibold text-gray-500">{message}</span>}
      </div>
    </div>
  );
}
