'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Gift,
  Home,
  MapPin,
  Palette,
  Sparkles,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared/Button';
import { AuthProtectedRoute } from '@/components/AuthProtectedRoute';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { registerSchema, type RegisterSchema } from '@/utils/validation.utils';
import { BIRTHDAY_COLORS } from '@/utils/birthday.utils';
import type { BirthdayGender, BirthdayGiftPreference } from '@/types/birthday.types';

const STEPS = [
  {
    id: 1,
    label: 'Personal',
    fields: ['first_name', 'last_name', 'email'] as const,
    description: 'Tell us who you are',
  },
  {
    id: 2,
    label: 'Contact',
    fields: ['phone_number'] as const,
    description: 'How can we reach you',
  },
  {
    id: 3,
    label: 'Security',
    fields: ['password', 'password_confirmation'] as const,
    description: 'Secure your account',
  },
  {
    id: 4,
    label: 'Birthday',
    fields: ['favorite_color', 'gender', 'address_line1', 'city', 'state', 'country'] as const,
    description: 'Your birthday details',
  },
  {
    id: 5,
    label: 'Plan',
    fields: ['wish_list', 'gift_preference'] as const,
    description: 'Your gift preferences',
  },
];

/**
 * The birthday plan (steps 4 and 5) replaces the compulsory form that used
 * to block the Birthdays hub. The fields are validated by the same zod
 * schema as everything else; optional inputs (apartment, postal code, gift
 * notes) are deliberately absent from this map, because "empty" is a valid
 * answer for them and the missing-value check below would reject it.
 */
const stepFields: Record<number, (keyof RegisterSchema)[]> = {
  1: ['first_name', 'last_name', 'email'],
  2: ['phone_number'],
  3: ['password', 'password_confirmation'],
  4: ['favorite_color', 'gender', 'address_line1', 'city', 'state', 'country'],
  5: ['wish_list', 'gift_preference'],
};

