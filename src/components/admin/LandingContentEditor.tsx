'use client';

import { useId, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';

import { uploadService } from '@/services/upload.service';
import type {
  LandingContent,
  LandingHeroSlide,
  ShowcaseBusiness,
} from '@/types/platform-settings.types';

/**
 * Editor for the landing page's hero and "Businesses That Use …" strip.
 *
 * Kept out of the settings page because it is a small form of its own: the
 * hero is a list of background slides and the showcase is a list of companies,
 * each with its own image. `value` is the whole landing block; every change
 * hands back a new object so the page can save it in one request.
 *
 * Images follow the platform's existing upload route: the file goes to
 * Cloudinary through `POST /uploads/images` with the `site` folder, and the
 * returned secure URL is stored like any other image URL. A pasted CDN link
 * works equally well — the input stays editable either way.
 */

const GRADIENT_PRESETS = [
  { value: 'from-violet-600 to-indigo-600', label: 'Violet → Indigo' },
  { value: 'from-emerald-500 to-teal-600', label: 'Emerald → Teal' },
  { value: 'from-sky-500 to-blue-600', label: 'Sky → Blue' },
  { value: 'from-rose-500 to-pink-600', label: 'Rose → Pink' },
  { value: 'from-red-500 to-rose-600', label: 'Red → Rose' },
  { value: 'from-amber-500 to-orange-600', label: 'Amber → Orange' },
  { value: 'from-[#C9A84C] to-[#B8962E]', label: 'Titan Gold' },
  { value: 'from-gray-500 to-gray-700', label: 'Graphite' },
  { value: 'from-white to-white', label: 'White (logo fills the tile)' },
];

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** Preview aspect: hero images are wide, logos are square. */
  aspect?: 'wide' | 'square';
}

