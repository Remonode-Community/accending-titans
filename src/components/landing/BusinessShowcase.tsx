'use client';

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import {
  DEFAULT_LANDING_CONTENT,
  type LandingShowcase,
  type ShowcaseBusiness,
} from '@/types/platform-settings.types';

/*
 * The businesses below were hard-coded here; they are now administrator-managed
 * from the settings screen and arrive through the public site-settings
 * endpoint. The defaults in `DEFAULT_LANDING_CONTENT` keep the strip populated
 * on first paint and on an installation that has never opened that screen.
 */

/* ─── Single card ────────────────────────────────────────────── */
function BusinessCard({ business }: { business: ShowcaseBusiness }) {
  const [imgFailed, setImgFailed] = useState(false);

  const handleClick = () => {
    if (!business.website) return;
    window.open(business.website, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex-shrink-0 w-[200px] sm:w-[230px] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 rounded-2xl"
    >
      {/* Card body */}
      <div className="relative rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 hover:shadow-xl hover:border-[#C9A84C]/40 transition-all duration-300 h-full flex flex-col items-center">
        {/* Logo — CDN image with gradient-initials fallback */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl mb-3 overflow-hidden shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
          {/* Hidden gradient fallback (always rendered behind the image) */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${business.gradient} flex items-center justify-center`}
          >
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight">
              {business.initials}
            </span>
          </div>

          {/* CDN image — hidden if failed */}
          {business.logo && !imgFailed && (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              className="relative z-10 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
              loading="lazy"
            />
          )}
        </div>

        {/* Business name */}
        <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-1 leading-tight group-hover:text-[#C9A84C] transition-colors">
          {business.name}
        </h3>

        {/* Industry tag */}
        {business.industry && (
          <p className="text-[10px] sm:text-xs text-gray-400 mb-2">{business.industry}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-[#C9A84C] text-[#C9A84C]" />
          <span className="text-[11px] font-semibold text-gray-600">{business.rating}</span>
        </div>

        {/* Visited website indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20">
            <ExternalLink size={12} className="text-[#C9A84C]" />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Section ────────────────────────────────────────────────── */
export default function BusinessShowcase({ content }: { content?: LandingShowcase }) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showcase = content ?? DEFAULT_LANDING_CONTENT.showcase;
  const businesses =
    showcase.businesses.length > 0
      ? showcase.businesses
      : DEFAULT_LANDING_CONTENT.showcase.businesses;

  /* Inject keyframes once on mount */
  useEffect(() => {
    let styleEl = document.getElementById('business-scroll-keyframes');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'business-scroll-keyframes';
      styleEl.textContent = `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `;
      document.head.appendChild(styleEl);
    }
    return () => {
      const el = document.getElementById('business-scroll-keyframes');
      el?.remove();
    };
  }, []);

  /* Duplicate items for seamless infinite loop */
  const duplicated = [...businesses, ...businesses];
  return (
    <section id="business-showcase" className="relative bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#C9A84C]/5 blur-3xl" />
      <div className="absolute right-0 bottom-1/3 h-48 w-48 rounded-full bg-[#C9A84C]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {showcase.heading_prefix}{' '}
            <span className="text-[#C9A84C]">{showcase.heading_accent}</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            {showcase.subheading}
          </p>
        </div>

        {/* Infinite scroll track */}
        <div
          ref={containerRef}
          className="relative mx-auto max-w-full overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex gap-4 sm:gap-5 w-max"
            style={{
              animation: `scroll-left 40s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {duplicated.map((business, idx) => (
              <BusinessCard
                key={`${business.id ?? business.name}-${idx}`}
                business={business}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
