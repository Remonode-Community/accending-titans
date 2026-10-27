import { create } from 'zustand';
import { platformSettingsService } from '@/services/platform-settings.service';
import type {
  FeatureCatalogueEntry,
  FeatureKey,
  FeatureMapResponse,
  FeatureUnavailableReason,
  MemberPlanEntitlement,
} from '@/types/platform-settings.types';

/**
 * Member-facing feature entitlements.
 *
 * The server returns the *effective* map: a key is true only when an
 * administrator left the feature on and the member's active plan includes it.
 * Anything not present is treated as enabled, so a failed fetch (or a newly
 * added feature the API has not returned yet) never hides navigation. The
 * server is still the gate: `feature:` middleware refuses the API even if the
 * client shows the link.
 */
interface FeatureState {
  features: Record<string, boolean>;
  /** Why each false key is false, so the UI can offer the right next step. */
  unavailable: Record<string, FeatureUnavailableReason>;
  /** The member's active plan entitlement, or null before the first load. */
  plan: MemberPlanEntitlement | null;
  /** Labels and grouping for every plan-gated feature key. */
  catalogue: FeatureCatalogueEntry[];
  loaded: boolean;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
  apply: (payload: FeatureMapResponse) => void;
  setFeatures: (features: Record<string, boolean>) => void;
  isEnabled: (key: FeatureKey) => boolean;
  /** Look up a catalogue entry by key. */
  featureMeta: (key: FeatureKey) => FeatureCatalogueEntry | undefined;
  reset: () => void;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: {},
  unavailable: {},
  plan: null,
  catalogue: [],
  loaded: false,
  loading: false,

  load: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;

    set({ loading: true });

    try {
      const res = await platformSettingsService.getFeatures();
      if (res.success && res.data?.features) {
        get().apply(res.data);
        set({ loaded: true });
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

  apply: (payload) =>
    set({
      features: payload.features ?? {},
      unavailable: payload.unavailable ?? {},
      plan: payload.plan ?? null,
      catalogue: payload.catalogue ?? [],
    }),

  setFeatures: (features) => set({ features, loaded: true }),

  isEnabled: (key) => get().features[key] ?? true,

  featureMeta: (key) => get().catalogue.find((entry) => entry.key === key),

  reset: () =>
    set({
      features: {},
      unavailable: {},
      plan: null,
      catalogue: [],
      loaded: false,
      loading: false,
    }),
}));