const GENDERS: { value: BirthdayGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const GIFT_OPTIONS: {
  value: BirthdayGiftPreference;
  title: string;
  description: string;
  icon: typeof Gift;
}[] = [
  {
    value: 'consumable',
    title: 'Consumables',
    description: 'Hampers, food, drinks or a voucher to enjoy.',
    icon: UtensilsCrossed,
  },
  {
    value: 'appliance',
    title: 'Everyday appliance or product',
    description: 'Something useful for your home or work.',
    icon: Home,
  },
  {
    value: 'service',
    title: 'Service experience',
    description: 'A spa day, hairstyling session or similar treat.',
    icon: Sparkles,
  },
  {
    value: 'surprise',
    title: 'Surprise me',
    description: 'Leave the choice to the team.',
    icon: Gift,
  },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex w-full items-center justify-center">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                  done
                    ? 'bg-[#C9A84C] text-white'
                    : active
                      ? 'bg-[#C9A84C] text-white ring-4 ring-[#C9A84C]/20'
                      : 'border border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 size={14} /> : step.id}
              </div>

              <span
                className={`mt-1.5 whitespace-nowrap text-xs font-medium ${
                  active ? 'text-[#C9A84C]' : done ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              /* flex-1 (not a fixed width): five steps would overflow the
                 420px card with the old w-12/w-16 connectors. */
              <div
                className={`mx-1 mb-5 h-[2px] min-w-2 flex-1 rounded-full ${
                  current > step.id ? 'bg-[#C9A84C]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldWrapper({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-gray-700">{label}</label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        {children}
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PasswordInput({
  label,
  placeholder,
  error,
  registration,
}: {
  label: string;
  placeholder: string;
  error?: string;
  registration: any;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrapper label={label} icon={<Lock size={16} />} error={error}>
      <input
        {...registration}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </FieldWrapper>
  );
}

function RegisterPageContent() {
  const { register: registerUser, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState<string>('');
  /**
   * The terms checkbox lives on step 3, but the account is created on step
   * 5 — without this the required attribute would no longer be in the DOM
   * at submit time and agreement would go unenforced.
   */
  const [agreed, setAgreed] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  // Populate referral code from URL query parameter
  const refCode = searchParams.get('ref');
  useEffect(() => {
    if (refCode) {
      setValue('referral_code', refCode);
    }
  }, [refCode, setValue]);

  // Live values for the swatch/option buttons on steps 4 and 5.
  const favoriteColor = useWatch({ control, name: 'favorite_color' });
  const gender = useWatch({ control, name: 'gender' });
  const giftPreference = useWatch({ control, name: 'gift_preference' });
  const giftNotes = useWatch({ control, name: 'gift_preference_notes' }) ?? '';

  const handleNext = async () => {
    setValidationError('');
    const valid = await trigger(stepFields[currentStep]);
    
    if (!valid) {
      // Get field errors for current step
      const stepFieldsForCurrentStep = stepFields[currentStep];
      const fieldErrors = stepFieldsForCurrentStep
        .map(field => errors[field]?.message)
        .filter(Boolean);
      
      if (fieldErrors.length > 0) {
        setValidationError(fieldErrors[0] as string);
      }
      return;
    }
    
    // Validate that required fields have values
    const values = getValues();
    const missingFields = stepFields[currentStep].filter(field => !values[field]);
    
    if (missingFields.length > 0) {
      setValidationError(`Please fill in all required fields`);
      return;
    }

    if (currentStep === 3 && !agreed) {
      setValidationError('Please accept the Terms of Service to continue.');
      return;
    }
    
    setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  };

  const handleBack = () => {
    setValidationError('');
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const onSubmit = async (data: RegisterSchema) => {
    if (!agreed) {
      setValidationError('Please accept the Terms of Service to continue.');
      return;
    }
    await registerUser(data);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Subtle gold radial glow — barely there */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full bg-[#C9A84C]/[0.06] blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-10 pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[420px]">

          {/* ── Card — flat/edge-to-edge on mobile, card from sm+ ── */}
          <div className="sm:rounded-2xl sm:border sm:border-gray-100 sm:bg-white sm:shadow-[0_2px_32px_rgba(0,0,0,0.07)] sm:overflow-hidden">

            {/* Signature element: 3px gold gradient top bar (card only) */}
            <div className="hidden sm:block h-[3px] bg-gradient-to-r from-[#C9A84C]/35 via-[#C9A84C] to-[#C9A84C]/35" />

            <div className="px-5 sm:px-8 py-9 sm:py-8">

              {/* ── Header ── */}
              <div className="mb-6 text-center">
                {/* Brand logo */}
                <Image
                  src="/icon.png"
                  alt="Acceding Titans Logo"
                  width={64}
                  height={64}
                  className="mx-auto mb-5 h-14 w-14 rounded-full ring-1 ring-[#C9A84C]/25 shadow-sm sm:h-16 sm:w-16"
                  priority
                />
                <h1 className="text-[21px] font-semibold tracking-tight text-gray-900">Create Account</h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].description}
                </p>
              </div>

              {/* Referral Banner */}
              {refCode && (
                <div className="mb-6 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-r from-[#C9A84C]/5 to-[#D4B85C]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/15 text-[#C9A84C]">
                      <Gift size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        You were referred by a friend! 🎉
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        Referral code{' '}
                        <code className="rounded-md bg-[#C9A84C]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[#C9A84C]">
                          {refCode}
                        </code>{' '}
                        has been applied. Complete your registration to get started.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <StepIndicator current={currentStep} />

              <form onSubmit={handleSubmit(onSubmit)}>
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FieldWrapper
                        label="First Name"
                        icon={<User size={14} />}
                        error={errors.first_name?.message}
                      >
                        <input
                          {...register('first_name')}
                          type="text"
                          placeholder="John"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                        />
                      </FieldWrapper>

                      <FieldWrapper
                        label="Last Name"
                        icon={<User size={14} />}
                        error={errors.last_name?.message}
                      >
                        <input
                          {...register('last_name')}
                          type="text"
                          placeholder="Doe"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                        />
                      </FieldWrapper>
                    </div>

                    <FieldWrapper
                      label="Email Address"
                      icon={<Mail size={14} />}
                      error={errors.email?.message}
                    >
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                      />
                    </FieldWrapper>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="rip-input-wrapper">
                      <PhoneInput
                        control={control as any}
                        name="phone_number"
                        label="Phone Number"
                        defaultCountry="NG"
                        placeholder="Enter your phone number"
                        required={true}
                      />
                    </div>

                    <FieldWrapper label="Referral Code (Optional)" icon={<Gift size={14} />}>
                      <input
                        {...register('referral_code')}
                        type="text"
                        placeholder="Acceding Titans-XXXXX"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 uppercase tracking-wider text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                      />
                    </FieldWrapper>

                    <p className="text-xs leading-5 text-gray-500">
                      Enter a referral code if someone invited you.
                    </p>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <PasswordInput
                      label="Password"
                      placeholder="••••••••"
                      error={errors.password?.message}
                      registration={register('password')}
                    />

                    <PasswordInput
                      label="Confirm Password"
                      placeholder="••••••••"
                      error={errors.password_confirmation?.message}
                      registration={register('password_confirmation')}
                    />

                    <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-600 pt-1">
                      <input
                        type="checkbox"
                        required
                        checked={agreed}
                        onChange={(event) => setAgreed(event.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#C9A84C]"
                      />
                      <span className="leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="font-semibold text-[#C9A84C] hover:text-[#B8962E]">
                          Terms of Service
                        </Link>{' '}
                        and platform policies.
                      </span>
                    </label>
                  </div>
                )}

                {/* ── Step 4: birthday details (was the compulsory form on
                     the Birthdays hub) ── */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <fieldset>
                      <legend className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                        <Palette size={14} className="text-[#C9A84C]" />
                        Favourite colour
                      </legend>

                      <div className="mt-2.5 grid grid-cols-4 gap-2">
                        {BIRTHDAY_COLORS.map((color) => {
                          const active =
                            (favoriteColor ?? '').trim().toLowerCase() === color.name.toLowerCase();

                          return (
                            <button
                              key={color.name}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setValue('favorite_color', color.name, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                                active
                                  ? 'border-[#C9A84C] bg-[#FDFAF3]'
                                  : 'border-gray-200 hover:border-[#C9A84C]/60'
                              }`}
                            >
                              <span
                                className="h-6 w-6 rounded-full border border-black/10 shadow-inner"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-[10px] font-semibold text-gray-500">
                                {color.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <input
                        {...register('favorite_color')}
                        type="text"
                        maxLength={40}
                        placeholder="Or type a colour, e.g. Burgundy"
                        className="mt-2.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                      />
                      {errors.favorite_color ? (
                        <p className="mt-1.5 text-xs text-red-500">
                          {errors.favorite_color.message}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-gray-400">
                          Helps us avoid colours you would not wear or use.
                        </p>
                      )}
                    </fieldset>

                    <fieldset>
                      <legend className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                        <UserRound size={14} className="text-[#C9A84C]" />
                        Gender
                      </legend>

                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {GENDERS.map((option) => {
                          const active = gender === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setValue('gender', option.value, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                active
                                  ? 'border-[#C9A84C] bg-[#FDFAF3] text-[#8A6F1F]'
                                  : 'border-gray-200 text-gray-600 hover:border-[#C9A84C]/60'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {errors.gender ? (
                        <p className="mt-1.5 text-xs text-red-500">{errors.gender.message}</p>
                      ) : (
                        <p className="mt-1.5 text-xs text-gray-400">
                          Used only to choose a suitable gift.
                        </p>
                      )}
                    </fieldset>

                    <div className="space-y-4">
                      <FieldWrapper
                        label="Street address"
                        icon={<MapPin size={14} />}
                        error={errors.address_line1?.message}
                      >
                        <input
                          {...register('address_line1')}
                          type="text"
                          maxLength={255}
                          placeholder="House number and street"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                        />
                      </FieldWrapper>

                      <FieldWrapper
                        label="Apartment, suite or landmark (optional)"
                        icon={<MapPin size={14} />}
                      >
                        <input
                          {...register('address_line2')}
                          type="text"
                          maxLength={255}
                          placeholder="Flat 4B, near the roundabout"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                        />
                      </FieldWrapper>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FieldWrapper
                          label="City"
                          icon={<MapPin size={14} />}
                          error={errors.city?.message}
                        >
                          <input
                            {...register('city')}
                            type="text"
                            maxLength={100}
                            placeholder="City"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                          />
                        </FieldWrapper>

                        <FieldWrapper
                          label="State or region"
                          icon={<MapPin size={14} />}
                          error={errors.state?.message}
                        >
                          <input
                            {...register('state')}
                            type="text"
                            maxLength={100}
                            placeholder="State"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                          />
                        </FieldWrapper>

                        <FieldWrapper
                          label="Postal code (optional)"
                          icon={<MapPin size={14} />}
                        >
                          <input
                            {...register('postal_code')}
                            type="text"
                            maxLength={20}
                            placeholder="Postal code"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                          />
                        </FieldWrapper>

                        <FieldWrapper
                          label="Country"
                          icon={<MapPin size={14} />}
                          error={errors.country?.message}
                        >
                          <input
                            {...register('country')}
                            type="text"
                            maxLength={100}
                            placeholder="Country"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                          />
                        </FieldWrapper>
                      </div>

                      <div className="flex items-start gap-2 rounded-xl bg-[#FDFAF3]/60 px-3 py-2.5">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-[#C9A84C]" />
                        <p className="text-[11px] leading-relaxed text-gray-500">
                          This address is shared only with the team arranging your birthday gift.
                          It never appears on your public celebration page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 5: wish list and gift style ── */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="wish-list"
                        className="block text-[13px] font-medium text-gray-700"
                      >
                        Your wish list <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="wish-list"
                        {...register('wish_list')}
                        rows={4}
                        maxLength={1300}
                        placeholder={'One per line, e.g.\nA leather journal\nWireless headphones'}
                        className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                      />
                      {errors.wish_list ? (
                        <p className="mt-1.5 text-xs text-red-500">{errors.wish_list.message}</p>
                      ) : (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                          One item per line, up to 10. This is a wish list, not a guarantee — it
                          tells the team what you would actually enjoy.
                        </p>
                      )}
                    </div>

                    <fieldset>
                      <legend className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                        <Sparkles size={14} className="text-[#C9A84C]" />
                        What kind of gift would you prefer?
                      </legend>

                      <div className="mt-2.5 grid gap-2">
                        {GIFT_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const active = giftPreference === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setValue('gift_preference', option.value, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                                active
                                  ? 'border-[#C9A84C] bg-[#FDFAF3]'
                                  : 'border-gray-200 hover:border-[#C9A84C]/60'
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  active
                                    ? 'bg-[#C9A84C]/15 text-[#B8962E]'
                                    : 'bg-gray-50 text-gray-400'
                                }`}
                              >
                                <Icon size={15} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-gray-900">
                                  {option.title}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">
                                  {option.description}
                                </span>
                              </span>
                              {active && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A84C] text-white">
                                  <Check size={12} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {errors.gift_preference && (
                        <p className="mt-2 text-xs text-red-500">
                          {errors.gift_preference.message}
                        </p>
                      )}
                    </fieldset>

                    <div>
                      <label
                        htmlFor="gift-notes"
                        className="block text-[13px] font-medium text-gray-700"
                      >
                        Anything specific?{' '}
                        <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        id="gift-notes"
                        {...register('gift_preference_notes')}
                        rows={2}
                        maxLength={500}
                        placeholder="e.g. I would love a spa day or a hairstyling session"
                        className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[11px] text-gray-400">
                          If you chose a service, tell us which one you have in mind.
                        </p>
                        <span className="text-[10px] font-semibold text-gray-300">
                          {giftNotes.length}/500
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                    {validationError}
                  </div>
                )}

                <div className={`mt-7 flex gap-3 ${currentStep > 1 ? '' : 'flex-col'}`}>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      <ArrowLeft size={14} />
                      Back
                    </button>
                  )}

                  {currentStep < STEPS.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-3 sm:py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <Button
                      type="submit"
                      fullWidth
                      isLoading={isLoading}
                      className="flex-1 rounded-xl bg-[#C9A84C] py-3 sm:py-2.5 font-semibold text-white hover:bg-[#B8962E]"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        Create Account
                        <ArrowRight size={14} />
                      </span>
                    </Button>
                  )}
                </div>
              </form>

              {/* ── Login link ── */}
              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
                >
                  Sign in
                </Link>
              </p>

            </div>
          </div>

          {/* Bottom security note */}
          <p className="mt-5 text-center text-xs text-gray-400">
            Secured with enterprise-grade encryption
          </p>

        </div>
      </div>
    </div>
  );
}

function RegisterPageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProtectedRoute requireUnauthenticated={true} redirectTo="/dashboard">
      <Suspense fallback={<RegisterPageFallback />}>
        <RegisterPageContent />
      </Suspense>
    </AuthProtectedRoute>
  );
}