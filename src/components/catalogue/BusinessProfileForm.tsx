'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2, Store } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { Badge } from '@/components/shared/Badge';
import type { Portfolio, UpsertPortfolioRequest } from '@/types/portfolio.types';

interface BusinessProfileFormProps {
  portfolio: Portfolio | null;
  isSaving: boolean;
  disabled?: boolean;
  onSave: (payload: UpsertPortfolioRequest) => Promise<boolean>;
  onUploadImage: (file: File, folder: 'business' | 'items') => Promise<string>;
  /** Categories already in use across the platform, offered as suggestions. */
  categorySuggestions?: string[];
}

interface FormState {
  business_name: string;
  business_category: string;
  business_description: string;
  whatsapp_number: string;
  profile_image_url: string;
  cover_image_url: string;
}

const emptyForm: FormState = {
  business_name: '',
  business_category: '',
  business_description: '',
  whatsapp_number: '',
  profile_image_url: '',
  cover_image_url: '',
};

const inputBase =
  'w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12';

const labelBase = 'mb-1.5 block text-[13px] font-medium text-gray-700';

/**
 * The business half of a member's catalogue.
 *
 * Rendered inline (not in a modal) because it is the first thing a member
 * needs to complete before they can add any items.
 */
export const BusinessProfileForm = ({
  portfolio,
  isSaving,
  disabled = false,
  onSave,
  onUploadImage,
  categorySuggestions = [],
}: BusinessProfileFormProps) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!portfolio) {
      setForm(emptyForm);
      return;
    }

    setForm({
      business_name: portfolio.business_name ?? '',
      business_category: portfolio.business_category ?? '',
      business_description: portfolio.business_description ?? '',
      whatsapp_number: portfolio.whatsapp_number ?? '',
      profile_image_url: portfolio.profile_image_url ?? '',
      cover_image_url: portfolio.cover_image_url ?? '',
    });
  }, [portfolio]);

  const set = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (form.business_name.trim().length < 2) {
      next.business_name = 'Enter your business name.';
    }

    if (
      form.whatsapp_number.trim() !== '' &&
      !/^\+?[0-9\s\-()]{7,20}$/.test(form.whatsapp_number.trim())
    ) {
      next.whatsapp_number = 'Enter a valid WhatsApp number, e.g. +2348012345678.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || disabled) return;

    await onSave({
      business_name: form.business_name.trim(),
      business_category: form.business_category.trim() || null,
      business_description: form.business_description.trim() || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      profile_image_url: form.profile_image_url.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Moderation state — members need to know whether they are visible. */}
      {portfolio && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] px-4 py-3">
          <Store className="h-4 w-4 text-[#C9A84C]" />
          <span className="text-sm font-semibold text-gray-700">Your catalogue is</span>
          {portfolio.is_approved ? (
            <Badge variant="success" size="sm">
              Live
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              Hidden by an admin
            </Badge>
          )}
          {portfolio.is_featured && (
            <Badge variant="warning" size="sm">
              Featured
            </Badge>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Eye size={13} />
            {portfolio.views_count} {portfolio.views_count === 1 ? 'view' : 'views'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelBase} htmlFor="business-name">
            Business name <span className="text-red-400">*</span>
          </label>
          <input
            id="business-name"
            type="text"
            value={form.business_name}
            onChange={(e) => set('business_name', e.target.value)}
            placeholder="e.g. Jane's Fashion House"
            maxLength={200}
            disabled={disabled}
            className={`${inputBase} ${errors.business_name ? 'border-red-300' : 'border-gray-200 focus:border-[#C9A84C]'}`}
          />
          {errors.business_name && (
            <p className="mt-1.5 text-xs text-red-500">{errors.business_name}</p>
          )}
        </div>

        <div>
          <label className={labelBase} htmlFor="business-category">
            Category
          </label>
          <input
            id="business-category"
            type="text"
            list="catalogue-categories"
            value={form.business_category}
            onChange={(e) => set('business_category', e.target.value)}
            placeholder="e.g. Fashion"
            maxLength={100}
            disabled={disabled}
            className={`${inputBase} border-gray-200 focus:border-[#C9A84C]`}
          />
          {categorySuggestions.length > 0 && (
            <datalist id="catalogue-categories">
              {categorySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          )}
          <p className="mt-1.5 text-[11px] text-gray-400">
            Customers filter the directory by this.
          </p>
        </div>

        <div>
          <label className={labelBase} htmlFor="whatsapp-number">
            WhatsApp number
          </label>
          <input
            id="whatsapp-number"
            type="tel"
            value={form.whatsapp_number}
            onChange={(e) => set('whatsapp_number', e.target.value)}
            placeholder="+2348012345678"
            disabled={disabled}
            className={`${inputBase} ${errors.whatsapp_number ? 'border-red-300' : 'border-gray-200 focus:border-[#C9A84C]'}`}
          />
          {errors.whatsapp_number && (
            <p className="mt-1.5 text-xs text-red-500">{errors.whatsapp_number}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelBase} htmlFor="business-description">
            About your business
          </label>
          <textarea
            id="business-description"
            rows={3}
            value={form.business_description}
            onChange={(e) => set('business_description', e.target.value)}
            placeholder="Tell customers what you do, what you offer, and why they should choose you."
            maxLength={2000}
            disabled={disabled}
            className={`${inputBase} resize-y border-gray-200 focus:border-[#C9A84C]`}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            {form.business_description.length}/2000
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ImageUploader
          value={form.profile_image_url ? [form.profile_image_url] : []}
          onChange={(urls) => set('profile_image_url', urls[0] ?? '')}
          onUpload={(file) => onUploadImage(file, 'business')}
          max={1}
          label="Logo"
          hint="Square images look best."
          disabled={disabled || isSaving}
        />

        <ImageUploader
          value={form.cover_image_url ? [form.cover_image_url] : []}
          onChange={(urls) => set('cover_image_url', urls[0] ?? '')}
          onUpload={(file) => onUploadImage(file, 'business')}
          max={1}
          aspect="wide"
          label="Cover photo"
          hint="Optional. Wide images work best here."
          disabled={disabled || isSaving}
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={disabled || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {portfolio ? 'Save changes' : 'Create my business profile'}
        </button>
      </div>
    </form>
  );
};
