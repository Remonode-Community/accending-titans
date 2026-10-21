import { create } from 'zustand';
import { platformSettingsService } from '@/services/platform-settings.service';
import type { FeatureKey } from '@/types/platform-settings.types';

/**
 * Member-facing feature switches.
 *
 * Anything not present is treated as enabled, so a failed fetch (or a newly
 * added feature the API has not returned yet) never hides navigation. The
 * server is still the gate: `feature:` middleware refuses the API even if the
 * client shows the link.
 */
interface FeatureState {
  features: Record<string, boolean>;
  loaded: boolean;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
  setFeatures: (features: Record<string, boolean>) => void;
  isEnabled: (key: FeatureKey) => boolean;
  reset: () => void;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: {},
  loaded: false,
  loading: false,

  load: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;

    set({ loading: true });

    try {
      const res = await platformSettingsService.getFeatures();
      if (res.success && res.data?.features) {
        set({ features: res.data.features, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      // Keep whatever we have; defaults are "enabled".
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setFeatures: (features) => set({ features, loaded: true }),

  isEnabled: (key) => get().features[key] ?? true,

  reset: () => set({ features: {}, loaded: false, loading: false }),
}));
