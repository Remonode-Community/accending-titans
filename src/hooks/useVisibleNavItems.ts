'use client';

import { useFeatureStore } from '@/store/feature.store';
import { getVisibleNavItems, type NavItemLike } from '@/utils/nav-visibility.utils';

/**
 * Feature-gated sidebar navigation.
 *
 * Central visibility gate for any screen that renders sidebar-style nav:
 * resolves the items against the current user's effective feature map and
 * returns only what this user can actually see. While the feature map is
 * still loading, feature-gated items are withheld so nothing flashes into
 * the sidebar before access is resolved.
 */
export const useVisibleNavItems = <T extends NavItemLike>(items: T[]): T[] => {
  const features = useFeatureStore((s) => s.features);
  const loaded = useFeatureStore((s) => s.loaded);

  return getVisibleNavItems(items, { features, loaded });
};
