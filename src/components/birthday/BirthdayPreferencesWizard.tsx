'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Home,
  MapPin,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/utils/safe-storage.utils';
import { BIRTHDAY_COLORS, birthdayColorHex } from '@/utils/birthday.utils';
import { birthdayService } from '@/services/birthday.service';
import type {
  BirthdayGender,
  BirthdayGiftPreference,
  BirthdayPreferences,
} from '@/types/birthday.types';

/**
 * The compulsory birthday planning form.
 *
 * Entitled members (plan includes `birthdays`) see this before the Birthdays
 * hub until they have submitted it once. It collects the five things the team
 * needs to arrange a birthday: favourite colour, delivery address, wish list,
 * gender and the style of gift the member prefers.
 *
 * Split into steps rather than one long form because each group is a different
 * kind of question; the address alone would otherwise bury the wish list. The
 * review step exists so a compulsory form is never a blind submit.
 *
 * A draft is kept in localStorage between visits, so a member who closes the
 * tab mid-way does not start over.
 */

const DRAFT_KEY = 'birthday-plan-draft-v1';
const MAX_WISHES = 10;

const STEPS = [
  {
    key: 'about',
    title: 'About you',
    hint: 'The basics that help us choose something personal.',
    icon: UserRound,
  },
  {
    key: 'delivery',
    title: 'Delivery details',
    hint: 'Where a gift should go if one is sent.',
    icon: MapPin,
  },
  {
    key: 'wishes',
    title: 'Your wish list',
    hint: 'A few things you would genuinely love to receive.',
    icon: Gift,
  },
  {
    key: 'style',
    title: 'Gift style',
    hint: 'How you would like to be celebrated this year.',
    icon: Sparkles,
  },
  {
    key: 'review',
    title: 'Review',
    hint: 'Check everything before you save.',
    icon: Check,
  },
] as const;

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

interface FormState {
  favoriteColor: string;
  gender: BirthdayGender | '';
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  wishList: string[];
  giftPreference: BirthdayGiftPreference | '';
  notes: string;
}

function formFromPreferences(preferences?: BirthdayPreferences | null): FormState {
  const address = preferences?.address;

  return {
    favoriteColor: preferences?.favorite_color ?? '',
    gender: preferences?.gender ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postal_code ?? '',
    country: address?.country ?? 'Nigeria',
    wishList: preferences?.wish_list?.length ? [...preferences.wish_list] : [''],
    giftPreference: preferences?.gift_preference ?? '',
    notes: preferences?.gift_preference_notes ?? '',
  };
}

interface BirthdayPreferencesWizardProps {
  initial?: BirthdayPreferences | null;
  /** Gate mode is the compulsory first run; edit mode is opened on demand. */
  mode?: 'gate' | 'edit';
  /** Rendered inside an existing modal: drops its own card chrome. */
  embedded?: boolean;
  onCompleted: () => void;
  onCancel?: () => void;
}

