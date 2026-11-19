'use client';

import React, { useEffect } from 'react';
import { Toast } from '@/components/shared/Toast';
import { AuthInitializer } from '@/components/AuthInitializer';
import { MaintenanceGate } from '@/components/MaintenanceGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmailVerificationEnforcer } from '@/components/EmailVerificationEnforcer';
import { PhoneVerificationEnforcer } from '@/components/PhoneVerificationEnforcer';
import { PINSetupEnforcer } from '@/components/PINSetupEnforcer';
import { Error403Modal } from '@/components/Error403Modal';
import { AnalyticsInitializer } from '@/components/AnalyticsInitializer';
import { InitializationProvider } from '@/contexts/InitializationContext';
import { SiteContactProvider } from '@/contexts/SiteContactContext';
import { debug, initializeDebugLogging } from '@/utils/debug.utils';
import { initializeErrorTracking } from '@/utils/error-tracking.utils';
import { initializeIdempotencyMaintenance } from '@/utils/idempotency-maintenance.utils';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Initialize comprehensive error tracking
    initializeErrorTracking();
    debug.log('[Providers] Error tracking initialized');
    
    // Initialize debug logging & security measures (DevTools detection, error capture)
    initializeDebugLogging();
    debug.log('[Providers] Debug & security measures initialized');

    // Initialize idempotency maintenance (cleanup expired keys, periodic tasks)
    initializeIdempotencyMaintenance();
    debug.log('[Providers] Idempotency maintenance initialized');
  }, []);

  return (
    <ErrorBoundary>
      <SiteContactProvider>
        <InitializationProvider>
          <AuthInitializer>
            <MaintenanceGate>
              <AnalyticsInitializer />
              <EmailVerificationEnforcer>
                <PhoneVerificationEnforcer>
                  <PINSetupEnforcer>
                    <>
                      {children}
                      <Toast />
                      <Error403Modal />
                    </>
                  </PINSetupEnforcer>
                </PhoneVerificationEnforcer>
              </EmailVerificationEnforcer>
            </MaintenanceGate>
          </AuthInitializer>
        </InitializationProvider>
      </SiteContactProvider>
    </ErrorBoundary>
  );
};
