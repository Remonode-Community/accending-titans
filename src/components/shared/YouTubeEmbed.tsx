'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

/**
 * Pull a YouTube video id out of whatever the user pasted.
 *
 * Accepts a bare id, a watch URL, a short youtu.be URL, an /embed/ URL or a
 * /shorts/ URL, so a value copied straight from the YouTube address bar works.
 */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;

  const value = input.trim();
  if (!value) return null;

  // Bare id: 11 URL-safe characters.
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

      const match = url.pathname.match(/^\/(embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }

  return null;
}

interface YouTubeEmbedProps {
  /** Video id or any YouTube URL. Invalid/empty values render nothing. */
  videoId: string | null | undefined;
  /** Accessible name for the player, e.g. the video title. */
  title: string;
  className?: string;
  /** Small caption under the player. Omit for none. */
  caption?: string;
}

/**
 * Click-to-play YouTube embed ("facade" pattern).
 *
 * Why not a bare <iframe>:
 *  - The YouTube player is ~1.5 MB. Mounting it on page load makes the
 *    directory hero the heaviest part of the site.
 *  - Autoplaying with sound is blocked by browsers anyway, so an unmuted
 *    autoplay embed just sits there frozen.
 *
 * The facade renders YouTube's own thumbnail and swaps in the real player on
 * click, so the video still plays from YouTube but costs nothing until the
 * visitor asks for it.
 */
export function YouTubeEmbed({
  videoId,
  title,
  className = '',
  caption,
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  // Not every video has a maxres thumbnail, so step down rather than 404.
  const [quality, setQuality] = useState<'maxresdefault' | 'hqdefault'>('maxresdefault');
  const [thumbFailed, setThumbFailed] = useState(false);

  const id = parseYouTubeId(videoId);

  if (!id) return null;

  return (
    <figure className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {isPlaying ? (
          <iframe
            // youtube-nocookie avoids setting tracking cookies until playback.
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Play video: ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {thumbFailed ? (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#141821] to-[#0f1115]">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C] text-white shadow-lg shadow-[#C9A84C]/30 transition group-hover:scale-105">
                  <Play size={26} fill="currentColor" className="ml-1" />
                </span>
                <span className="px-6 text-center text-xs font-semibold text-white/70">
                  Play on YouTube
                </span>
              </span>
            ) : (
              <>
                <Image
                  src={`https://i.ytimg.com/vi/${id}/${quality}.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  onError={() => {
                    if (quality === 'maxresdefault') setQuality('hqdefault');
                    else setThumbFailed(true);
                  }}
                  unoptimized
                />
                {/* Keeps the play button legible over any thumbnail. */}
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C] text-white shadow-lg shadow-[#C9A84C]/40 ring-1 ring-white/25 transition group-hover:scale-105 group-hover:bg-[#B8962E] sm:h-[4.5rem] sm:w-[4.5rem]">
                    <Play
                      size={28}
                      fill="currentColor"
                      className="ml-1 transition group-hover:scale-110"
                    />
                  </span>
                </span>

                <span className="absolute bottom-3 left-4 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                  Watch on YouTube
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {caption && (
        <figcaption className="mt-3 text-center text-xs font-medium text-white/50">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
