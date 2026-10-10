'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, Eye, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { AdminModal } from '@/components/admin/AdminModal';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { contentService } from '@/services/content.service';
import { formatDate } from '@/utils/format.utils';
import type { AdminContentSubmission } from '@/types/content.types';

type TabType = 'pending' | 'approved' | 'rejected';

export default function AdminContentReviewPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  const [submissions, setSubmissions] = useState<AdminContentSubmission[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loadingAction, setLoadingAction] = useState(false);
  const [previewItem, setPreviewItem] = useState<AdminContentSubmission | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState<AdminContentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isAdmin = useMemo(() => Boolean(user?.roles?.some((r) => r === 'admin')), [user]);

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      const res =
        activeTab === 'pending'
          ? await contentService.adminGetPending()
          : await contentService.adminGetAll(activeTab);

      /**
       * The array lives at `res.data.submissions`.
       *
       * This line used to read `res.data.data`, which this endpoint has never
       * produced. The `?? []` swallowed the miss, so a moderator with a full
       * moderation queue was shown "No pending submissions / All caught up!"
       * — the empty state for work that was waiting to be done.
       *
       * `pending_count` comes from the queue response only, so the total is
       * read defensively rather than assumed on every tab.
       */
      if (res.success && res.data) {
        setSubmissions(res.data.submissions ?? []);
        setPendingCount(
          'pending_count' in res.data && typeof res.data.pending_count === 'number'
            ? res.data.pending_count
            : null
        );
      } else {
        setSubmissions([]);
        setPendingCount(null);
        showAlert(res.message || 'Failed to load submissions', 'error');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      showAlert('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setLoadingAction(true);
      const res = await contentService.adminApprove(id);
      if (res.success) {
        showAlert('Content approved successfully', 'success');
        fetchSubmissions();
      }
    } catch (err) {
      showAlert('Failed to approve content', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenReject = (item: AdminContentSubmission) => {
    setRejectItem(item);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectItem || !rejectReason.trim()) {
      showAlert('Please provide a rejection reason', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await contentService.adminReject(rejectItem.id, { reason: rejectReason });
      if (res.success) {
        showAlert('Content rejected', 'success');
        setRejectModalOpen(false);
        setRejectItem(null);
        setRejectReason('');
        fetchSubmissions();
      }
    } catch (err) {
      showAlert('Failed to reject content', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Review</h1>
          <p className="mt-1 text-sm text-gray-500">Review and approve member submissions</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {/*
                A moderator needs to know there is work waiting before clicking
                in. The count only comes from the pending response, so it shows
                once that tab has been loaded and stays honest rather than
                guessing from whatever list is currently rendered.
              */}
              {tab.key === 'pending' && pendingCount !== null && pendingCount > 0 && (
                <span className="rounded-full bg-[#C9A84C] px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : submissions.length === 0 ? (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-12 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-900">No {activeTab} submissions</h3>
          <p className="mt-2 text-sm text-gray-500">All caught up!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card
              key={sub.id}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 truncate">{sub.title}</h3>
                    <Badge
                      variant={sub.status === 'approved' ? 'success' : sub.status === 'rejected' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {(sub.status || 'pending review').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="capitalize">{sub.content_type.replace(/_/g, ' ')}</span>
                    {/*
                     * `submitter.name`, not `user_name` — the server never sent a
                     * `user_name` field, so this rendered as a bare "By: ".
                     */}
                    <span>By: {sub.submitter?.name || 'Unknown'}</span>
                    {sub.submitter?.email && (
                      <span className="truncate">{sub.submitter.email}</span>
                    )}
                    <span>{sub.submitted_at ? formatDate(sub.submitted_at) : '—'}</span>
                  </div>
                  {activeTab === 'pending' && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                      <Clock size={12} />
                      {/* The real remaining time, not a hardcoded "~72h" that
                          ignored how long the item had actually been waiting. */}
                      <span>
                        {sub.is_auto_approvable
                          ? 'Past the 72h auto-approval window'
                          : `Auto-approves in ~${sub.auto_approval_in_hours}h`}
                      </span>
                    </div>
                  )}
                  {sub.rejection_reason && (
                    <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                      Reason: {sub.rejection_reason}
                    </div>
                  )}
                  {sub.reviewer && (
                    <div className="mt-2 text-xs text-gray-500">
                      Reviewed by {sub.reviewer.name}
                      {sub.reviewed_at ? ` on ${formatDate(sub.reviewed_at)}` : ''}
                    </div>
                  )}
                  {sub.media_url && (
                    <div className="mt-2">
                      <a href={sub.media_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#B8962E] hover:underline">
                        <Eye size={12} /> Preview Media
                      </a>
                    </div>
                  )}
                </div>

                {activeTab === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleApprove(sub.id)}
                      disabled={loadingAction}
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
                    >
                      <CheckCircle size={14} className="mr-1" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleOpenReject(sub)}
                      disabled={loadingAction}
                      variant="outline"
                      className="rounded-lg border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <XCircle size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <AdminModal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectItem(null); }}
        title="Reject Content"
        subtitle={rejectItem?.title || ''}
        icon={XCircle}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">Rejection Reason *</label>
            <textarea
              placeholder="Explain why this content is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              disabled={loadingAction || !rejectReason.trim()}
              variant="danger"
              className="flex-1"
            >
              {loadingAction ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Rejecting...</> : 'Reject'}
            </Button>
            <Button onClick={() => { setRejectModalOpen(false); setRejectItem(null); }} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
