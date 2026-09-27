'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/api.types';

interface AdCarouselProps {
  platform?: 'mobile' | 'web' | 'all';
  limit?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onAdClick?: (ad: Advertisement) => void;
}

/**
 * Advertisement Carousel Component
 * Displays advertisements in a horizontal carousel with navigation
 */
export const AdCarousel: React.FC<AdCarouselProps> = ({
  platform = 'all',
  limit = 10,
  autoPlay = true,
  autoPlayInterval = 6000,
  onAdClick,
}) => {
  // All hooks must be called unconditionally at the top
  const { ads, loading, error, trackClick } = useAdvertisements({
    autoFetch: true,
    platform,
    limit,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? (ads?.length ?? 1) - 1 : prevIndex - 1));
    setIsAutoPlaying(false);
  }, [ads?.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === (ads?.length ?? 1) - 1 ? 0 : prevIndex + 1));
    setIsAutoPlaying(false);
  }, [ads?.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, []);

  // Auto-play effect - called unconditionally
  useEffect(() => {
    if (!isAutoPlaying || !ads || ads.length <= 1) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === ads.length - 1 ? 0 : prevIndex + 1));
    }, autoPlayInterval);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, ads, autoPlayInterval, currentIndex]);

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="w-full h-40 bg-gradient-to-r from-[#FDFAF3] to-[#C9A84C]/10 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading advertisements...</p>
      </div>
    );
  }

  if (error || !ads || ads.length === 0) {
    return null;
  }

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = currentIndex >= ads.length ? 0 : currentIndex;
  const currentAd = ads[safeCurrentIndex];

  const handleAdClick = async () => {
    await trackClick(currentAd.id);
    if (onAdClick) {
      onAdClick(currentAd);
    }
    handleActionClick(currentAd);
  };

  const handleActionClick = (ad: Advertisement) => {
    switch (ad.actionType) {
      case 'navigation':
        window.location.href = `/dashboard/${ad.actionValue}`;
        break;
      case 'deepLink':
        window.location.href = ad.actionValue;
        break;
      case 'externalUrl':
        window.open(ad.actionValue, '_blank');
        break;
      case 'customAction':
        console.log('Custom action:', ad.actionValue);
        break;
    }
  };

  return (
    <div className="w-full">
      {/* Main Carousel */}
      <div
        className="relative w-full rounded-lg overflow-hidden shadow-lg"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(autoPlay)}
      >
        {/* Ad Display */}
        <div
          className="relative w-full h-40 md:h-48 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentAd.gradient.start} 0%, ${currentAd.gradient.end} 100%)`,
          }}
          onClick={handleAdClick}
        >
          {/* Background Image with Fallback */}
          {currentAd.image.url ? (
            <img
              src={currentAd.image.url}
              alt={currentAd.title}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}

          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-4 md:px-6">
            {/* Text Content */}
            <div className="flex-1 text-white">
              <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">{currentAd.title}</h3>
              <p className="text-sm md:text-base opacity-90 mb-3">{currentAd.subtitle}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdClick();
                }}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white text-[#B8962E] font-semibold rounded-lg hover:bg-[#FDFAF3] transition-colors text-sm md:text-base"
              >
                {currentAd.buttonText}
                {currentAd.actionType === 'externalUrl' && <ExternalLink size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        {ads.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
              aria-label="Previous ad"
            >
              <ChevronLeft size={20} className="text-gray-800" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
              aria-label="Next ad"
            >
              <ChevronRight size={20} className="text-gray-800" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === safeCurrentIndex
                  ? 'w-8 bg-[#C9A84C]'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Info Text */}
      <div className="text-center text-xs text-gray-500 mt-2">
        {ads.length > 1 && `${safeCurrentIndex + 1} / ${ads.length}`}
      </div>
    </div>
  );
};

export default AdCarousel;
