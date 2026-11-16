'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { safeGetItem } from '@/utils/safe-storage.utils';
import { authService } from '@/services/auth.service';
import { canUseRole, getPrimaryRole } from '@/utils/role.utils';
import { useInitialization } from '@/contexts/InitializationContext';
import { FEATURES } from '@/config/features';
import { useFeatureStore } from '@/store/feature.store';
import { useBirthdayPreferencesComplete } from '@/hooks/useBirthdayPreferencesComplete';
import { getFeatureKeyForHref, isLandingPath, resolveDefaultLandingPage, shouldForwardToLanding } from '@/utils/nav-visibility.utils';

/**
 * AuthInitializer Component
 * 
 * CENTRALIZED AUTHENTICATION & ROUTING LOGIC
 * 
 * Responsibilities:
 * 1. Wait for Zustand persistence middleware hydration
 * 2. Refresh user data from API for fresh verification flags
 * 3. Determine correct destination based on:
 *    - Authentication status
 *    - Email verification status
 *    - Phone verification status
 *    - User role (admin > agent > customer)
 * 4. Handle all redirects at app level to prevent race conditions
 * 5. Ensure consistent routing flow
 * 
 * Redirect Priority:
 *   1. Not authenticated → /auth/login
 *   2. Email not verified → /auth/verify-email
 *   3. Phone not verified → /auth/verify-phone
 *   4. Admin role → /admin
 *   5. Agent role → /agent
 *   6. Customer/user → /dashboard
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading, user, setUser, isHydrated, activeRole } = useAuthStore();
  const { markInitializationComplete } = useInitialization();
  const [isMounted, setIsMounted] = useState(false);
  const [routingResolved, setRoutingResolved] = useState(false);
  const hasInitialized = useRef(false);

  // Member-dashboard landing page configuration (admin-set, per-member resolved).
  const defaultLandingPage = useFeatureStore((s) => s.defaultLandingPage);
  const features = useFeatureStore((s) => s.features);
  const catalogue = useFeatureStore((s) => s.catalogue);
  const plan = useFeatureStore((s) => s.plan);
  const loaded = useFeatureStore((s) => s.loaded);
  const birthdayPreferencesComplete = useBirthdayPreferencesComplete();

  // Ensure component only initializes on client after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        let token: string | null = null;
        
        try {
          token = typeof window !== 'undefined' ? safeGetItem('token') : null;
        } catch (storageError: any) {
          console.error('[AuthInitializer] Storage error while getting token:', storageError);
          token = null;
        }

        if (token && user) {
          // Token exists and user is loaded from persistence
          // Refresh user data from API to get fresh verification flags
          try {
            if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
              console.log('[AuthInitializer] Refreshing user data to get fresh verification flags');
            }
            const response = await authService.getUser();
            
            if (response.success && response.data?.user) {
              if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
                console.log('[AuthInitializer] User data refreshed:', {
                  email: response.data.user.email,
                  isEmailVerified: response.data.user.isEmailVerified,
                  isPhoneVerified: response.data.user.isPhoneVerified,
                });
              }
              // Update store with fresh user data
              setUser(response.data.user);
            } else {
              console.warn('[AuthInitializer] Failed to refresh user data:', response.message);
            }
          } catch (error: any) {
            // Check if it's a network error vs API error
            const isNetworkError = 
              error?.message?.includes('network') ||
              error?.message?.includes('Network') ||
              error?.code === 'ERR_NETWORK' ||
              error?.response?.status === 0 ||
              (error?.response?.status >= 500 && error?.response?.status < 600) ||
              error instanceof TypeError; // Network errors throw TypeError in fetch
            
            if (isNetworkError) {
              console.error('[AuthInitializer] Network error refreshing user data:', error);
              // Don't redirect - let the error page handle it
              throw new Error('Connection failed. Please check your internet connection and try again.');
            } else {
              console.error('[AuthInitializer] Error refreshing user data:', error);
              // Don't fail initialization if non-network errors occur
            }
          }
        } else if (!token) {
          // No token - user is not authenticated
          if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
            console.log('[AuthInitializer] No token found, user is not authenticated');
          }
        }
      } catch (error: any) {
        console.error('[AuthInitializer] Auth initialization error:', error);
        // Detect and handle connection/network errors
        const isNetworkError = 
          error?.message?.includes('network') ||
          error?.message?.includes('Network') ||
          error?.message?.includes('Connection') ||
          error?.code === 'ERR_NETWORK' ||
          error?.response?.status === 0 ||
          (error?.response?.status >= 500 && error?.response?.status < 600) ||
          error instanceof TypeError;
        
        if (isNetworkError) {
          console.error('[AuthInitializer] Network error detected, redirecting to offline page');
          router.push('/offline');
          return;
        }
      } finally {
        setIsLoading(false);
        setRoutingResolved(true);
        // Signal to other components (like PhoneVerificationEnforcer) that initialization is complete
        // and fresh verification flags are available
        markInitializationComplete();
      }
    };

    initializeAuth();
  }, [isMounted]);

  // Routing logic: Determine correct destination and redirect if needed
  useEffect(() => {
    if (!isMounted || !isHydrated || !routingResolved || !pathname) return;

    // Don't redirect from auth or public routes
    const publicAndAuthRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/verify-email',
      '/auth/verify-phone',
      '/auth',
      '/',
      '/about',
      '/faq',
      '/privacy',
      '/terms',
      '/support',
      '/multi-currency',
      '/offline',
      '/error',
      // Public business directory + member showcase pages. These are
      // deliberately outside /dashboard, so without listing them here the
      // role-based redirect below (correctDestination = '/dashboard') would
      // bounce every member off their own public page and the public directory.
      // Note '/dashboard/catalogue' (the editor) is NOT matched here — it does
      // not start with '/catalogue'.
      '/catalogue',
    ];

    const isPublicRoute = publicAndAuthRoutes.some(route => {
      if (route === '/') return pathname === '/';
      return pathname?.startsWith(route);
    });

    if (isPublicRoute) {
      // On public routes, no routing logic needed
      return;
    }

    // Determine correct destination based on auth state
    let correctDestination: string | null = null;

    // Verification state is read from `user` — the SAME source every other
    // guard (AuthProtectedRoute, dashboard/admin/agent layouts,
    // EmailVerificationEnforcer, ProtectedPageWrapper) uses. Routing on the
    // store's separate `isEmailVerified` flag here used to disagree with them
    // whenever the API refresh hadn't (or failed to) land, and the two guards
    // bounced the member between /dashboard and /auth/verify-email forever.

    // Priority 1: Not authenticated
    if (!user) {
      correctDestination = '/auth/login';
    }
    // Priority 2: Email not verified
    else if (!user.isEmailVerified) {
      correctDestination = `/auth/verify-email?email=${encodeURIComponent(user.email)}`;
    }
    // Priority 3: Phone not verified (if feature is enabled)
    else if (!user.isPhoneVerified && FEATURES.PHONE_VERIFICATION_ENABLED) {
      correctDestination = `/auth/verify-phone?phone=${encodeURIComponent(user.phone_number || '')}`;
    }
    // Priority 4-6: Role-based routing
    // IMPORTANT: Use activeRole for routing (respects user's role selection)
    // but validate it against user.roles for security
    else {
      // Determine the role to use for routing
      let roleToRoute: string | null = null;

      // Use activeRole if it's set and valid. `canUseRole` also accepts the
      // synthetic 'user' view for admins (which is not a real role on their
      // account); validating against `user.roles.includes(activeRole)` alone
      // rejected it and routed the admin back to /admin, so switching to the
      // user view appeared to do nothing.
      if (activeRole !== null && activeRole !== undefined && canUseRole(user.roles, activeRole)) {
        roleToRoute = activeRole;
      } else {
        // Fallback to primary role if activeRole is invalid/not set
        roleToRoute = getPrimaryRole(user.roles);
      }

      // Member-dashboard destination resolution. The ungated hub (`/dashboard`)
      // forwards to the admin-configured landing page, resolved against the
      // user's entitlements (falling back to the hub when unentitled). Deeper
      // module routes are honoured as-is: refusing a member their route is the
      // dashboard layout's job, because it is the only place that can say *why*
      // (their plan, or an administrator's switch) instead of silently putting
      // them back on the hub. Billing (`/dashboard/subscriptions`) is ungated,
      // so renewal stays reachable.
      const memberDashboardPath = pathname || '';
      const isMemberDashboardPath =
        memberDashboardPath === '/dashboard' || memberDashboardPath.startsWith('/dashboard/');

      let memberDestination: string | null;
      if (memberDashboardPath === '/dashboard') {
        const landing = resolveDefaultLandingPage({
          defaultPage: defaultLandingPage,
          features,
          catalogue,
          plan,
        });
        // Forward to the admin-configured landing only while the member still
        // owes the module's onboarding (the compulsory birthday plan form).
        // Once the form is complete, the restriction is lifted and the member
        // simply stays on the hub.
        memberDestination = shouldForwardToLanding({
          landing,
          birthdayPreferencesComplete,
        })
          ? landing
          : '/dashboard';
      } else if (isMemberDashboardPath) {
        // A plan-gated module route can only be judged once the feature map
        // has resolved. `isHrefVisible` answers "not visible" while the map is
        // still loading, so deciding on timing alone used to bounce entitled
        // members back to the hub — which is why clicking a setup shortcut
        // could appear to "do nothing". `loaded` is in this effect's
        // dependencies, so leaving the destination undecided re-runs it the
        // moment the map lands.
        if (getFeatureKeyForHref(memberDashboardPath) !== null && !loaded) {
          memberDestination = null;
        } else {
          // Stay on the route either way. An entitled member gets the page; a
          // member who is not entitled gets the dashboard layout's refusal
          // card in its place, which names the actual reason — their plan does
          // not include the feature, or an administrator switched it off — and
          // offers "View plans". Redirecting to the hub here is exactly what
          // made a refusal silent: the member was simply back on the dashboard
          // with no message about why the page they asked for had vanished.
          memberDestination = memberDashboardPath;
        }
      } else {
        memberDestination = '/dashboard';
      }

      // Route based on the determined role
      if (roleToRoute === 'admin') {
        // Admins may still open member-dashboard module routes (the backend
        // lets them bypass plan entitlements for support/inspection), but the
        // default-landing resolution still decides the final target and falls
        // back when the admin has no subscription/entitlement for it. Admin
        // surface routes (`/admin/...`) keep their own destination.
        correctDestination = isMemberDashboardPath ? memberDestination : '/admin';
      } else if (roleToRoute === 'agent') {
        correctDestination = '/agent';
      } else {
        // Member dashboard: land on the administrator-configured default
        // landing page, resolved against this member's entitlements.
        correctDestination = memberDestination;
      }
    }

    // Redirect if not on the correct path
    if (correctDestination) {
      const targetPath = (correctDestination || '/dashboard').split('?')[0];
      const currentPath = (pathname || '').split('?')[0];

      // `isLandingPath` treats the ungated hub (`/dashboard`) as matching only
      // itself, so an unentitled member who deep-links to a configured landing
      // module is redirected back to the resolved (fallback) landing page
      // instead of being treated as already being there.
      if (!isLandingPath(currentPath, targetPath)) {
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
          console.log('[AuthInitializer] Routing:', {
            from: pathname,
            to: correctDestination,
            reason: !user ? 'not_authenticated' : !user.isEmailVerified ? 'email_not_verified' : !user.isPhoneVerified ? 'phone_not_verified' : 'role_based',
          });
        }
        router.replace(correctDestination);
      }
    }
  }, [isMounted, isHydrated, routingResolved, pathname, user, activeRole, router, defaultLandingPage, features, catalogue, plan, loaded, birthdayPreferencesComplete]);

  // Render children - routing happens via effects above
  return <>{children}</>;
};
