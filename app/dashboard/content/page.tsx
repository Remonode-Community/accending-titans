'use client';

import { useEffect, useState } from 'react';
import { Upload, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useAlert } from '@/hooks/useAlert';
import { contentService } from '@/services/content.service';
import { formatDate } from '@/utils/format.utils';
import type { ContentSubmission } from '@/types/content.types';

export default function ContentSubmissionPage() {
  const { showAlert } = useAlert();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('advertisement');
  const [mediaUrl, setMediaUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  /**
   * Load the member's submissions.
   *
   * The list lives at `res.data.submissions`. The previous code read
   * `res.data.data` — a key this endpoint does not produce — so the `?? []`
   * fallback silently swallowed every response and the page rendered "No
   * submissions yet" no matter what had been submitted.
   *
   * `setError` is set on failure so a broken fetch is visible rather than
   * indistinguishable from an empty list; they look identical otherwise, which
   * is exactly how this went unnoticed.
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await contentService.getMySubmissions();

      if (!res.success) {
        setError(res.message || 'Could not load your submissions.');
        setSubmissions([]);
        return;
      }

      setSubmissions(res.data?.submissions ?? []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Could not load your submissions. Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !mediaUrl.trim()) {
      showAlert('Title and Media URL are required', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await contentService.submit({
        title,
        content_type: contentType,
        media_url: mediaUrl,
        duration_seconds: duration ? parseInt(duration) : undefined,
        description: description || undefined,
      });

      if (res.success) {
        showAlert('Content submitted for review', 'success');
        setShowForm(false);
        resetForm();

        // Awaited so the refreshed list is on screen before `submitting`
        // clears. Firing it without awaiting left a window where the "success"
        // toast was showing next to a stale, empty list.
        await fetchSubmissions();
      } else {
        showAlert(res.message || 'Failed to submit', 'error');
      }
    } catch (err: any) {
      showAlert(err?.message || 'Failed to submit content', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContentType('advertisement');
    setMediaUrl('');
    setDuration('');
    setDescription('');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
      pending_review: { variant: 'warning', label: 'Pending Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' },
    };
    const config = map[status] || { variant: 'warning' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Content</h1>
          <p className="text-sm text-gray-500">Upload content for 72-hour review</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#B8962E]"
          >
            <Upload size={16} />
            New Submission
          </Button>
        )}
      </section>

      {/* Submission Form */}
      {showForm && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-bold text-gray-900 mb-5">New Content Submission</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Title *</label>
              <Input placeholder="e.g., Summer Collection 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
              >
                <option value="advertisement">Advertisement</option>
                <option value="promotional_video">Promotional Video</option>
                <option value="graphic">Graphic</option>
                <option value="photo">Photo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Media URL *</label>
              <Input placeholder="https://example.com/media.mp4" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Duration (seconds)</label>
                <Input type="number" placeholder="e.g., 30" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Description</label>
              <textarea
                placeholder="Describe your content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-white hover:bg-[#B8962E] disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  'Submit for Review'
                )}
              </Button>
              <Button onClick={() => { setShowForm(false); resetForm(); }} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-xs text-amber-700">
              ⏳ Estimated review time: <strong>72 hours</strong>. You will be notified once your content is reviewed.
            </p>
          </div>
        </Card>
      )}

      {/* My Submissions */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">My Submissions ({submissions.length})</h2>
        </div>

        {/*
          A failed fetch and a genuinely empty list both used to render
          "No submissions yet", so a broken request was indistinguishable from
          having submitted nothing. They are now separate states.
        */}
        {error ? (
          <div className="px-6 py-12 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-300" />
            <p className="mt-3 font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchSubmissions}
              className="mt-3 text-sm font-semibold text-[#B8962E] underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Upload className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">No submissions yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Anything you submit will appear here with its review status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{sub.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{sub.content_type.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div className="text-xs text-gray-400">
                    {formatDate(sub.submitted_at)}
                  </div>
                  {getStatusBadge(sub.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
