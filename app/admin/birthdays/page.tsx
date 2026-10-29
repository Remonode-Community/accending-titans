'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Cake, CheckCircle, Loader2, SlidersHorizontal, Bell } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { AdminModal } from '@/components/admin/AdminModal';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { birthdayService } from '@/services/birthday.service';
import { portfolioService } from '@/services/portfolio.service';
import { platformSettingsService } from '@/services/platform-settings.service';
import type { AdminBirthdayMember } from '@/types/birthday.types';
import type { BirthdayEligibilityRule, BirthdayNotificationSettings } from '@/types/platform-settings.types';
import type { PortfolioItem } from '@/types/portfolio.types';

export default function AdminBirthdaysPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  const [members, setMembers] = useState<AdminBirthdayMember[]>([]);
  const [scope, setScope] = useState<'all' | 'month'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Assign gift modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminBirthdayMember | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Eligibility rule (administrator-configured)
  const [rule, setRule] = useState<BirthdayEligibilityRule | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleForm, setRuleForm] = useState<BirthdayEligibilityRule>({
    min_subscription_months: 8,
    titan_shoutout_enabled: true,
  });

  // Birthday messages (administrator-configured)
  const [notifications, setNotifications] = useState<BirthdayNotificationSettings | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifForm, setNotifForm] = useState<BirthdayNotificationSettings>({
    reminders_enabled: true,
    reminder_days_before: 7,
    wishes_enabled: true,
    community_enabled: true,
    email_enabled: true,
    push_enabled: true,
    admin_digest_enabled: true,
    send_hour: 8,
  });

  const isAdmin = useMemo(() => Boolean(user?.roles?.some((r) => r === 'admin')), [user]);

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  const fetchRule = async () => {
    try {
      const res = await platformSettingsService.adminGet();
      if (res.success && res.data?.birthday_eligibility) {
        setRule(res.data.birthday_eligibility);
        setRuleForm(res.data.birthday_eligibility);
      }
      if (res.success && res.data?.birthday_notifications) {
        setNotifications(res.data.birthday_notifications);
        setNotifForm(res.data.birthday_notifications);
      }
    } catch {
      // Non-fatal: the member list still renders without the rule card.
    }
  };

  const openRuleModal = () => {
    if (rule) setRuleForm(rule);
    setRuleModalOpen(true);
  };

  const saveRule = async () => {
    try {
      setRuleSaving(true);
      const res = await platformSettingsService.adminUpdateBirthdayEligibility(ruleForm);
      if (res.success && res.data?.birthday_eligibility) {
        setRule(res.data.birthday_eligibility);
        setRuleModalOpen(false);
        showAlert('Eligibility rule updated', 'success');
        fetchData();
      } else {
        showAlert(res.message || 'Failed to update the rule', 'error');
      }
    } catch {
      showAlert('Failed to update the eligibility rule', 'error');
    } finally {
      setRuleSaving(false);
    }
  };

  const openNotificationsModal = () => {
    if (notifications) setNotifForm(notifications);
    setNotifModalOpen(true);
  };

  const saveNotifications = async () => {
    try {
      setNotifSaving(true);
      const res = await platformSettingsService.adminUpdateBirthdayNotifications(notifForm);
      if (res.success && res.data?.birthday_notifications) {
        setNotifications(res.data.birthday_notifications);
        setNotifForm(res.data.birthday_notifications);
        setNotifModalOpen(false);
        showAlert('Birthday messages updated', 'success');
      } else {
        showAlert(res.message || 'Failed to update birthday messages', 'error');
      }
    } catch {
      showAlert('Failed to update birthday messages', 'error');
    } finally {
      setNotifSaving(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await birthdayService.adminGetEligible(scope);
      if (res.success && res.data) {
        setMembers(res.data.eligible_members ?? []);
      }
    } catch (err) {
      console.error('Error fetching birthday members:', err);
      showAlert('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRule();
  }, []);

  const handleOpenAssign = async (member: AdminBirthdayMember) => {
    setSelectedMember(member);
    setSelectedItemId(null);
    setPortfolioItems([]);

    // Fetch portfolios to get items for gift selection
    try {
      const res = await portfolioService.browse({ per_page: 50 });
      if (res.success && res.data) {
        // The browse endpoint only returns active items per business, and does
        // not include the items array — so fetch one business in full to
        // collect giftable items.
        const allItems: PortfolioItem[] = [];

        for (const business of res.data.portfolios ?? []) {
          try {
            const detail = await portfolioService.getPortfolio(business.id);
            if (detail.success && detail.data?.portfolio?.items) {
              allItems.push(...detail.data.portfolio.items.filter((i) => i.is_active));
            }
          } catch {
            // Skip businesses that fail to load rather than losing the whole list.
          }
        }

        setPortfolioItems(allItems);
      }
    } catch (err) {
      console.error('Error fetching portfolio items:', err);
    }

    setAssignModalOpen(true);
  };

  const handleAssignGift = async () => {
    if (!selectedMember || !selectedItemId) {
      showAlert('Please select a gift item', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await birthdayService.adminAssignGift({
        user_id: selectedMember.user_id,
        gift_portfolio_item_id: selectedItemId,
        reward_type: 'physical_delivery',
      });

      if (res.success) {
        showAlert('Gift assigned successfully', 'success');
        setAssignModalOpen(false);
        fetchData();
      } else {
        showAlert(res.message || 'Failed to assign gift', 'error');
      }
    } catch (err) {
      showAlert(err instanceof Error && err.message ? err.message : 'Failed to assign gift', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkDelivered = async (rewardId: number) => {
    try {
      setLoadingAction(true);
      const res = await birthdayService.adminMarkDelivered(rewardId);
      if (res.success) {
        showAlert('Marked as delivered', 'success');
        fetchData();
      } else {
        showAlert(res.message || 'Failed to mark as delivered', 'error');
      }
    } catch (err) {
      showAlert(
        err instanceof Error && err.message ? err.message : 'Failed to mark as delivered',
        'error'
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const getRewardStatusBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { variant: 'warning' | 'success' | 'info' | 'danger'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      processing: { variant: 'info', label: 'Processing' },
      delivered: { variant: 'success', label: 'Delivered' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
    };
    const config = map[status] || { variant: 'warning' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  if (!isAdmin) return null;

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Cake className="h-6 w-6 text-[#C9A84C]" /> Birthday Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {members.length} eligible member{members.length !== 1 ? 's' : ''}
          {scope === 'all' ? ' across all birthday months' : ' with a birthday this month'}
        </p>
        <div
          className="mt-3 inline-flex rounded-lg border border-[#e5e7eb] bg-white p-1"
          role="group"
          aria-label="Eligible member scope"
        >
          <button
            type="button"
            onClick={() => setScope('all')}
            aria-pressed={scope === 'all'}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              scope === 'all' ? 'bg-[#C9A84C] text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All birthdays
          </button>
          <button
            type="button"
            onClick={() => setScope('month')}
            aria-pressed={scope === 'month'}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              scope === 'month' ? 'bg-[#C9A84C] text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            This month
          </button>
        </div>
      </section>

      {rule && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <SlidersHorizontal size={16} className="text-[#C9A84C]" /> Eligibility rule
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Physical gift from <strong>{rule.min_subscription_months}</strong> paid
                subscription month{rule.min_subscription_months === 1 ? '' : 's'}.
                {rule.titan_shoutout_enabled
                  ? ' Titan members below that threshold are included as shoutout-only.'
                  : ' Titan members below that threshold are not included.'}
              </p>
            </div>
            <Button
              onClick={openRuleModal}
              variant="outline"
              className="rounded-lg border-[#C9A84C]/30 px-4 py-2 text-xs font-bold text-[#C9A84C] hover:bg-[#C9A84C]/5"
            >
              Edit rule
            </Button>
          </div>
        </Card>
      )}

      {notifications && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Bell size={16} className="text-[#C9A84C]" /> Birthday messages
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {notifications.reminders_enabled
                  ? `Reminder ${notifications.reminder_days_before} day${notifications.reminder_days_before === 1 ? '' : 's'} before the birthday.`
                  : 'No advance reminder.'}{' '}
                {notifications.wishes_enabled
                  ? 'Wish sent on the day.'
                  : 'No birthday-day wish.'}{' '}
                {notifications.community_enabled
                  ? 'Every member is told about the day\'s celebrants.'
                  : 'No community announcement.'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Channels:{' '}
                {[
                  notifications.email_enabled ? 'email' : null,
                  notifications.push_enabled ? 'push' : null,
                ]
                  .filter(Boolean)
                  .join(' and ') || 'in-app only'}{' '}
                · Admin digest {notifications.admin_digest_enabled ? 'on' : 'off'} · Sends at{' '}
                {String(notifications.send_hour).padStart(2, '0')}:00 server time.
              </p>
            </div>
            <Button
              onClick={openNotificationsModal}
              variant="outline"
              className="rounded-lg border-[#C9A84C]/30 px-4 py-2 text-xs font-bold text-[#C9A84C] hover:bg-[#C9A84C]/5"
            >
              Edit messages
            </Button>
          </div>
        </Card>
      )}

      {members.length === 0 ? (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-12 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <Gift className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-900">No eligible members</h3>
          <p className="mt-2 text-sm text-gray-500">
            {scope === 'all'
              ? 'No member currently meets the subscription rule'
              : 'No eligible birthdays this month'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <Card
              key={member.id}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{member.name}</h3>
                      <p className="text-xs text-gray-500">
                        {member.birth_date} • {member.age} years • {member.total_subscription_months}mo subscribed
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.rank && (
                      <Badge variant="info" size="sm" className="capitalize">{member.rank}</Badge>
                    )}
                    {member.is_shoutout_only && (
                      <Badge variant="warning" size="sm">Shoutout Only</Badge>
                    )}
                    {member.birthday_this_month ? (
                      <Badge variant="success" size="sm">Birthday this month</Badge>
                    ) : member.birthday_month ? (
                      <Badge variant="info" size="sm">Birthday in {member.birthday_month}</Badge>
                    ) : null}
                    {getRewardStatusBadge(member.reward?.status || null)}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {member.is_eligible && !member.reward && (
                    <Button
                      onClick={() => handleOpenAssign(member)}
                      className="rounded-lg bg-[#C9A84C] px-4 py-2 text-xs font-bold text-white hover:bg-[#B8962E]"
                    >
                      <Gift size={14} className="mr-1" /> Assign Gift
                    </Button>
                  )}
                  {member.reward && member.reward.status === 'processing' && (
                    <Button
                      onClick={() => handleMarkDelivered(member.reward!.id)}
                      disabled={loadingAction}
                      variant="outline"
                      className="rounded-lg border-green-200 px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle size={14} className="mr-1" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Gift Modal */}
      <AdminModal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setSelectedMember(null); }}
        title="Assign Birthday Gift"
        subtitle={selectedMember?.name || ''}
        icon={Gift}
        size="lg"
      >
        <div className="space-y-5">
          {portfolioItems.length === 0 ? (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
              No portfolio items available to assign as gifts. Members need to create portfolio items first.
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Select Gift Item</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {portfolioItems.map((item) => {
                  // Group by provider (we'll just show items)
                  const isSelected = selectedItemId === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-gray-50 ${
                        isSelected ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gift-item"
                        checked={isSelected}
                        onChange={() => setSelectedItemId(item.id)}
                        className="h-4 w-4 text-[#C9A84C]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.price && (
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAssignGift}
              disabled={loadingAction || !selectedItemId}
              className="flex-1 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-white hover:bg-[#B8962E] disabled:opacity-50"
            >
              {loadingAction ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Assigning...</> : 'Assign Gift'}
            </Button>
            <Button onClick={() => { setAssignModalOpen(false); setSelectedMember(null); }} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </AdminModal>

      {/* Eligibility Rule Modal */}
      <AdminModal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title="Birthday Eligibility Rule"
        subtitle="Used by the monthly list and the nightly reward check"
        icon={SlidersHorizontal}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Minimum subscription months for a physical gift
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={ruleForm.min_subscription_months}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  min_subscription_months: Math.max(0, Math.min(120, Number(e.target.value) || 0)),
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Members with this many paid months or more receive a gift from a portfolio.
            </p>
          </div>

          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Include Titan members below the threshold
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                They appear on the list with a shoutout only — no physical gift is assigned.
              </p>
            </div>
            <input
              type="checkbox"
              checked={ruleForm.titan_shoutout_enabled}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  titan_shoutout_enabled: e.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={saveRule}
              disabled={ruleSaving}
              className="flex-1 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-white hover:bg-[#B8962E] disabled:opacity-50"
            >
              {ruleSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save rule'
              )}
            </Button>
            <Button
              onClick={() => setRuleModalOpen(false)}
              variant="outline"
              className="flex-1 rounded-xl py-3 text-sm font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </AdminModal>

      {/* Birthday Messages Modal */}
      <AdminModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Birthday Messages"
        subtitle="Reminders, birthday-day wishes and the admin digest"
        icon={Bell}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">What to send</p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Advance reminder</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    One reminder per member per year, sent before the birthday.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.reminders_enabled}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      reminders_enabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
                />
              </label>

              {notifForm.reminders_enabled && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Days before the birthday
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={notifForm.reminder_days_before}
                    onChange={(e) =>
                      setNotifForm((prev) => ({
                        ...prev,
                        reminder_days_before: Math.max(
                          1,
                          Math.min(30, Number(e.target.value) || 1)
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Between 1 and 30 days.</p>
                </div>
              )}

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Birthday-day wish</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    One wish per member per year, sent on the birthday itself.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.wishes_enabled}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      wishes_enabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Community announcement</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Tell every other member who is celebrating today. Members without the
                    Birthdays feature receive a notice that points them to plans.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.community_enabled}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      community_enabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Channels</p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Send the celebrant&apos;s own birthday message and the admin digest by
                    email. The community announcement stays in-app and on push.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.email_enabled}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      email_enabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Push</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Send to members&apos; registered devices. In-app notifications are always recorded.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.push_enabled}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      push_enabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Administrators</p>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">Daily digest</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Tell admins about today&apos;s birthdays and rewards awaiting action.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifForm.admin_digest_enabled}
                onChange={(e) =>
                  setNotifForm((prev) => ({
                    ...prev,
                    admin_digest_enabled: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C9A84C]"
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Send hour (server time)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={notifForm.send_hour}
              onChange={(e) =>
                setNotifForm((prev) => ({
                  ...prev,
                  send_hour: Math.max(0, Math.min(23, Number(e.target.value) || 0)),
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              The scheduler checks every hour and sends once, at this hour.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={saveNotifications}
              disabled={notifSaving}
              className="flex-1 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-white hover:bg-[#B8962E] disabled:opacity-50"
            >
              {notifSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save messages'
              )}
            </Button>
            <Button
              onClick={() => setNotifModalOpen(false)}
              variant="outline"
              className="flex-1 rounded-xl py-3 text-sm font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
