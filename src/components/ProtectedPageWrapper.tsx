'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useInitialization } from '@/contexts/InitializationContext';
import { Loader2 } from 'lucide-react';
import { FEATURES } from '@/config/features';

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requireEmail?: boolean;
  requirePhone?: boolean;
}

/**
 * ProtectedPageWrapper Component
 *
 * Wraps page content to ensure proper verification before rendering.
 *
 * CRITICAL: enforcement must wait for auth initialization to finish.
 * Verification is read from `user.isEmailVerified` / `user.isPhoneVerified` —
 * the same source every other guard uses — because the store's separate
 * `isEmailVerified` / `isPhoneVerified` flags are deliberately NOT persisted
 * (they go stale the moment an address changes) and sat at `false` until
 * AuthInitializer refreshed the user from the API. Reading a different source
 * than the other guards is what produced the endless
 * /dashboard ⇄ /auth/verify-email redirect loop.
 *
 * So we still gate on `isHydrated` and `isInitializationComplete`, exactly
 * like EmailVerificationEnforcer does, so a stale persisted value is corrected
 * by the API refresh before we act on it.
 *
 * Usage:
 * ```tsx
 * <ProtectedPageWrapper requireEmail requirePhone>
 *   <YourPageContent />
 * </ProtectedPageWrapper>
 * ```
 *
 * Props:
 * - requireEmail: If true, redirects to verify-email if not verified
 * - requirePhone: If true, redirects to verify-phone if not verified (default: true)
 */
export function ProtectedPageWrapper({
  children,
  requireEmail = true,
  requirePhone = true,
}: ProtectedPageWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { isInitializationComplete } = useInitialization();

  const [isClient, setIsClient] = useState(false);
  const [hasCheckedVerification, setHasCheckedVerification] = useState(false);

  // Single source of truth: the persisted `user`, shared with every other guard.
  const emailVerified = user?.isEmailVerified === true;
  const phoneVerified = user?.isPhoneVerified === true;

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check verification and redirect if needed
  useEffect(() => {
    if (!isClient) return;

    // Wait for the persisted store to rehydrate, then for AuthInitializer to
    // refresh the verification flags from the API. Enforcing before either has
    // happened treats every member as unverified.
    if (!isHydrated || !isInitializationComplete) return;

    // Wait for auth state to load
    if (!isAuthenticated || !user) return;

    // Check email verification if required
    if (requireEmail && !emailVerified) {
      console.warn(
        '[ProtectedPageWrapper] Unverified email detected on',
        pathname,
        '- Redirecting to verify-email'
      );
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}&next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check phone verification if required and feature is enabled
    if (requirePhone && !phoneVerified && FEATURES.PHONE_VERIFICATION_ENABLED) {
      console.warn(
        '[ProtectedPageWrapper] Unverified phone detected on',
        pathname,
        '- Redirecting to verify-phone'
      );
      router.replace(`/auth/verify-phone?phone=${encodeURIComponent(user.phone_number)}&next=${encodeURIComponent(pathname)}`);
      return;
    }

    // All verifications passed
    setHasCheckedVerification(true);
  }, [
    isClient,
    isHydrated,
    isInitializationComplete,
    isAuthenticated,
    user,
    emailVerified,
    phoneVerified,
    requireEmail,
    requirePhone,
    pathname,
    router,
  ]);

  // Show loading state while checking or redirecting
  if (!isClient || !hasCheckedVerification) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Verifying your account</h3>
          <p className="text-sm text-gray-600 mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  // Verification passed - render children
  return <>{children}</>;
}
