'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, RotateCw } from 'lucide-react';
import { ErrorPageProvider } from '@/contexts/ErrorPageContext';
import { useSiteContact } from '@/contexts/SiteContactContext';
import { mailtoHref } from '@/utils/contact.utils';

function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const contact = useSiteContact();
  const supportEmailHref = mailtoHref(contact.support_email);

  useEffect(() => {
    const isConnectionError =
      error?.message?.includes('Connection failed') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('Network') ||
      error?.message?.includes('Failed to fetch');

    if (isConnectionError) {
      router.push('/offline');
    }
  }, [error, router]);

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full bg-[#C9A84C]/[0.06] blur-3xl" />

      <div className="relative w-full max-w-[420px]">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_32px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#C9A84C]/35 via-[#C9A84C] to-[#C9A84C]/35" />

          <div className="px-8 py-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-[#C9A84C]" />
              </div>
            </div>

            <div className="mb-7 text-center">
              <h1 className="text-[21px] font-semibold tracking-tight text-gray-900">
                Something went wrong
              </h1>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                We encountered an unexpected error while processing your request. Our team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Error details
                </p>
                <p className="text-xs font-mono text-gray-600 break-all mb-2">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Digest:</span> {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                what you can try
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <ul className="text-sm text-gray-600 space-y-2 mb-2">
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Refresh the page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Clear your browser cache</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Try again in a few moments</span>
              </li>
            </ul>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => reset()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-[11px] text-sm font-semibold text-white bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E] hover:shadow-md active:scale-[0.99] transition-all"
              >
                <RotateCw size={14} />
                Try again
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-[11px] text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <Home size={14} />
                Home
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Experiencing persistent issues?{' '}
          {supportEmailHref ? (
            <a
              href={supportEmailHref}
              className="font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
            >
              Contact {contact.support_email}
            </a>
          ) : (
            <span className="font-semibold text-[#C9A84C]">Contact support</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPageProvider isErrorPage={true}>
      <ErrorContent error={error} reset={reset} />
    </ErrorPageProvider>
  );
}