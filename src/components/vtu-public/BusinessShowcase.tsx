'use client';

import { useState, useRef, useEffect } from 'react';
import { Briefcase, ExternalLink, Star } from 'lucide-react';

/* ─── Dummy data ─────────────────────────────────────────────── */
interface Business {
  id: number;
  name: string;
  website: string;
  logo: string;
  gradient: string;
  initials: string;
  rating: number;
  industry: string;
}

const businesses: Business[] = [
  {
    id: 1,
    name: 'Remonode',
    website: 'https://remonode.com',
    logo: 'https://api.remopay.remonode.com/remonode.jpg',
    gradient: 'from-violet-600 to-indigo-600',
    initials: 'RM',
    rating: 5.0,
    industry: 'Technology',
  },
  {
    id: 2,
    name: 'Remopay',
    website: 'https://remopay.remonode.com',
    logo: 'https://api.remopay.remonode.com/remopay.png',
    gradient: 'from-emerald-500 to-teal-600',
    initials: 'RE',
    rating: 5.0,
    industry: 'Finance',
  },
  {
    id: 3,
    name: 'Remonyx',
    website: 'https://bluewavedigital.ng',
    logo: 'https://api.remopay.remonode.com/remonyx.png',
    gradient: 'from-sky-500 to-blue-600',
    initials: 'BD',
    rating: 4.7,
    industry: 'Telcom',
  },
  {
    id: 4,
    name: 'AFRIDataNG',
    website: 'afridata-cta.vercel.app',
    logo: 'https://api.remopay.remonode.com/AFRIDataNG.png',
    gradient: 'from-white to-white',
    initials: 'PB',
    rating: 4.6,
    industry: 'Telcom',
  },
  {
    id: 5,
    name: 'MassAxis',
    website: 'massaxis.com',
    logo: 'https://api.remopay.remonode.com/massaxis.jpg',
    gradient: 'from-rose-500 to-pink-600',
    initials: 'AC',
    rating: 4.5,
    industry: 'Food & Beverage',
  },
  {
    id: 6,
    name: 'LuxuryX',
    website: 'https://luxuryxtech.org.ng/',
    logo: 'https://api.remopay.remonode.com/luxuryx.png',
    gradient: 'from-red-500 to-rose-600',
    initials: 'LU',
    rating: 4.8,
    industry: 'Blockchain',
  },
  {
    id: 6,
    name: 'feMOJ World',
    website: 'https://luxuryxtech.org.ng/',
    logo: 'https://api.remopay.remonode.com/femoj_world.png',
    gradient: 'from-red-500 to-rose-600',
    initials: 'FW',
    rating: 4.8,
    industry: 'E-Commerce',
  },

];

/* ─── Single card ────────────────────────────────────────────── */
function BusinessCard({ business }: { business: Business }) {
  const [imgFailed, setImgFailed] = useState(false);

  const handleClick = () => {
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
          {!imgFailed && (
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
        <p className="text-[10px] sm:text-xs text-gray-400 mb-2">{business.industry}</p>

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
export default function BusinessShowcase() {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#C9A84C]/5 blur-3xl" />
      <div className="absolute right-0 bottom-1/3 h-48 w-48 rounded-full bg-[#C9A84C]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Businesses That Use{' '}
            <span className="text-[#C9A84C]">Acceding Titans</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Join hundreds of forward-thinking companies already growing their reach on our platform
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
              <BusinessCard key={`${business.id}-${idx}`} business={business} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
