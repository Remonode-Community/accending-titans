/**
 * Sidebar navigation visibility rules.
 *
 * Single source of truth for "should this sidebar item render for the
 * current user?" — consumed by the member dashboard sidebar (and anything
 * else that renders feature-gated navigation).
 *
 * Rules:
 * - An item without a `feature` key is always visible (e.g. the core
 *   Dashboard and the Support desk, which are deliberately not feature-gated).
 * - An item with a `feature` key is visible only while the feature map has
 *   been resolved AND the effective value is not `false`. A missing key is
 *   treated as enabled (the server default).
 * - Until the feature map has loaded/resolved, feature-gated items are
 *   treated as *not visible* — never render an unauthorized item, and never
 *   flash one while the access state is still being resolved.
 */

import type { FeatureCatalogueEntry, FeatureKey } from '@/types/platform-settings.types';

/** A sidebar navigation entry. `feature` gates the entry; omit for always-on. */
export interface NavItemLike {
  href: string;
  feature?: FeatureKey;
}

export interface NavVisibilityContext {
  /** The effective feature map (true/false per key). */
  features: Record<string, boolean>;
  /** Whether the feature map has been resolved for this session/user. */
  loaded: boolean;
}

export const isNavItemVisible = (
  item: NavItemLike,
  ctx: NavVisibilityContext
): boolean => {
  // Always-on entries (no gating feature) render immediately.
  if (!item.feature) return true;

  // Gated entry whose access state has not resolved yet → stay hidden.
  // This closes the "flash of unauthorized items while loading/hydrating" gap.
  if (!ctx.loaded) return false;

  // Enabled by default when the key is absent from the map.
  return ctx.features[item.feature] !== false;
};

export const getVisibleNavItems = <T extends NavItemLike>(
  items: T[],
  ctx: NavVisibilityContext
): T[] => {
  if (!ctx.loaded) {
    // Do not surface feature-gated items before access is known.
    return items.filter((item) => !item.feature);
  }

  return items.filter((item) => isNavItemVisible(item, ctx));
};

/**
 * Resolve the effective default landing page for the authenticated member
 * dashboard.
 *
 * Preference order:
 *  1. The administrator-configured default landing page.
 *  2. The ungated dashboard hub (`/dashboard`).
 *
 * The configured page is only honoured when it maps onto a known feature that
 * is enabled for this user in the effective feature map (the map already folds
 * the global switch and the subscription plan into `false`).
 */
export const resolveDefaultLandingPage = (params: {
  defaultPage?: string | null;
  features: Record<string, boolean>;
  catalogue?: FeatureCatalogueEntry[];
}): string => {
  const landing = params.defaultPage || '/dashboard';

  if (landing === '/dashboard') {
    return '/dashboard';
  }

  const entry = params.catalogue?.find((catalogueEntry) => catalogueEntry.path === landing);
  const key = entry?.key;

  if (!key || params.features[key] === false) {
    return '/dashboard';
  }

  return landing;
};
