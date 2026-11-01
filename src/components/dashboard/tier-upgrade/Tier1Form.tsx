/**
 * Tier 1 Upgrade Form Component
 * Bronze tier with personal details and BVN verification
 * 
 * Fields:
 * - dob (DD-MM-YYYY)
 * - phone (country code + number)
 * - address (street, city, state, country, postal code)
 * - identification_number (BVN - 11 digits)
 * - photo (image URL)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronRight, Upload, X } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Spinner } from '@/components/shared/Spinner';
import { TierUpgradeFormData, PhoneData, AddressData } from '@/types/tier-upgrade.types';
import { tierUpgradeService } from '@/services/tier-upgrade.service';

interface Tier1FormProps {
  initialData?: Partial<TierUpgradeFormData>;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (data: TierUpgradeFormData) => void;
  onSaveDraft: (data: Partial<TierUpgradeFormData>) => void;
}

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
].sort((a, b) => a.name.localeCompare(b.name));

export const Tier1Form: React.FC<Tier1FormProps> = ({
  initialData,
  isSubmitting,
  error,
  onSubmit,
  onSaveDraft,
}) => {
  const [formData, setFormData] = useState<TierUpgradeFormData>({
    dob: initialData?.dob || '',
    phone: {
      phone_country_code: initialData?.phone?.phone_country_code || '+234',
      phone_number: initialData?.phone?.phone_number || '',
    },
    address: {
      street: initialData?.address?.street || '',
      street2: initialData?.address?.street2 || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      country: initialData?.address?.country || 'NG',
      postal_code: initialData?.address?.postal_code || '',
    },
    identification_number: initialData?.identification_number || '',
    photo: initialData?.photo || '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Save draft on field change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSaveDraft(formData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, onSaveDraft]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    section?: string
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (section === 'phone') {
        return {
          ...prev,
          phone: {
            phone_country_code: prev.phone?.phone_country_code || '+234',
            phone_number: prev.phone?.phone_number || '',
            [name]: value,
          } as any,
        };
      } else if (section === 'address') {
        return {
          ...prev,
          address: {
            street: prev.address?.street || '',
            street2: prev.address?.street2,
            city: prev.address?.city || '',
            state: prev.address?.state || '',
            country: prev.address?.country || 'NG',
            postal_code: prev.address?.postal_code || '',
            [name]: value,
          } as any,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });

    try {
      // Upload to Cloudinary via the backend; only the hosted URL is kept, so
      // drafts and submissions stay small and the photo survives reloads.
      const res = await tierUpgradeService.uploadProfileImage(file);
      const imageUrl = res.data?.image_url;

      if (res.success && imageUrl) {
        setFormData((prev) => ({
          ...prev,
          photo: imageUrl,
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          photo: res.message || 'The photo could not be uploaded. Please try again.',
        }));
      }
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        photo:
          err instanceof Error
            ? err.message
            : 'The photo could not be uploaded. Please try again.',
      }));
    } finally {
      setUploadingPhoto(false);
      // Allow re-selecting the same file after a remove/retry.
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: '',
    }));
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.dob?.trim()) {
      errors.dob = 'Date of birth is required (DD-MM-YYYY)';
    } else if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.dob)) {
      errors.dob = 'Date must be in DD-MM-YYYY format';
    }

    if (!formData.phone?.phone_number?.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(formData.phone.phone_number.replace(/\D/g, ''))) {
      errors.phone_number = 'Phone number must be valid';
    }

    if (!formData.address?.street?.trim()) {
      errors.street = 'Street address is required';
    }
    if (!formData.address?.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.address?.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.address?.postal_code?.trim()) {
      errors.postal_code = 'Postal code is required';
    }

    if (!formData.identification_number?.trim()) {
      errors.identification_number = 'BVN is required';
    } else if (!/^\d{11}$/.test(formData.identification_number)) {
      errors.identification_number = 'BVN must be exactly 11 digits';
    }

    if (!formData.photo?.trim()) {
      errors.photo = 'Profile photo is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The photo is required; a submit racing the upload would fail validation
    // against an empty field, so wait instead.
    if (uploadingPhoto) return;
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

      {/* Date of Birth */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Date of Birth *</label>
        <Input
          name="dob"
          type="text"
          placeholder="DD-MM-YYYY"
          value={formData.dob || ''}
          onChange={(e) => handleInputChange(e)}
          disabled={isSubmitting}
          error={fieldErrors.dob}
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Phone Number *</label>
        <div className="flex gap-3">
          <select
            name="phone_country_code"
            value={formData.phone?.phone_country_code || '+234'}
            onChange={(e) => handleInputChange(e, 'phone')}
            disabled={isSubmitting}
            className="flex-shrink-0 w-24 rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.dialCode}>
                {country.dialCode}
              </option>
            ))}
          </select>
          <Input
            name="phone_number"
            type="tel"
            placeholder="8012345678"
            value={formData.phone?.phone_number || ''}
            onChange={(e) => handleInputChange(e, 'phone')}
            disabled={isSubmitting}
            error={fieldErrors.phone_number}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">Address</h3>

        {/* Street */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Street Address *</label>
          <Input
            name="street"
            type="text"
            placeholder="Enter street address"
            value={formData.address?.street || ''}
            onChange={(e) => handleInputChange(e, 'address')}
            disabled={isSubmitting}
            error={fieldErrors.street}
          />
        </div>

        {/* Street 2 */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Apt/Unit (Optional)</label>
          <Input
            name="street2"
            type="text"
            placeholder="Apartment, suite, etc."
            value={formData.address?.street2 || ''}
            onChange={(e) => handleInputChange(e, 'address')}
            disabled={isSubmitting}
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">City *</label>
            <Input
              name="city"
              type="text"
              placeholder="City"
              value={formData.address?.city || ''}
              onChange={(e) => handleInputChange(e, 'address')}
              disabled={isSubmitting}
              error={fieldErrors.city}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">State *</label>
            <Input
              name="state"
              type="text"
              placeholder="State"
              value={formData.address?.state || ''}
              onChange={(e) => handleInputChange(e, 'address')}
              disabled={isSubmitting}
              error={fieldErrors.state}
            />
          </div>
        </div>

        {/* Country & Postal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Country</label>
            <select
              name="country"
              value={formData.address?.country || 'NG'}
              onChange={(e) => handleInputChange(e, 'address')}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Postal Code *</label>
            <Input
              name="postal_code"
              type="text"
              placeholder="Postal code"
              value={formData.address?.postal_code || ''}
              onChange={(e) => handleInputChange(e, 'address')}
              disabled={isSubmitting}
              error={fieldErrors.postal_code}
            />
          </div>
        </div>
      </div>

      {/* BVN */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">BVN (11 digits) *</label>
        <Input
          name="identification_number"
          type="text"
          placeholder="Enter your 11-digit BVN"
          value={formData.identification_number || ''}
          onChange={(e) => handleInputChange(e)}
          disabled={isSubmitting}
          error={fieldErrors.identification_number}
          maxLength={11}
        />
        <p className="text-xs text-gray-600">Bank Verification Number (BVN)</p>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">Profile Photo *</label>
        {formData.photo ? (
          <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
            <img
              src={formData.photo}
              alt="Profile"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              disabled={isSubmitting}
              className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-100 shadow-sm"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isSubmitting || uploadingPhoto}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100 transition disabled:opacity-50 flex flex-col items-center justify-center gap-2"
          >
            {uploadingPhoto ? (
              <>
                <Spinner size="sm" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Click to upload photo</p>
                <p className="text-xs text-gray-600">PNG, JPG up to 4MB</p>
              </>
            )}
          </button>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={isSubmitting}
        />
        {fieldErrors.photo && <p className="text-sm text-red-600">{fieldErrors.photo}</p>}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || uploadingPhoto}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : (
          <span className="flex items-center justify-center gap-2">
            Continue <ChevronRight size={18} />
          </span>
        )}
      </Button>
    </form>
  );
};
