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
      const response = await fetch('/', {
        method: 'HEAD',
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white shadow-lg mb-6 border border-slate-100">
            {isOnline ? (
              <Wifi className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
            ) : (
              <WifiOff className="h-12 w-12 text-red-600 animate-pulse" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {isOnline ? 'Server Unavailable' : 'No Connection'}
          </h1>
          <p className="text-slate-600 text-lg">
            {isOnline
              ? 'We\'re temporarily unable to reach our servers'
              : 'Please check your internet connection'}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Connection Status</span>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-8">
          <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Quick Fixes
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>Check Wi-Fi or mobile connection</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>Toggle airplane mode off and on</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>Restart your router if using Wi-Fi</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>Wait a moment and try again</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
          >
            {retrying ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Retrying</span>
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4" />
                <span>Try Again</span>
              </>
            )}
          </button>

          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Still having trouble?{' '}
          {supportEmailHref ? (
            <a href={supportEmailHref} className="text-red-600 font-semibold hover:underline">
              Contact {contact.support_email}
            </a>
          ) : (
            <span className="text-red-600 font-semibold">Contact support</span>
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