function ImageField({ label, value, onChange, hint, aspect = 'wide' }: ImageFieldProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const response = await uploadService.uploadImage(file, 'site');

      if (!response.success || !response.data?.image_url) {
        throw new Error(response.message || 'The image could not be uploaded.');
      }

      onChange(response.data.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The image could not be uploaded.');
    } finally {
      setUploading(false);
      // Allow re-uploading the same file.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="flex items-start gap-3">
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${
            aspect === 'square' ? 'h-16 w-16' : 'h-16 w-28'
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon size={20} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={inputId}
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://cdn.example.com/image.jpg"
            className={INPUT_CLASS}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-[#C9A84C]/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs font-semibold text-gray-400 transition hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => upload(event.target.files?.[0])}
          />

          {error ? (
            <p className="text-xs font-semibold text-red-600">{error}</p>
          ) : (
            hint && <p className="text-xs leading-relaxed text-gray-400">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  hint?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={2}
          className={`${INPUT_CLASS} resize-none`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={INPUT_CLASS}
        />
      )}

      {hint && <p className="text-xs leading-relaxed text-gray-400">{hint}</p>}
    </div>
  );
}

/** A collapsed-by-default shell so six slides or twenty clients stay readable. */
function EditorCard({
  title,
  badge,
  onRemove,
  removeDisabled,
  children,
}: {
  title: string;
  badge: string;
  onRemove: () => void;
  removeDisabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDFAF3] text-[10px] font-black text-[#B8962E]">
          {badge}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">{title}</span>
        <button
          type="button"
          onClick={(event) => {
            // Do not toggle the <details> when removing the row.
            event.preventDefault();
            onRemove();
          }}
          disabled={removeDisabled}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Remove ${title}`}
        >
          <Trash2 size={13} /> Remove
        </button>
      </summary>

      <div className="space-y-4 border-t border-gray-100 px-4 py-4">{children}</div>
    </details>
  );
}

export interface LandingContentEditorProps {
  value: LandingContent;
  onChange: (next: LandingContent) => void;
}

export default function LandingContentEditor({ value, onChange }: LandingContentEditorProps) {
  const { hero, showcase } = value;

  const setHero = (patch: Partial<LandingContent['hero']>) =>
    onChange({ ...value, hero: { ...hero, ...patch } });

  const setShowcase = (patch: Partial<LandingContent['showcase']>) =>
    onChange({ ...value, showcase: { ...showcase, ...patch } });

  const updateSlide = (index: number, patch: Partial<LandingHeroSlide>) =>
    setHero({
      slides: hero.slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    });

  const addSlide = () =>
    setHero({
      slides: [
        ...hero.slides,
        {
          image_url: '',
          headline: '',
          subtext: '',
          service: '',
        },
      ],
    });

  const removeSlide = (index: number) =>
    setHero({ slides: hero.slides.filter((_, i) => i !== index) });

  const updateBusiness = (index: number, patch: Partial<ShowcaseBusiness>) =>
    setShowcase({
      businesses: showcase.businesses.map((business, i) =>
        i === index ? { ...business, ...patch } : business
      ),
    });

  const addBusiness = () =>
    setShowcase({
      businesses: [
        ...showcase.businesses,
        {
          name: '',
          website: '',
          logo: '',
          gradient: GRADIENT_PRESETS[0].value,
          initials: '',
          rating: 5,
          industry: '',
        },
      ],
    });

  const removeBusiness = (index: number) =>
    setShowcase({ businesses: showcase.businesses.filter((_, i) => i !== index) });

  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
            Hero section
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            The first thing visitors see. Each slide pairs a background image with its own
            headline; the gold line and the button labels are shared by every slide.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="Headline accent"
            value={hero.headline_accent}
            onChange={(headline_accent) => setHero({ headline_accent })}
            placeholder="with Acceding Titans"
            maxLength={60}
            hint="The gold second line. Leave blank to hide it."
          />
          <TextField
            label="Primary button"
            value={hero.primary_cta_label}
            onChange={(primary_cta_label) => setHero({ primary_cta_label })}
            placeholder="Get Started Free"
            maxLength={40}
          />
          <TextField
            label="Secondary button"
            value={hero.secondary_cta_label}
            onChange={(secondary_cta_label) => setHero({ secondary_cta_label })}
            placeholder="Explore Services"
            maxLength={40}
          />
        </div>

        <div className="space-y-3">
          {hero.slides.map((slide, index) => (
            <EditorCard
              key={index}
              badge={String(index + 1)}
              title={slide.headline || `Slide ${index + 1}`}
              onRemove={() => removeSlide(index)}
              removeDisabled={hero.slides.length <= 1}
            >
              <ImageField
                label="Background image"
                value={slide.image_url}
                onChange={(image_url) => updateSlide(index, { image_url })}
                hint="Recommended 1920×1080 or wider. Upload a file or paste a CDN link."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Headline"
                  value={slide.headline}
                  onChange={(headline) => updateSlide(index, { headline })}
                  placeholder="Showcase Your Business"
                  maxLength={120}
                />
                <TextField
                  label="Service label"
                  value={slide.service}
                  onChange={(service) => updateSlide(index, { service })}
                  placeholder="Business Catalogue"
                  maxLength={60}
                />
              </div>
              <TextField
                label="Supporting text"
                value={slide.subtext}
                onChange={(subtext) => updateSlide(index, { subtext })}
                placeholder="Display your products and services to thousands of engaged entrepreneurs"
                maxLength={400}
                multiline
              />
            </EditorCard>
          ))}

          <button
            type="button"
            onClick={addSlide}
            disabled={hero.slides.length >= 6}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#C9A84C]/40 px-4 py-2.5 text-xs font-bold text-[#B8962E] transition hover:bg-[#FDFAF3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} /> Add slide
          </button>
          <p className="text-xs text-gray-400">
            {hero.slides.length} of 6 slides used. Slides rotate every six seconds.
          </p>
        </div>
      </section>

      {/* ── Showcase ─────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-gray-100 pt-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
            Businesses showcase
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            The scrolling strip on the landing page. Add a logo or leave it blank — the card then
            shows the business initials over the chosen gradient.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="Heading (plain part)"
            value={showcase.heading_prefix}
            onChange={(heading_prefix) => setShowcase({ heading_prefix })}
            placeholder="Businesses That Use"
            maxLength={80}
          />
          <TextField
            label="Heading (gold part)"
            value={showcase.heading_accent}
            onChange={(heading_accent) => setShowcase({ heading_accent })}
            placeholder="Acceding Titans"
            maxLength={80}
          />
          <div className="sm:col-span-1">
            <TextField
              label="Supporting text"
              value={showcase.subheading}
              onChange={(subheading) => setShowcase({ subheading })}
              placeholder="Join hundreds of forward-thinking companies…"
              maxLength={300}
              multiline
            />
          </div>
        </div>

        <div className="space-y-3">
          {showcase.businesses.map((business, index) => (
            <EditorCard
              key={index}
              badge={String(index + 1)}
              title={business.name || `Business ${index + 1}`}
              onRemove={() => removeBusiness(index)}
              removeDisabled={showcase.businesses.length <= 1}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Business name"
                  value={business.name}
                  onChange={(name) => updateBusiness(index, { name })}
                  placeholder="Remonode"
                  maxLength={80}
                />
                <TextField
                  label="Website"
                  value={business.website}
                  onChange={(website) => updateBusiness(index, { website })}
                  placeholder="remonode.com"
                  maxLength={255}
                  hint="https:// is added automatically when omitted."
                />
                <TextField
                  label="Industry"
                  value={business.industry}
                  onChange={(industry) => updateBusiness(index, { industry })}
                  placeholder="Technology"
                  maxLength={60}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Rating</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={business.rating}
                      onChange={(event) =>
                        updateBusiness(index, { rating: Number(event.target.value) })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <TextField
                    label="Initials"
                    value={business.initials}
                    onChange={(initials) =>
                      updateBusiness(index, { initials: initials.toUpperCase().slice(0, 3) })
                    }
                    placeholder="RM"
                    maxLength={3}
                    hint="Used when there is no logo."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Fallback gradient
                </label>
                <select
                  value={business.gradient}
                  onChange={(event) => updateBusiness(index, { gradient: event.target.value })}
                  className={INPUT_CLASS}
                >
                  {GRADIENT_PRESETS.every((preset) => preset.value !== business.gradient) && (
                    <option value={business.gradient}>Custom (current)</option>
                  )}
                  {GRADIENT_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <ImageField
                label="Logo"
                value={business.logo}
                onChange={(logo) => updateBusiness(index, { logo })}
                aspect="square"
                hint="Square logo works best. Leave blank to use the initials tile."
              />
            </EditorCard>
          ))}

          <button
            type="button"
            onClick={addBusiness}
            disabled={showcase.businesses.length >= 24}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#C9A84C]/40 px-4 py-2.5 text-xs font-bold text-[#B8962E] transition hover:bg-[#FDFAF3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} /> Add business
          </button>
          <p className="text-xs text-gray-400">
            {showcase.businesses.length} of 24 businesses used.
          </p>
        </div>
      </section>
    </div>
  );
}
