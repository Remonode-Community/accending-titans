'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Home, RotateCw } from 'lucide-react';
import { ErrorPageProvider } from '@/contexts/ErrorPageContext';
import { useSiteContact } from '@/contexts/SiteContactContext';
import { mailtoHref } from '@/utils/contact.utils';

/**
 * Offline Error Page
 * 
 * Shown when there's no internet connection or API is unreachable
 * Wrapped in ErrorPageProvider so verification enforcers skip it
 */
function OfflineContent() {
  const router = useRouter();
  const contact = useSiteContact();
  const supportEmailHref = mailtoHref(contact.support_email);
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    
    // Wait a moment then try to refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Try to reach the API to verify connection
      const response = await fetch('/api/health-check', {
        method: 'GET',
        cache: 'no-store',
      }).then(r => {
        setRetrying(false);
        if (r.ok) {
          // Connection restored - reload the page
          window.location.reload();
          return;
        }
        setRetrying(false);
      }).catch(() => {
        setRetrying(false);
      });
    } catch (error) {
      setRetrying(false);
      console.error('Retry failed:', error);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-white border-2 border-red-200 shadow-lg">
              {isOnline ? (
                <Wifi className="h-10 w-10 text-green-600" />
              ) : (
                <WifiOff className="h-10 w-10 text-red-600 animate-bounce" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isOnline ? 'Server Unavailable' : 'No Internet Connection'}
          </h1>
          
          <p className="text-gray-600 text-sm mb-2">
            {isOnline
              ? 'We temporarily cannot reach our servers. Please try again in a moment.'
              : 'Please check your internet connection and try again.'}
          </p>

          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Status:</strong> {isOnline ? '✓ Online' : '✗ Offline'}
            </p>
          </div>
        </div>

        {/* Error Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">💡 Troubleshooting:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Check your Wi-Fi or mobile connection</li>
            <li>• Try disabling and re-enabling airplane mode</li>
            <li>• Restart your router if on Wi-Fi</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#c9a84c] text-white rounded-lg font-semibold hover:bg-[#b91521] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
          >
            {retrying ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4" />
                Try Again
              </>
            )}
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 mt-6">
          If the problem persists, please{' '}
          {supportEmailHref ? (
            <a href={supportEmailHref} className="text-[#c9a84c] font-semibold hover:underline">
              contact {contact.support_email}
            </a>
          ) : (
            <span className="text-[#c9a84c] font-semibold">contact support</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function OfflinePage() {
  return (
    <ErrorPageProvider isErrorPage={true}>
      <OfflineContent />
    </ErrorPageProvider>
  );
}
