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

import type {
  FeatureCatalogueEntry,
  FeatureKey,
  MemberPlanEntitlement,
} from '@/types/platform-settings.types';

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
  /** Plan catalogue metadata (key → label/group/path), used to know which
   *  features are plan-gated. */
  catalogue?: FeatureCatalogueEntry[];
  /** The user's plan entitlement, used to gate plan-gated entries. */
  plan?: MemberPlanEntitlement | null;
}

const isFeatureAllowed = (key: FeatureKey, ctx: NavVisibilityContext): boolean => {
  if (!ctx.loaded) return false;

  const meta = ctx.catalogue?.find((entry) => entry.key === key);
  if (ctx.features[key] === false) return false;

  if (meta?.plan_gated && !ctx.plan?.features?.includes(key)) {
    // Plan-gated and the user's plan does not include it.
    return false;
  }

  return true;
};

export const isNavItemVisible = (
  item: NavItemLike,
  ctx: NavVisibilityContext
): boolean => {
  // Always-on entries (no gating feature) render immediately.
  if (!item.feature) return true;

  return isFeatureAllowed(item.feature, ctx);
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

/** Map of plan-gated dashboard module hrefs to the feature key that gates them. */
const MODULE_HREF_TO_FEATURE: Record<string, FeatureKey> = {
  '/dashboard/catalogue': 'catalogue',
  '/dashboard/subscriptions': 'subscriptions',
  '/dashboard/wallet': 'wallet',
  '/dashboard/birthdays': 'birthdays',
  '/dashboard/network': 'network',
  '/dashboard/content': 'content',
  '/dashboard/rankings': 'rankings',
  '/dashboard/referral': 'referrals',
  '/dashboard/messages': 'messages',
  '/dashboard/opportunities': 'opportunities',
};

/**
 * The feature key gating a dashboard module href, or null when the href is not
 * a known plan-gated module (the ungated hub `/dashboard`, Support, and unknown
 * routes fall through to the always-on bucket).
 */
export const getFeatureKeyForHref = (href: string): FeatureKey | null => {
  const clean = (href || '').split('?')[0];
  const base = Object.keys(MODULE_HREF_TO_FEATURE).find(
    (moduleHref) => clean === moduleHref || clean.startsWith(`${moduleHref}/`)
  );

  return base ? MODULE_HREF_TO_FEATURE[base] : null;
};

/**
 * Whether a dashboard module href is allowed for the current user context.
 * Unmapped routes (Support, the ungated hub) are always allowed.
 */
export const isHrefVisible = (href: string, ctx: NavVisibilityContext): boolean => {
  const featureKey = getFeatureKeyForHref(href);

  if (!featureKey) return true;

  return isFeatureAllowed(featureKey, ctx);
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
 * the global switch and the subscription plan into `false`) and, for plan-gated
 * features, when the user's plan actually includes it.
 */
export const resolveDefaultLandingPage = (params: {
  defaultPage?: string | null;
  features: Record<string, boolean>;
  catalogue?: FeatureCatalogueEntry[];
  plan?: MemberPlanEntitlement | null;
}): string => {
  const landing = params.defaultPage || '/dashboard';

  if (landing === '/dashboard') {
    return '/dashboard';
  }

  const entry = params.catalogue?.find((catalogueEntry) => catalogueEntry.path === landing);
  const key = entry?.key;

  if (!key || params.features[key] === false) {
    // Not enabled globally or not included in the member's plan.
    return '/dashboard';
  }

  // Plan-gated: only honour the configured landing when the user actually has
  // the feature in their plan. The effective feature map folds the plan in for
  // regular members, but an administrator bypasses it server-side — without an
  // explicit plan check an administrator without a subscription would still be
  // sent to the configured landing.
  if (entry?.plan_gated) {
    const included = params.plan?.features?.includes(key);
    if (!included) {
      return '/dashboard';
    }
  }

  return landing;
};

/**
 * Whether a member-dashboard path *is* the resolved landing page (or a child
 * of it).
 *
 * The ungated hub (`/dashboard`) matches only itself — module routes such as
 * `/dashboard/birthdays` are its children, not the hub itself. Treating the
 * hub as a prefix of everything would make an unentitled member deep-linked to
 * a configured landing page look like they were already at the landing page;
 * the resolver has already folded entitlement into the landing value, so the
 * hub must only ever match itself.
 */
export const isLandingPath = (path: string, landing: string): boolean => {
  const normalizedLanding = landing || '/dashboard';
  const normalizedPath = (path || '').split('?')[0];

  if (normalizedPath === normalizedLanding) {
    return true;
  }

  if (normalizedLanding === '/dashboard') {
    // The ungated hub matches only itself.
    return false;
  }

  return normalizedPath.startsWith(`${normalizedLanding}/`);
};
