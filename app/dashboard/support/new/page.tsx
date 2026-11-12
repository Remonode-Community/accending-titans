'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { supportService } from '@/services/support.service';
import { useAlert } from '@/hooks/useAlert';
import type {
  SupportAttachmentInput,
  SupportCategory,
  SupportTicketPriority,
} from '@/types/support.types';

/**
 * Raise a new support ticket.
 *
 * Validation mirrors the backend rules (subject ≥ 5, description ≥ 10,
 * category required) so obvious mistakes are caught before the round-trip,
 * but the server remains the source of truth — its field errors are shown.
 */

const PRIORITIES: Array<{ value: SupportTicketPriority; label: string; hint: string }> = [
  { value: 'low', label: 'Low', hint: 'Question or feedback — no rush' },
  { value: 'medium', label: 'Medium', hint: 'Something is off, but you can work around it' },
  { value: 'high', label: 'High', hint: 'Blocking part of your work' },
  { value: 'urgent', label: 'Urgent', hint: 'Account, wallet or payment is fully stuck' },
];

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [subject, setSubject] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [relatedReference, setRelatedReference] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<SupportAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supportService
      .getCategories()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleUpload = async (file: File): Promise<string> => {
    const uploaded = await supportService.uploadAttachment(file);
    setAttachments((prev) => [...prev, uploaded]);
    return uploaded.url;
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (subject.trim().length < 5) {
      errors.subject = 'Give the subject at least 5 characters.';
    }
    if (!categorySlug) {
      errors.category = 'Choose the category that fits best.';
    }
    if (description.trim().length < 10) {
      errors.description = 'Describe the issue in at least 10 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await supportService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category: categorySlug,
        priority,
        related_reference: relatedReference.trim() || undefined,
        attachments: attachments.length ? attachments : undefined,
      });

      if (res.success && res.data?.ticket) {
        showAlert('Ticket created — our team has been notified', 'success');
        router.replace(`/dashboard/support/${res.data.ticket.id}`);
        return;
      }

      // Validation errors from the server land in `errors`.
      if (res.errors && Object.keys(res.errors).length > 0) {
        const mapped: Record<string, string> = {};
        Object.entries(res.errors).forEach(([field, messages]) => {
          mapped[field.split('.')[0]] = messages[0];
        });
        setFieldErrors(mapped);
      }
      showAlert(res.message || 'Could not create the ticket.', 'error');
    } catch (err) {
      console.error('Error creating ticket:', err);
      showAlert(err instanceof Error ? err.message : 'Could not create the ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
  const labelClass = 'mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100';
  const errorClass = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-400';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={15} />
        Back to support
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New support ticket</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tell us what happened. The more detail you give, the faster we can help.
        </p>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-5">
          <div>
            <label htmlFor="subject" className={labelClass}>
              Subject <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Wallet balance shows 0 after funding"
              className={inputClass}
              maxLength={255}
            />
            {fieldErrors.subject && <p className={errorClass}>{fieldErrors.subject}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-[#C9A84C]">*</span>
              </label>
              <select
                id="category"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {loadingCategories ? 'Loading…' : 'Choose a category'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <p className={errorClass}>{fieldErrors.category}</p>}
            </div>

            <div>
              <label htmlFor="priority" className={labelClass}>
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}
                className={inputClass}
              >
                {PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.hint}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              What happened? <span className="text-[#C9A84C]">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              rows={6}
              placeholder="Describe the issue, what you expected, and anything you already tried…"
              className={`${inputClass} resize-none`}
            />
            {fieldErrors.description ? (
              <p className={errorClass}>{fieldErrors.description}</p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400">{description.length}/5000</p>
            )}
          </div>

          <div>
            <label htmlFor="reference" className={labelClass}>
              Reference (optional)
            </label>
            <input
              id="reference"
              value={relatedReference}
              onChange={(e) => setRelatedReference(e.target.value.slice(0, 100))}
              placeholder="Transaction ID, listing link, order number…"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Anything that helps us locate the issue faster.
            </p>
          </div>

          <ImageUploader
            label="Screenshots (optional)"
            hint="Up to 5 images, 4MB each — JPG, PNG or WebP."
            value={attachmentUrls}
            onChange={(urls) => {
              setAttachmentUrls(urls);
              setAttachments((prev) => prev.filter((a) => urls.includes(a.url)));
            }}
            onUpload={handleUpload}
            max={5}
            onUploadingChange={setUploading}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {submitting ? 'Creating ticket…' : 'Submit ticket'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Our support team is notified immediately and replies in this thread and by email.
          </p>
        </div>
      </Card>
    </div>
  );
}
