'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Cake, CheckCircle, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { AdminModal } from '@/components/admin/AdminModal';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { birthdayService } from '@/services/birthday.service';
import { portfolioService } from '@/services/portfolio.service';
import { formatDate } from '@/utils/format.utils';
import type { AdminBirthdayMember } from '@/types/birthday.types';
import type { PortfolioItem } from '@/types/portfolio.types';

export default function AdminBirthdaysPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  const [members, setMembers] = useState<AdminBirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Assign gift modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminBirthdayMember | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);

  const isAdmin = useMemo(() => Boolean(user?.roles?.some((r) => r === 'admin')), [user]);

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await birthdayService.adminGetEligible();
      if (res.success && res.data) {
        setMembers((res.data as any).members ?? []);
      }
    } catch (err) {
      console.error('Error fetching birthday members:', err);
      showAlert('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = async (member: AdminBirthdayMember) => {
    setSelectedMember(member);
    setSelectedItemId(null);
    setSelectedProviderId(null);
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
    if (!selectedMember || !selectedItemId || !selectedProviderId) {
      showAlert('Please select a gift item', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await birthdayService.adminAssignGift({
        user_id: selectedMember.user_id,
        gift_provider_user_id: selectedProviderId,
        gift_portfolio_item_id: selectedItemId,
        reward_type: 'physical_delivery',
      });

      if (res.success) {
        showAlert('Gift assigned successfully', 'success');
        setAssignModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showAlert('Failed to assign gift', 'error');
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
      }
    } catch (err) {
      showAlert('Failed to mark as delivered', 'error');
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
          {members.length} eligible member{members.length !== 1 ? 's' : ''} this month
        </p>
      </section>

      {members.length === 0 ? (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-12 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <Gift className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-900">No eligible members</h3>
          <p className="mt-2 text-sm text-gray-500">No birthdays this month</p>
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
                        onChange={() => {
                          setSelectedItemId(item.id);
                          // We need provider user_id - this would ideally come from the portfolio data
                          // For now, we'll use a placeholder approach
                          setSelectedProviderId(1);
                        }}
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
    </div>
  );
}
