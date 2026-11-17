'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { platformSettingsService } from '@/services/platform-settings.service';
import { useAuthStore } from '@/store/auth.store';

const AUTHENTICATION_ROUTES = new Set(['/auth/login', '/auth/forgot-password']);
const STATUS_REFRESH_INTERVAL = 15_000;

interface MaintenanceGateProps {
  children: React.ReactNode;
}

export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const pathname = usePathname();
  const { user, isHydrated } = useAuthStore();
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    let timeoutId: number | undefined;

    const checkMaintenanceStatus = async () => {
      try {
        const response = await platformSettingsService.getMaintenanceStatus();
        const enabled = response.data?.maintenance_mode;

        if (!response.success || typeof enabled !== 'boolean') {
          throw new Error(response.message || 'Invalid maintenance status response.');
        }

        if (active) {
          setMaintenanceMode(enabled);
          setStatusError(false);
        }
      } catch (error) {
        if (active) {
          console.error('[MaintenanceGate] Failed to check platform status:', error);
          setStatusError(true);
        }
      } finally {
        if (active) {
          timeoutId = window.setTimeout(() => {
            void checkMaintenanceStatus();
          }, STATUS_REFRESH_INTERVAL);
        }
      }
    };

    void checkMaintenanceStatus();

    return () => {
      active = false;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [retryCount]);

  if (pathname && AUTHENTICATION_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  const isAdmin = user?.roles?.includes('admin') ?? false;
  const isMaintenanceActive = maintenanceMode === true;

  if (!isMaintenanceActive || (isHydrated && isAdmin)) {
    return (
      <>
        {statusError && maintenanceMode === null && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-slate-800"
          >
            <span>Could not check platform status. The site is available; we’ll retry automatically.</span>
            <button
              type="button"
              onClick={() => {
                setStatusError(false);
                setRetryCount((count) => count + 1);
              }}
              className="font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-center text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A84C]/15 text-[#C9A84C]">
          <Settings className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">We’ll be back soon</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The platform is temporarily unavailable while we carry out maintenance. Admin accounts can still sign in and access the system.
        </p>
        <Link
          href="/auth/login"
          className="mt-7 inline-flex rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#d7b85f]"
        >
          Admin sign in
        </Link>
      </section>
    </main>
  );
}
