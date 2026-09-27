'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { safeRedirectPath } from '@/hooks/useAuth';

/**
 * AuthProtectedRoute Component
 *
 * Protects auth pages from authenticated users.
 *
 * If the visitor was bounced here from a protected page (via `?next=`), they
 * are returned to it once they are allowed through, instead of being dumped on
 * the dashboard. The value is passed through `safeRedirectPath` so a crafted
 * link cannot turn this into an open redirect.
 *
 * `next` is read from `window.location` inside the effect rather than via
 * `useSearchParams()`, because this component renders outside the pages'
 * <Suspense> boundaries and would otherwise fail the static build.
 */
export function AuthProtectedRoute({ 
  children, 
  requireUnauthenticated = true,
  redirectTo = '/dashboard'
}: { 
  children: React.ReactNode; 
  requireUnauthenticated?: boolean; 
  redirectTo?: string; 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    let next = redirectTo;
    try {
      const param = new URLSearchParams(window.location.search).get('next');
      next = safeRedirectPath(param ?? undefined, redirectTo);
    } catch {
      next = redirectTo;
    }

    // If page requires unauthenticated user (auth pages) and user is authenticated
    if (requireUnauthenticated && isAuthenticated && user) {
      router.replace(next);
      return;
    }

    // Special case: /auth/verify-email should redirect if email is already verified
    if (pathname?.includes('/auth/verify-email') && isAuthenticated && user?.isEmailVerified) {
      router.replace(next);
      return;
    }
  }, [isAuthenticated, user, pathname, router, requireUnauthenticated, redirectTo]);

  // Always render children - loading states handled by button indicators
  return <>{children}</>;
}
