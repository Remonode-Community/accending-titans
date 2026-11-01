/**
 * Tier 2 Upgrade Form Component
 * Silver tier with identity document verification
 * 
 * Fields:
 * - identity.type (nin, passport, drivers_license, voters_card)
 * - identity.image (hosted image URL)
 * - identity.number (document number)
 * - identity.country (2-letter country code)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronRight, Upload, X } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Spinner } from '@/components/shared/Spinner';
import { TierUpgradeFormData, IdentityDocumentType } from '@/types/tier-upgrade.types';
import { tierUpgradeService } from '@/services/tier-upgrade.service';

interface Tier2FormProps {
  initialData?: Partial<TierUpgradeFormData>;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (data: TierUpgradeFormData) => void;
  onSaveDraft: (data: Partial<TierUpgradeFormData>) => void;
}

const DOCUMENT_TYPES: { value: IdentityDocumentType; label: string }[] = [
  { value: 'nin', label: 'National ID (NIN)' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card', label: "Voter's Card" },
];

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
].sort((a, b) => a.name.localeCompare(b.name));

export const Tier2Form: React.FC<Tier2FormProps> = ({
  initialData,
  isSubmitting,
  error,
  onSubmit,
  onSaveDraft,
}) => {
  const [formData, setFormData] = useState<TierUpgradeFormData>({
    identity: {
      type: (initialData?.identity?.type as IdentityDocumentType) || 'nin',
      image: initialData?.identity?.image || '',
      number: initialData?.identity?.number || '',
      country: initialData?.identity?.country || 'NG',
    },
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Save draft on field change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSaveDraft(formData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, onSaveDraft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      identity: {
        type: (prev.identity?.type || 'nin') as IdentityDocumentType,
        image: prev.identity?.image || '',
        number: prev.identity?.number || '',
        country: prev.identity?.country || 'NG',
        [name]: value,
      } as any,
    }));

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    try {
      // Upload to Cloudinary via the backend; only the hosted URL is kept, so
      // drafts and submissions stay small and the document survives reloads.
      const res = await tierUpgradeService.uploadProfileImage(file);
      const imageUrl = res.data?.image_url;

      if (res.success && imageUrl) {
        setFormData((prev) => ({
          ...prev,
          identity: {
            type: (prev.identity?.type || 'nin') as IdentityDocumentType,
            image: imageUrl,
            number: prev.identity?.number || '',
            country: prev.identity?.country || 'NG',
          } as any,
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          image: res.message || 'The document image could not be uploaded. Please try again.',
        }));
      }
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        image:
          err instanceof Error
            ? err.message
            : 'The document image could not be uploaded. Please try again.',
      }));
    } finally {
      setUploadingImage(false);
      // Allow re-selecting the same file after a remove/retry.
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      identity: {
        type: (prev.identity?.type || 'nin') as IdentityDocumentType,
        image: '',
        number: prev.identity?.number || '',
        country: prev.identity?.country || 'NG',
      } as any,
    }));
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.identity?.type) {
      errors.type = 'Document type is required';
    }

    if (!formData.identity?.number?.trim()) {
      errors.number = 'Document number is required';
    }

    if (!formData.identity?.country?.trim()) {
      errors.country = 'Country is required';
    }

    if (!formData.identity?.image?.trim()) {
      errors.image = 'Document image is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The document image is required; a submit racing the upload would fail
    // validation against an empty field, so wait instead.
    if (uploadingImage) return;
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Document Type */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Document Type *</label>
        <select
          name="type"
          value={formData.identity?.type || 'nin'}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className={`w-full rounded-lg border px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] ${
            fieldErrors.type ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}
        >
          {DOCUMENT_TYPES.map((doc) => (
            <option key={doc.value} value={doc.value}>
              {doc.label}
            </option>
          ))}
        </select>
        {fieldErrors.type && <p className="text-sm text-red-600">{fieldErrors.type}</p>}
      </div>

      {/* Document Number */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Document Number *</label>
        <Input
          name="number"
          type="text"
          placeholder="Enter document number"
          value={formData.identity?.number || ''}
          onChange={handleInputChange}
          disabled={isSubmitting}
          error={fieldErrors.number}
        />
      </div>

      {/* Country of Issue */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Country of Issue *</label>
        <select
          name="country"
          value={formData.identity?.country || 'NG'}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className={`w-full rounded-lg border px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] ${
            fieldErrors.country ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        {fieldErrors.country && <p className="text-sm text-red-600">{fieldErrors.country}</p>}
      </div>

      {/* Document Image */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Document Image *</label>
        {formData.identity?.image ? (
          <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
            <img
              src={formData.identity.image}
              alt="Document"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              disabled={isSubmitting}
              className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-100 shadow-sm"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isSubmitting || uploadingImage}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100 transition disabled:opacity-50 flex flex-col items-center justify-center gap-2"
          >
            {uploadingImage ? (
              <>
                <Spinner size="sm" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Click to upload document</p>
                <p className="text-xs text-gray-600">PNG, JPG up to 4MB</p>
              </>
            )}
          </button>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isSubmitting}
        />
        {fieldErrors.image && <p className="text-sm text-red-600">{fieldErrors.image}</p>}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Ensure your document is clearly visible and not expired. Upload a clear, well-lit photo of your document.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || uploadingImage}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : (
          <span className="flex items-center justify-center gap-2">
            Submit for Review <ChevronRight size={18} />
          </span>
        )}
      </Button>
    </form>
  );
};
