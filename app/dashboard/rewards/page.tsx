'use client';

import { useEffect, useState } from 'react';
import { Gift, Cake, CheckCircle2, Clock, Loader2, Sparkles, Users } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';
import { birthdayService } from '@/services/birthday.service';
import type { BirthdayEligibility, UpcomingBirthday, BirthdayReward } from '@/types/birthday.types';

export default function BirthdayRewardsPage() {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<BirthdayEligibility | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eligRes, upRes] = await Promise.all([
        birthdayService.getEligibility(),
        birthdayService.getUpcoming(),
      ]);

      if (eligRes.success && eligRes.data) {
        setEligibility((eligRes.data as any).eligibility ?? null);
      }
      if (upRes.success && upRes.data) {
        setUpcoming((upRes.data as any).upcoming ?? []);
      }
    } catch (err) {
      console.error('Error fetching birthday data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRewardStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'info' | 'danger'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      processing: { variant: 'info', label: 'Processing' },
      delivered: { variant: 'success', label: 'Delivered' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
    };
    const config = map[status] || { variant: 'warning' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  if (loading) return <PageSkeleton />;

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="h-6 w-6 text-[#C9A84C]" /> Birthday Rewards
        </h1>
        <p className="text-sm text-gray-500">Check your eligibility and upcoming celebrations</p>
      </section>

      {/* Eligibility Card */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-gradient-to-br from-pink-50 to-[#FDFAF3] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        {eligibility ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Your Birthday</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {eligibility.date_of_birth
                    ? new Date(eligibility.date_of_birth).toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
                    : 'Not set'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A84C]/10">
                <Cake className="h-6 w-6 text-[#C9A84C]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription</p>
                <p className="mt-1 text-lg font-extrabold text-gray-900">{eligibility.total_subscription_months} months</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Eligibility</p>
                <p className="mt-1">
                  {eligibility.is_eligible_for_reward ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-extrabold">
                      <CheckCircle2 size={18} /> Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <Clock size={18} /> {eligibility.is_shoutout_only ? 'Shoutout Only' : 'Not Yet'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {eligibility.is_shoutout_only && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-sm text-amber-700">
                  You qualify for a <strong>shoutout</strong> this month. Subscribe for more months to unlock physical rewards.
                </p>
              </div>
            )}

            {/* Current Reward */}
            {eligibility.current_reward && (
              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800">Current Reward</p>
                    <p className="text-xs text-green-600 capitalize mt-1">
                      Type: {eligibility.current_reward.reward_type.replace(/_/g, ' ')}
                    </p>
                    {eligibility.current_reward.gift_item && (
                      <p className="text-xs text-green-600">
                        Item: {eligibility.current_reward.gift_item.title}
                      </p>
                    )}
                  </div>
                  {getRewardStatusBadge(eligibility.current_reward.status)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Unable to load eligibility information</p>
          </div>
        )}
      </Card>

      {/* Upcoming Birthdays */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#C9A84C]" /> Upcoming Birthdays — {currentMonth}
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Gift className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">No upcoming birthdays this month</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((bday) => (
              <div key={bday.user_id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  {bday.profile_photo_url ? (
                    <img src={bday.profile_photo_url} alt={bday.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                      {bday.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{bday.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {/* The API now returns month and day only
                            ("October 10") instead of a full ISO date, because
                            a full date publishes the member's birth year.
                            Rendered as given rather than parsed. */}
                        {bday.birthday_month_day}
                      </span>
                      {bday.business && (
                        <span className="text-xs text-gray-400">• {bday.business.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  {bday.rank && (
                    <Badge variant="info" size="sm" className="capitalize">{bday.rank}</Badge>
                  )}
                  {bday.days_until_birthday === 0 ? (
                    <span className="text-xs font-bold text-pink-600">🎉 Today!</span>
                  ) : (
                    <span className="text-xs text-gray-500">{bday.days_until_birthday}d left</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