export function BirthdayPreferencesWizard({
  initial,
  mode = 'gate',
  embedded = false,
  onCompleted,
  onCancel,
}: BirthdayPreferencesWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => formFromPreferences(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isFirstRun = !initial?.completed_at;

  // Restore a draft only for a first run: an edit should start from what the
  // member actually saved, not from an abandoned half-finished attempt.
  useEffect(() => {
    if (!isFirstRun) return;

    const raw = safeGetItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as Partial<FormState>;
      // Deliberately an effect rather than a lazy state initialiser: the page is
      // prerendered, and reading localStorage during render would hydration-
      // mismatch the server markup. Restoring after mount keeps the first paint
      // identical on both sides.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((previous) => ({
        ...previous,
        ...draft,
        wishList:
          Array.isArray(draft.wishList) && draft.wishList.length
            ? draft.wishList
            : previous.wishList,
      }));
    } catch {
      // A corrupt draft is not worth surfacing; the form simply starts clean.
    }
  }, [isFirstRun]);

  // Persist as they type. This is a long form and losing it on a refresh would
  // be the difference between finishing and giving up.
  useEffect(() => {
    if (finished) return;

    safeSetItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, finished]);

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const isLastStep = step === STEPS.length - 1;

  const scrollToTop = () => {
    const node = cardRef.current;
    if (!node) return;

    const top = node.getBoundingClientRect().top;
    if (top < 0) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;

      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const wishItems = useMemo(
    () => form.wishList.map((item) => item.trim()).filter(Boolean),
    [form.wishList]
  );

  const validateStep = (index: number): Record<string, string> => {
    const found: Record<string, string> = {};

    if (index === 0) {
      if (form.favoriteColor.trim().length < 2) {
        found.favoriteColor = 'Tell us your favourite colour.';
      }
      if (!form.gender) {
        found.gender = 'Select an option.';
      }
    }

    if (index === 1) {
      if (!form.line1.trim()) found.line1 = 'Enter your street address.';
      if (!form.city.trim()) found.city = 'Enter your city.';
      if (!form.state.trim()) found.state = 'Enter your state.';
      if (!form.country.trim()) found.country = 'Enter your country.';
    }

    if (index === 2) {
      if (wishItems.length === 0) {
        found.wishList = 'Add at least one item to your wish list.';
      } else if (new Set(wishItems.map((item) => item.toLowerCase())).size !== wishItems.length) {
        found.wishList = 'Remove the duplicate items.';
      }
    }

    if (index === 3 && !form.giftPreference) {
      found.giftPreference = 'Choose the kind of gift you would prefer.';
    }

    return found;
  };

  const goNext = () => {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStep((previous) => Math.min(previous + 1, STEPS.length - 1));
    scrollToTop();
  };

  const goBack = () => {
    setErrors({});
    setStep((previous) => Math.max(previous - 1, 0));
    scrollToTop();
  };

  const goToStep = (index: number) => {
    setErrors({});
    setStep(index);
    scrollToTop();
  };

  const submit = async () => {
    const found = [0, 1, 2, 3].reduce<Record<string, string>>(
      (all, index) => ({ ...all, ...validateStep(index) }),
      {}
    );

    if (Object.keys(found).length > 0) {
      // Send them to the first step that still has a problem.
      const firstBroken = [0, 1, 2, 3].find(
        (index) => Object.keys(validateStep(index)).length > 0
      );
      if (firstBroken !== undefined) goToStep(firstBroken);
      // Set after the jump: goToStep clears the previous step's errors.
      setErrors(found);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await birthdayService.updatePreferences({
        favorite_color: form.favoriteColor.trim(),
        gender: form.gender as BirthdayGender,
        address_line1: form.line1.trim(),
        address_line2: form.line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postalCode.trim() || null,
        country: form.country.trim(),
        wish_list: wishItems,
        gift_preference: form.giftPreference as BirthdayGiftPreference,
        gift_preference_notes: form.notes.trim() || null,
      });

      if (!response.success) {
        setSubmitError(response.message || 'Could not save your birthday plan. Try again.');
        return;
      }

      setFinished(true);
      // The saved answers are now the source of truth; a stale draft would
      // otherwise compete with them on the next visit.
      safeRemoveItem(DRAFT_KEY);
      onCompleted();
    } catch {
      setSubmitError('Could not save your birthday plan. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedColor = form.favoriteColor.trim().toLowerCase();

  return (
    <div
      ref={cardRef}
      className={
        embedded
          ? 'bg-white'
          : 'overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]'
      }
    >
      {/* Progress */}
      <div
        className={`border-b border-[#e5e7eb] ${
          embedded ? 'pb-4' : 'px-5 py-4 sm:px-6'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B8962E]">
            Step {step + 1} of {STEPS.length}
          </p>
          {isFirstRun && (
            <span className="rounded-full bg-[#FDFAF3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#B8962E]">
              One-time setup
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= step ? 'bg-[#C9A84C]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
            <StepIcon size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight text-gray-900">
              {currentStep.title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{currentStep.hint}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={embedded ? 'py-5' : 'px-5 py-5 sm:px-6'}>
        {step === 0 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Palette size={13} className="text-[#C9A84C]" />
                Favourite colour
              </legend>

              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {BIRTHDAY_COLORS.map((color) => {
                  const active = selectedColor === color.name.toLowerCase();

                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => set('favoriteColor', color.name)}
                      aria-pressed={active}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                        active
                          ? 'border-[#C9A84C] bg-[#FDFAF3]'
                          : 'border-[#e5e7eb] hover:border-[#C9A84C]/60'
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-[10px] font-semibold text-gray-500 group-hover:text-gray-700">
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <input
                value={form.favoriteColor}
                onChange={(event) => set('favoriteColor', event.target.value)}
                placeholder="Or type a colour, e.g. Burgundy"
                maxLength={40}
                aria-invalid={Boolean(errors.favoriteColor)}
                className={`mt-3 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] ${
                  errors.favoriteColor ? 'border-red-400' : 'border-[#e5e7eb]'
                }`}
              />
              {errors.favoriteColor ? (
                <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                  {errors.favoriteColor}
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Helps us avoid colours you would not wear or use.
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <UserRound size={13} className="text-[#C9A84C]" />
                Gender
              </legend>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {GENDERS.map((option) => {
                  const active = form.gender === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => set('gender', option.value)}
                      aria-pressed={active}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? 'border-[#C9A84C] bg-[#FDFAF3] text-[#8A6F1F]'
                          : 'border-[#e5e7eb] text-gray-600 hover:border-[#C9A84C]/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {errors.gender ? (
                <p className="mt-1.5 text-[11px] font-semibold text-red-600">{errors.gender}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Used only to choose a suitable gift.
                </p>
              )}
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="address-line1" className="text-xs font-semibold text-gray-700">
                Street address <span className="text-red-500">*</span>
              </label>
              <input
                id="address-line1"
                value={form.line1}
                onChange={(event) => set('line1', event.target.value)}
                placeholder="House number and street"
                maxLength={255}
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] ${
                  errors.line1 ? 'border-red-400' : 'border-[#e5e7eb]'
                }`}
              />
              {errors.line1 && (
                <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.line1}</p>
              )}
            </div>

            <div>
              <label htmlFor="address-line2" className="text-xs font-semibold text-gray-700">
                Apartment, suite or landmark{' '}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="address-line2"
                value={form.line2}
                onChange={(event) => set('line2', event.target.value)}
                placeholder="Flat 4B, near the roundabout"
                maxLength={255}
                className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="text-xs font-semibold text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(event) => set('city', event.target.value)}
                  placeholder="City"
                  maxLength={100}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] ${
                    errors.city ? 'border-red-400' : 'border-[#e5e7eb]'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="text-xs font-semibold text-gray-700">
                  State or region <span className="text-red-500">*</span>
                </label>
                <input
                  id="state"
                  value={form.state}
                  onChange={(event) => set('state', event.target.value)}
                  placeholder="State"
                  maxLength={100}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] ${
                    errors.state ? 'border-red-400' : 'border-[#e5e7eb]'
                  }`}
                />
                {errors.state && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="postal-code" className="text-xs font-semibold text-gray-700">
                  Postal code <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="postal-code"
                  value={form.postalCode}
                  onChange={(event) => set('postalCode', event.target.value)}
                  placeholder="Postal code"
                  maxLength={20}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label htmlFor="country" className="text-xs font-semibold text-gray-700">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(event) => set('country', event.target.value)}
                  placeholder="Country"
                  maxLength={100}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C] ${
                    errors.country ? 'border-red-400' : 'border-[#e5e7eb]'
                  }`}
                />
                {errors.country && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.country}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-[#FDFAF3]/70 px-3 py-2.5">
              <MapPin size={13} className="mt-0.5 shrink-0 text-[#C9A84C]" />
              <p className="text-[11px] leading-relaxed text-gray-500">
                This address is shared only with the team arranging your birthday gift. It never
                appears on your public celebration page.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="space-y-2.5">
              {form.wishList.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FDFAF3] text-[11px] font-bold text-[#B8962E]">
                    {index + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(event) => {
                      const next = [...form.wishList];
                      next[index] = event.target.value;
                      set('wishList', next);
                    }}
                    placeholder={
                      index === 0 ? 'e.g. A leather journal' : 'e.g. Wireless headphones'
                    }
                    maxLength={120}
                    aria-label={`Wish list item ${index + 1}`}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'wishList',
                        form.wishList.filter((_, position) => position !== index)
                      )
                    }
                    disabled={form.wishList.length === 1}
                    aria-label={`Remove item ${index + 1}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => set('wishList', [...form.wishList, ''])}
              disabled={form.wishList.length >= MAX_WISHES}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#C9A84C]/40 px-3 py-2 text-xs font-bold text-[#B8962E] transition hover:bg-[#FDFAF3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} /> Add another item
            </button>

            {errors.wishList ? (
              <p className="mt-4 text-[11px] font-semibold text-red-600">{errors.wishList}</p>
            ) : (
              <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                Useful detail: sizes, brands or colours. This is a wish list, not a guarantee — it
                tells the team what you would actually enjoy.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs font-semibold text-gray-700">What kind of gift would you prefer?</p>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {GIFT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = form.giftPreference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set('giftPreference', option.value)}
                    aria-pressed={active}
                    className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-[#C9A84C] bg-[#FDFAF3]'
                        : 'border-[#e5e7eb] hover:border-[#C9A84C]/60'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active ? 'bg-[#C9A84C]/15 text-[#B8962E]' : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900">{option.title}</span>
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

            {errors.giftPreference && (
              <p className="mt-2 text-[11px] font-semibold text-red-600">
                {errors.giftPreference}
              </p>
            )}

            <div className="mt-5">
              <label htmlFor="gift-notes" className="text-xs font-semibold text-gray-700">
                Anything specific? <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="gift-notes"
                rows={3}
                maxLength={500}
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                placeholder="e.g. I would love a spa day or a hairstyling session"
                className="mt-1.5 w-full resize-none rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#C9A84C]"
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  If you chose a service, tell us which one you have in mind.
                </p>
                <span className="text-[10px] font-semibold text-gray-300">
                  {form.notes.length}/500
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <ReviewRow
              title="Favourite colour & gender"
              onEdit={() => goToStep(0)}
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDFAF3] px-2.5 py-1 text-[11px] font-bold text-[#8A6F1F]">
                    {birthdayColorHex(form.favoriteColor) && (
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: birthdayColorHex(form.favoriteColor) ?? undefined }}
                      />
                    )}
                    {form.favoriteColor.trim()}
                  </span>
                  <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-gray-600">
                    {form.gender}
                  </span>
                </div>
              }
            />

            <ReviewRow
              title="Delivery address"
              onEdit={() => goToStep(1)}
              value={
                <p className="text-xs leading-relaxed text-gray-600">
                  {[form.line1, form.line2, form.city, form.state, form.postalCode, form.country]
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .join(', ')}
                </p>
              }
            />

            <ReviewRow
              title="Wish list"
              onEdit={() => goToStep(2)}
              value={
                <ul className="flex flex-wrap gap-1.5">
                  {wishItems.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              }
            />

            <ReviewRow
              title="Gift style"
              onEdit={() => goToStep(3)}
              value={
                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    {GIFT_OPTIONS.find((option) => option.value === form.giftPreference)?.title ??
                      '—'}
                  </p>
                  {form.notes.trim() && (
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                      {form.notes.trim()}
                    </p>
                  )}
                </div>
              }
            />

            <div className="flex items-start gap-2 rounded-xl bg-[#FDFAF3]/70 px-3 py-2.5">
              <Check size={13} className="mt-0.5 shrink-0 text-[#C9A84C]" />
              <p className="text-[11px] leading-relaxed text-gray-500">
                You can update these answers any time from the Birthdays page. Only you and the
                birthday team can see them.
              </p>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className={`flex flex-col-reverse gap-2 border-t border-[#e5e7eb] sm:flex-row sm:items-center sm:justify-between ${
          embedded ? 'pt-4' : 'bg-gray-50/60 px-5 py-4 sm:px-6'
        }`}
      >
        <div>
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={goBack} disabled={submitting}>
              <ArrowLeft size={13} /> Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          {mode === 'edit' && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}

          {isLastStep ? (
            <Button size="sm" onClick={submit} isLoading={submitting} disabled={submitting}>
              <Check size={13} /> Save my birthday plan
            </Button>
          ) : (
            <Button size="sm" onClick={goNext} disabled={submitting}>
              Continue <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  title,
  value,
  onEdit,
}: {
  title: string;
  value: ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
            {title}
          </p>
          <div className="mt-1.5">{value}</div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#B8962E] transition hover:bg-[#FDFAF3]"
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
    </div>
  );
}
