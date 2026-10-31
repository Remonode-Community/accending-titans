'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Cake,
  CalendarDays,
  Check,
  ChevronRight,
  Gift,
  MapPin,
  Palette,
  Pencil,
  Save,
  Settings2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { BirthdayCountdownCard } from '@/components/birthday/BirthdayCountdownCard';
import { BirthdayPreferencesWizard } from '@/components/birthday/BirthdayPreferencesWizard';
import { birthdayService } from '@/services/birthday.service';
import { useAuth } from '@/hooks/useAuth';
import { birthdayColorHex } from '@/utils/birthday.utils';
import type {
  BirthdayEligibility,
  MyBirthday,
  NetworkBirthday,
} from '@/types/birthday.types';

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
  const [reward, setReward] = useState<BirthdayEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

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

      // The loyalty reward card is supplementary: if this call fails the rest
      // of the page still works, so it just goes without the card.
      try {
        const eligRes = await birthdayService.getEligibility();
        if (eligRes.success && eligRes.data) setReward(eligRes.data);
      } catch {
        // Omit the reward card.
      }
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
  const plan = mine?.profile.preferences ?? null;

  /**
   * The planning form is compulsory for members whose plan includes birthdays.
   * Until it is saved, the hub is replaced by the wizard rather than shown
   * behind it: the details are what makes a gift possible, so skipping them
   * would silently leave the member with a half-working feature.
   */
  if (!loading && mine && mine.profile.preferences_complete === false) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Birthdays</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your network is coming together to celebrate.
          </p>
        </header>

        <div className="rounded-2xl border border-[#C9A84C]/25 bg-[#FDFAF3]/60 px-5 py-4">
          <p className="text-sm font-black text-gray-900">Set up your birthday plan</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Tell us your favourite colour, where a gift should go, what you would love to receive
            and how you would like to be celebrated. It takes about a minute, and only you and the
            birthday team can see it.
          </p>
        </div>

        <BirthdayPreferencesWizard
          initial={mine.profile.preferences}
          onCompleted={() => void load()}
        />
      </div>
    );
  }

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
                  href={user?.id ? `/dashboard/birthdays/${user.id}` : undefined}
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

          {/* ── My birthday plan ── */}
          {plan && (
            <section className={CARD}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-gray-900">
                      Your birthday plan
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Shared only with the birthday team, never with your network
                    </p>
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={() => setShowPlanEditor(true)}>
                  <Pencil size={13} />
                  Update plan
                </Button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <PlanFact
                  icon={<Palette size={13} />}
                  label="Favourite colour"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {birthdayColorHex(plan.favorite_color) && (
                      <span
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: birthdayColorHex(plan.favorite_color) ?? undefined }}
                      />
                    )}
                    {plan.favorite_color ?? 'Not set'}
                  </span>
                </PlanFact>

                <PlanFact icon={<Gift size={13} />} label="Gift style">
                  {plan.gift_preference_label ?? 'Not set'}
                  {plan.gift_preference === 'service' && plan.gift_preference_notes && (
                    <span className="mt-0.5 block text-[11px] font-normal text-gray-400">
                      {plan.gift_preference_notes}
                    </span>
                  )}
                </PlanFact>

                <PlanFact icon={<MapPin size={13} />} label="Delivery address">
                  {plan.address
                    ? [plan.address.line1, plan.address.line2, plan.address.city, plan.address.state]
                        .filter(Boolean)
                        .join(', ')
                    : 'Not set'}
                </PlanFact>

                <PlanFact icon={<Gift size={13} />} label="Wish list">
                  {plan.wish_list.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {plan.wish_list.slice(0, 4).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                        >
                          {item}
                        </span>
                      ))}
                      {plan.wish_list.length > 4 && (
                        <span className="rounded-full bg-[#FDFAF3] px-2 py-0.5 text-[10px] font-bold text-[#B8962E]">
                          +{plan.wish_list.length - 4} more
                        </span>
                      )}
                    </span>
                  ) : (
                    'Not set'
                  )}
                </PlanFact>
              </div>
            </section>
          )}

          {/* ── My birthday reward (platform loyalty scheme) ── */}
          {reward && (
            <section className={CARD}>
              <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:px-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
                  <Gift size={17} />
                </span>
                <div>
                  <h2 className="text-base font-black tracking-tight text-gray-900">
                    Birthday reward
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {reward.total_subscription_months} month
                    {reward.total_subscription_months === 1 ? '' : 's'} of active subscription
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {reward.is_eligible_for_reward ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      <Check size={12} /> Eligible for a birthday gift
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {reward.is_shoutout_only
                        ? 'Shoutout only this month'
                        : `${reward.total_subscription_months} of ${reward.eligibility_rule?.min_subscription_months ?? 8} months subscribed`}
                    </span>
                  )}
                  {reward.birthday_this_month && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                      <Cake size={12} /> Your birthday month
                    </span>
                  )}
                </div>

                {reward.is_eligible_for_reward && !reward.birthday_this_month && reward.birthday_month && (
                  <p className="text-xs text-gray-400">
                    Your birthday is in {reward.birthday_month}, when the gift is celebrated.
                  </p>
                )}

                {reward.current_reward ? (
                  <div className="rounded-xl border border-[#e5e7eb] bg-[#FDFAF3]/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Your gift this month</p>
                        <p className="mt-0.5 text-xs capitalize text-gray-500">
                          {reward.current_reward.reward_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#C9A84C]/30 bg-white px-3 py-1 text-[11px] font-bold capitalize text-[#B8962E]">
                        {reward.current_reward.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  !reward.is_eligible_for_reward && (
                    <p className="text-xs text-gray-400">
                      Reach {reward.eligibility_rule?.min_subscription_months ?? 8} months of
                      active subscription to unlock a physical gift from the community.
                    </p>
                  )
                )}
              </div>
            </section>
          )}

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

      <Modal
        isOpen={showPlanEditor}
        onClose={() => setShowPlanEditor(false)}
        title="Update your birthday plan"
        subtitle="Only you and the birthday team can see these details."
        icon={Sparkles}
        size="lg"
      >
        <BirthdayPreferencesWizard
          initial={plan}
          mode="edit"
          embedded
          onCompleted={() => {
            setShowPlanEditor(false);
            void load();
          }}
          onCancel={() => setShowPlanEditor(false)}
        />
      </Modal>
    </div>
  );
}

/** One fact from the member's saved birthday plan. */
function PlanFact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
        <span className="text-[#C9A84C]">{icon}</span>
        {label}
      </p>
      <div className="mt-1.5 text-sm font-semibold text-gray-900">{children}</div>
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
