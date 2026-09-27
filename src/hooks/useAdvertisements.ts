'use client';

import { useState, useCallback, useEffect } from 'react';
import { advertisementService } from '@/services/advertisement.service';
import {
  Advertisement,
  AdvertisementAdmin,
  AdvertisementResponse,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
} from '@/types/api.types';
import { useAlert } from './useAlert';

interface UseAdvertisementsOptions {
  autoFetch?: boolean;
  platform?: 'mobile' | 'web' | 'all';
  limit?: number;
}

interface UseAdvertisementsAdminOptions {
  page?: number;
  per_page?: number;
  sort_by?: 'display_order' | 'created_at' | 'impressions' | 'clicks' | 'title';
  sort_order?: 'asc' | 'desc';
  search?: string;
  platform?: 'mobile' | 'web' | 'all';
  status?: 'active' | 'inactive' | 'expired';
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

/**
 * Hook for admin ad management
 */
export const useAdvertisementsAdmin = (initialParams?: UseAdvertisementsAdminOptions) => {
  const { showAlert } = useAlert();

  const [ads, setAds] = useState<AdvertisementAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  });

  const [params, setParams] = useState<UseAdvertisementsAdminOptions>(
    initialParams || {
      page: 1,
      per_page: 15,
      sort_by: 'display_order',
      sort_order: 'asc',
    }
  );

  // Normalize backend ad data to match our AdvertisementAdmin interface
  const normalizeAdminAd = useCallback((ad: any): AdvertisementAdmin => {
    return {
      id: ad.id || ad.adId || 0,
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
      notes: ad.notes || '',
      created_at: ad.created_at || new Date().toISOString(),
      updated_at: ad.updated_at || new Date().toISOString(),
      created_by: ad.created_by || '',
    };
  }, []);

  const fetchAds = useCallback(async (customParams?: UseAdvertisementsAdminOptions) => {
    try {
      setLoading(true);
      setError(null);

      const fetchParams = customParams || params;
      const response = await advertisementService.listAdvertisements(fetchParams);

      if (response.success) {
        // Handle both response structures
        const rawAds = Array.isArray(response.data) ? response.data : response.data?.data || [];
        const normalizedAds = rawAds.map(ad => normalizeAdminAd(ad));
        
        const paginationData = (response as any).pagination || response.data?.pagination || {
          total: 0,
          per_page: 15,
          current_page: 1,
          last_page: 1,
          from: 0,
          to: 0,
        };
        
        setAds(normalizedAds);
        setPagination(paginationData);
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
  }, [params, showAlert, normalizeAdminAd]);

  const createAd = useCallback(
    async (data: CreateAdvertisementRequest) => {
      try {
        setLoading(true);
        const response = await advertisementService.createAdvertisement(data);

        if (response.success) {
          showAlert('Advertisement created successfully', 'success');
          await fetchAds();
          return response.data;
        } else {
          showAlert(response.message || 'Failed to create advertisement', 'error');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showAlert(`Failed to create advertisement: ${errorMessage}`, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAds, showAlert]
  );

  const updateAd = useCallback(
    async (id: number, data: UpdateAdvertisementRequest) => {
      try {
        setLoading(true);
        const response = await advertisementService.updateAdvertisement(id, data);

        if (response.success) {
          showAlert('Advertisement updated successfully', 'success');
          await fetchAds();
          return response.data;
        } else {
          showAlert(response.message || 'Failed to update advertisement', 'error');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showAlert(`Failed to update advertisement: ${errorMessage}`, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAds, showAlert]
  );

  const deleteAd = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        const response = await advertisementService.deleteAdvertisement(id);

        if (response.success) {
          showAlert('Advertisement deleted successfully', 'success');
          await fetchAds();
          return true;
        } else {
          showAlert(response.message || 'Failed to delete advertisement', 'error');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showAlert(`Failed to delete advertisement: ${errorMessage}`, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAds, showAlert]
  );

  const bulkReorder = useCallback(
    async (ads: Array<{ id: number; display_order: number }>) => {
      try {
        setLoading(true);
        const response = await advertisementService.bulkReorder({ ads });

        if (response.success) {
          showAlert('Display order updated successfully', 'success');
          await fetchAds();
          return true;
        } else {
          showAlert(response.message || 'Failed to update display order', 'error');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showAlert(`Failed to update display order: ${errorMessage}`, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAds, showAlert]
  );

  const bulkToggleStatus = useCallback(
    async (adIds: number[], isActive: boolean) => {
      try {
        setLoading(true);
        const response = await advertisementService.bulkToggleStatus({
          ad_ids: adIds,
          is_active: isActive,
        });

        if (response.success) {
          showAlert('Status updated successfully', 'success');
          await fetchAds();
          return true;
        } else {
          showAlert(response.message || 'Failed to update status', 'error');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showAlert(`Failed to update status: ${errorMessage}`, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAds, showAlert]
  );

  const updateParams = useCallback((newParams: Partial<UseAdvertisementsAdminOptions>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  useEffect(() => {
    fetchAds();
  }, [params]);

  return {
    ads,
    loading,
    error,
    pagination,
    params,
    updateParams,
    fetchAds,
    createAd,
    updateAd,
    deleteAd,
    bulkReorder,
    bulkToggleStatus,
  };
};
