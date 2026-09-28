'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PINSetupModal } from './shared/PINSetupModal';
import { pinService } from '@/services/pin.service';
import { useAlert } from '@/hooks/useAlert';

/**
 * PINSetupEnforcer Component
 * 
 * This component enforces PIN setup for users who don't have a PIN set.
 * It should be placed in the dashboard layout or root app layout.
 * 
 * If a user doesn't have a PIN:
 * 1. Show PIN setup modal (blocking)
 * 2. User must complete PIN setup before accessing the dashboard
 * 3. Update auth store PIN status after successful setup
 * 
 * Includes proper hydration guards to prevent server/client mismatches
 */
interface PINSetupEnforcerProps {
  showForNewUsers?: boolean; // Show PIN setup immediately for newly registered users
  children?: React.ReactNode; // Content to render (should be rendered always, with modal on top)
}

export function PINSetupEnforcer({ showForNewUsers = true, children }: PINSetupEnforcerProps) {
  const router = useRouter();
  const { user, pinStatus, setPinStatus, isHydrated } = useAuthStore();
  const { success, error: alertError } = useAlert();
  const [showPINModal, setShowPINModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only operates after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check PIN status on component mount
  useEffect(() => {
    if (!isMounted || !user || !isHydrated) return;

    // If PIN status not set in store, it means either:
    // 1. User just logged in (PIN status should be from login response)
    // 2. User is accessing app fresh (check current status)
    if (!pinStatus) {
      checkPinStatus();
    } else if (!pinStatus.has_pin && showForNewUsers) {
      // User doesn't have PIN, show setup modal
      setShowPINModal(true);
    }
  }, [user, isMounted, isHydrated]);

  // Check current PIN status from backend
  const checkPinStatus = async () => {
    /*
     * There is no PIN backend in this codebase — no /wallet/pin/* routes are
     * registered — and the previous implementation "checked" status by calling
     * verifyPin('0000') and sniffing the error code.
     *
     * That was two bugs at once: it 404'd on every authenticated page load,
     * and against any real implementation a deliberately wrong PIN counts as a
     * failed attempt, so repeat visits would lock the member out of their own
     * wallet.
     *
     * So: no probe. pinStatus is captured from the login response and
     * persisted, and when it is genuinely unknown we treat it as "set" so the
     * setup modal never opens onto a dead endpoint.
     */
    setPinStatus({ has_pin: true, is_locked: false });
  };

  // Handle PIN setup
  const handlePINSetupSubmit = async (data: {
    newPin: string;
    newPinConfirmation: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await pinService.setPin(
        data.newPin,
        data.newPinConfirmation,
        data.password
      );

      if (response?.success) {
        success('PIN set successfully!');

        // Update store with new PIN status
        setPinStatus({
          has_pin: true,
          is_locked: false,
          failed_attempts: 0,
        });

        setShowPINModal(false);
      } else {
        throw new Error(response?.message || 'Failed to set PIN');
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to set PIN. Please try again.';
      alertError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Always render children - the page content */}
      {children}
      
      {/* Show PIN setup modal on top if needed */}
      <PINSetupModal
        isOpen={showPINModal}
        mode="setup"
        onSubmit={handlePINSetupSubmit}
        onSuccess={() => {
          // PIN setup complete
          setShowPINModal(false);
        }}
        onClose={() => {
          // Users cannot close this modal until PIN is set
          // They must complete PIN setup or can be redirected
          // For now, we prevent closing by not handling it
        }}
        isLoading={isLoading}
      />
    </>
  );
}
