'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { portfolioService } from '@/services/portfolio.service';
import { useAlert } from './useAlert';
import type {
  AddPortfolioItemRequest,
  Portfolio,
  PortfolioItem,
  UpdatePortfolioItemRequest,
  UpsertPortfolioRequest,
} from '@/types/portfolio.types';

interface UseMyCatalogueResult {
  portfolio: Portfolio | null;
  items: PortfolioItem[];
  canManage: boolean;
  isLoading: boolean;
  isSavingProfile: boolean;
  savingItemId: number | null;
  deletingItemId: number | null;
  uploadingImage: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveProfile: (payload: UpsertPortfolioRequest) => Promise<boolean>;
  addItem: (payload: AddPortfolioItemRequest) => Promise<boolean>;
  updateItem: (id: number, payload: UpdatePortfolioItemRequest) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  toggleItemActive: (item: PortfolioItem) => Promise<boolean>;
  uploadImage: (file: File, folder: 'business' | 'items') => Promise<string>;
}

/**
 * Owns the signed-in member's catalogue state.
 *
 * The backend returns the whole portfolio (profile + items) in one payload, so
 * a single fetch drives the page. Mutations patch local state from the server
 * response rather than guessing, which keeps the UI honest.
 */
export function useMyCatalogue(): UseMyCatalogueResult {
  const { success, error: showError } = useAlert();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await portfolioService.getMy();

      if (res.success && res.data) {
        setPortfolio(res.data.portfolio);
        setCanManage(Boolean(res.data.can_manage));
      } else {
        setError(res.message || 'We could not load your catalogue.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not load your catalogue.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => portfolio?.items ?? [], [portfolio]);

  const saveProfile = useCallback(
    async (payload: UpsertPortfolioRequest) => {
      setIsSavingProfile(true);
      try {
        const res = await portfolioService.upsert(payload);

        if (res.success && res.data?.portfolio) {
          setPortfolio((prev) => ({
            ...res.data!.portfolio,
            // Keep the items we already have; the upsert response omits them.
            items: res.data!.portfolio.items ?? prev?.items ?? [],
          }));
          success('Business profile saved');
          return true;
        }

        showError(res.message || 'We could not save your business profile.');
        return false;
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Something went wrong.');
        return false;
      } finally {
        setIsSavingProfile(false);
      }
    },
    [showError, success],
  );

  const addItem = useCallback(
    async (payload: AddPortfolioItemRequest) => {
      try {
        const res = await portfolioService.addItem(payload);

        if (res.success && res.data?.item) {
          setPortfolio((prev) =>
            prev
              ? { ...prev, items: [...(prev.items ?? []), res.data!.item] }
              : prev,
          );
          success('Item added to your catalogue');
          return true;
        }

        showError(res.message || 'We could not add that item.');
        return false;
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Something went wrong.');
        return false;
      }
    },
    [showError, success],
  );

  const updateItem = useCallback(
    async (id: number, payload: UpdatePortfolioItemRequest) => {
      setSavingItemId(id);
      try {
        const res = await portfolioService.updateItem(id, payload);

        if (res.success && res.data?.item) {
          setPortfolio((prev) =>
            prev
              ? {
                  ...prev,
                  items: (prev.items ?? []).map((i) =>
                    i.id === id ? res.data!.item : i,
                  ),
                }
              : prev,
          );
          success('Item updated');
          return true;
        }

        showError(res.message || 'We could not update that item.');
        return false;
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Something went wrong.');
        return false;
      } finally {
        setSavingItemId(null);
      }
    },
    [showError, success],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      setDeletingItemId(id);
      try {
        const res = await portfolioService.deleteItem(id);

        if (res.success) {
          setPortfolio((prev) =>
            prev
              ? { ...prev, items: (prev.items ?? []).filter((i) => i.id !== id) }
              : prev,
          );
          success('Item removed');
          return true;
        }

        showError(res.message || 'We could not remove that item.');
        return false;
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Something went wrong.');
        return false;
      } finally {
        setDeletingItemId(null);
      }
    },
    [showError, success],
  );

  const toggleItemActive = useCallback(
    async (item: PortfolioItem) => {
      return updateItem(item.id, { is_active: !item.is_active });
    },
    [updateItem],
  );

  const uploadImage = useCallback(
    async (file: File, folder: 'business' | 'items') => {
      setUploadingImage(true);
      try {
        const res = await portfolioService.uploadImage(file, folder);

        if (res.success && res.data?.image?.url) {
          return res.data.image.url;
        }

        throw new Error(res.message || 'That image could not be uploaded.');
      } finally {
        setUploadingImage(false);
      }
    },
    [],
  );

  return {
    portfolio,
    items,
    canManage,
    isLoading,
    isSavingProfile,
    savingItemId,
    deletingItemId,
    uploadingImage,
    error,
    refresh: load,
    saveProfile,
    addItem,
    updateItem,
    deleteItem,
    toggleItemActive,
    uploadImage,
  };
}
