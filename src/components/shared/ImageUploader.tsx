'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImageOff, Loader2, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploaderProps {
  /** Currently stored URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Receives a file to upload; resolve with the hosted URL. */
  onUpload: (file: File) => Promise<string>;
  max?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
  error?: string;
  /** Renders a 1:1 preview. Set false for wide banners. */
  aspect?: 'square' | 'wide';
  className?: string;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Image picker with previews.
 *
 * Uploads are delegated to the caller so this component stays free of API
 * knowledge. When the server has no upload provider configured the caller
 * rejects, and the component surfaces a "paste a link instead" affordance so
 * the form stays usable.
 */
export const ImageUploader = ({
  value,
  onChange,
  onUpload,
  max = 5,
  label,
  hint,
  disabled = false,
  error,
  aspect = 'square',
  className,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const atCapacity = value.length >= max;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploadError(null);
    setUploading(true);

    try {
      const accepted: string[] = [];

      for (const file of Array.from(files)) {
        if (value.length + accepted.length >= max) break;

        if (!ACCEPTED.includes(file.type)) {
          setUploadError('Only JPG, PNG or WebP images are supported.');
          continue;
        }

        if (file.size > MAX_BYTES) {
          setUploadError('Images must be 4MB or smaller.');
          continue;
        }

        try {
          accepted.push(await onUpload(file));
        } catch (err) {
          setUploadError(
            err instanceof Error ? err.message : 'That image could not be uploaded.',
          );
        }
      }

      if (accepted.length) {
        onChange([...value, ...accepted]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = linkValue.trim();

    if (!url) return;

    if (!/^https?:\/\/.+/i.test(url)) {
      setUploadError('Enter a full image link starting with http:// or https://');
      return;
    }

    if (value.length >= max) {
      setUploadError(`You can attach at most ${max} images.`);
      return;
    }

    onChange([...value, url]);
    setLinkValue('');
    setUploadError(null);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const previewClass = aspect === 'square' ? 'aspect-square' : 'aspect-[16/9]';

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium text-gray-700">{label}</span>
          {!atCapacity && (
            <span className="text-[11px] text-gray-400">
              {value.length}/{max}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={clsx(
              'group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50',
              previewClass,
            )}
          >
            <Image
              src={url}
              alt={`Upload ${index + 1}`}
              fill
              sizes="(max-width: 640px) 45vw, 200px"
              className="object-cover"
              onError={() => undefined}
              unoptimized
            />

            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-gray-600 shadow-sm transition hover:bg-red-600 hover:text-white"
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {!atCapacity && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={clsx(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 text-gray-400 transition hover:border-[#C9A84C]/40 hover:bg-[#FDFAF3] hover:text-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-60',
              previewClass,
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[11px] font-semibold">Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Add image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Link fallback — also the only option when the server has no upload provider. */}
      {!atCapacity && !disabled && (
        <div className="mt-2">
          {linkMode ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
              />
              <button
                type="button"
                onClick={addLink}
                className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkMode(false);
                  setLinkValue('');
                }}
                className="shrink-0 rounded-xl px-2 py-2 text-sm font-semibold text-gray-400 transition hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLinkMode(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition hover:text-[#C9A84C]"
            >
              <ImageOff size={13} />
              Or add an image link
            </button>
          )}
        </div>
      )}

      {hint && !error && !uploadError && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}

      {(error || uploadError) && (
        <p className="mt-1.5 text-xs text-red-500">{error ?? uploadError}</p>
      )}
    </div>
  );
};
