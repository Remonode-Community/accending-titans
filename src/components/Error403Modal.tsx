'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Lock, RefreshCw, Settings, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import {
  describeAccessDenied,
  type AccessDenied,
  type AccessDeniedKind,
} from '@/utils/access-denied.utils';

/**
 * Error403Modal Component
 *
 * Displays a modal when the API refuses a request with 403.
 *
 * It used to print one hardcoded sentence — "You do not have permission to
 * access this resource." — for every refusal, even though the payload
 * distinguishes four different reasons. It now reads the stored payload
 * through `describeAccessDenied`, so a member whose plan excludes the feature
 * is told that (and offered the plans page), someone whose role simply lacks
 * the permission is told that, and an administrator switching a feature off
 * reads as neither of those.
 */

const ICONS: Record<AccessDeniedKind, LucideIcon> = {
  subscription: Lock,
  upgrade: Lock,
  disabled: Settings,
  permission: ShieldAlert,
  unknown: RefreshCw,
};

const TILES: Record<AccessDeniedKind, string> = {
  subscription: 'bg-[#FDFAF3] text-[#B8962E]',
  upgrade: 'bg-[#FDFAF3] text-[#B8962E]',
  disabled: 'bg-amber-50 text-amber-600',
  permission: 'bg-red-50 text-red-600',
  unknown: 'bg-gray-100 text-gray-600',
};

interface Stored403 {
  message?: string;
  error_code?: string;
  feature?: string;
  required?: 'subscription' | 'upgrade';
  status?: number;
  endpoint?: string;
  timestamp?: string;
}

export function Error403Modal() {
  const router = useRouter();
  const [denied, setDenied] = useState<AccessDenied | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check for 403 error in sessionStorage
    const checkFor403Error = () => {
      try {
        const errorData = sessionStorage.getItem('error_403');
        if (errorData) {
          const parsed: Stored403 = JSON.parse(errorData);
          setDenied(describeAccessDenied(parsed));
          setIsOpen(true);
          // Clear the error after showing it once
          sessionStorage.removeItem('error_403');
        }
      } catch (err) {
        console.error('[Error403Modal] Failed to parse error:', err);
      }
    };

    // Check immediately and set up interval to check for new errors
    checkFor403Error();
    const interval = setInterval(checkFor403Error, 500);

    return () => clearInterval(interval);
  }, [isClient]);

  if (!isClient || !isOpen || !denied) {
    return null;
  }

  const Icon = ICONS[denied.kind];

  const close = () => setIsOpen(false);

  const handleGoBack = () => {
    close();
    router.back();
  };

  const handleGoHome = () => {
    close();
    router.push(denied.secondaryAction?.href ?? '/');
  };

  const handlePrimary = () => {
    if (!denied.action) return;
    close();
    router.push(denied.action.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="access-denied-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              TILES[denied.kind],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h2 id="access-denied-title" className="text-lg font-semibold text-gray-900">
            {denied.title}
          </h2>
        </div>

        {/* Message — the API's own reason, not a generic refusal. */}
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{denied.message}</p>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {denied.action ? (
            <button
              onClick={handlePrimary}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {denied.action.label}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleGoBack}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          )}
          <button
            onClick={handleGoHome}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {denied.secondaryAction?.label ?? 'Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
