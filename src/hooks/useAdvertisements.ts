'use client';

import { useState, useCallback, useEffect } from 'react';
import { advertisementService } from '@/services/advertisement.service';
import {
  Advertisement,
} from '@/types/api.types';
import { useAlert } from './useAlert';

interface UseAdvertisementsOptions {
  autoFetch?: boolean;
  platform?: 'mobile' | 'web' | 'all';
  limit?: number;
}

/**
 * Hook for client-side ad fetching
 */
export const useAdvertisements = (options: UseAdvertisementsOptions = {}) => {
  const { autoFetch = true, platform = 'all', limit = 10 } = options;
  const { showAlert } = useAlert();

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheExpiresAt, setCacheExpiresAt] = useState<string | null>(null);

  // Normalize backend ad data to match our Advertisement interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeAd = useCallback((ad: any): Advertisement => {
    return {
      id: ad.id || ad.adId || '',
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      icon: ad.icon || '',
      buttonText: ad.buttonText || ad.button_text || '',
      actionType: ad.actionType || ad.action_type || 'navigation',
      actionValue: ad.actionValue || ad.action_value || '',
      image: {
        url: ad.image?.url || ad.image_url || '',
        fallbackColor: ad.image?.fallbackColor || ad.fallback_color || '#FDFAF3',
      },
      gradient: {
        start: ad.gradient?.start || ad.gradient_start || '#C9A84C',
        end: ad.gradient?.end || ad.gradient_end || '#B8962E',
      },
      displayDuration: ad.displayDuration || ad.display_duration || 5000,
      isActive: ad.isActive !== undefined ? ad.isActive : ad.is_active !== undefined ? ad.is_active : true,
      displayOrder: ad.displayOrder || ad.display_order || 0,
      analytics: {
        impressions: ad.analytics?.impressions || ad.analytics?.impression || 0,
        clicks: ad.analytics?.clicks || 0,
        ctr: ad.analytics?.ctr || 0,
      },
      validFrom: ad.validFrom || ad.valid_from || new Date().toISOString(),
      validUntil: ad.validUntil || ad.valid_until || new Date(Date.now() + 86400000).toISOString(),
      platform: ad.platform || 'all',
    };
  }, []);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await advertisementService.getAdvertisements({
        limit,
        active: true,
        platform: platform as 'mobile' | 'web' | 'all',
      });

      if (response.success && response.data) {
        const rawAds = Array.isArray(response.data) 
          ? response.data 
          : response.data.advertisements || [];
        
        // Normalize all ads to match our interface
        const normalizedAds = rawAds.map(ad => normalizeAd(ad));
        setAds(normalizedAds);
        
        // Handle pagination/meta structure
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const meta = (response.data as any).meta || {};
          setCached(meta.cached || false);
          setCacheExpiresAt(meta.cacheExpiresAt || null);
        }
      } else {
        setError(response.message || 'Failed to fetch advertisements');
        showAlert(response.message || 'Failed to fetch advertisements', 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showAlert(`Failed to fetch advertisements: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, platform, showAlert, normalizeAd]);

  const trackClick = useCallback(
    async (adId: number) => {
      try {
        await advertisementService.trackAdClick(adId);
      } catch (err) {
        console.error('Failed to track ad click:', err);
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAds();
    }
  }, [autoFetch, fetchAds]);

  return {
    ads,
    loading,
    error,
    cached,
    cacheExpiresAt,
    fetchAds,
    trackClick,
  };
};
