'use client';

import Link from 'next/link';
import { AlertCircle, Home, RotateCw } from 'lucide-react';
import { ErrorPageProvider } from '@/contexts/ErrorPageContext';

/**
 * Recovery links on a 404.
 *
 * Every one is a real, indexable public route. This matters beyond UX: a 404
 * that links nowhere wastes whatever authority the dead URL still held and
 * leaves a crawler with no reason to keep exploring the site.
 */
const RECOVERY_LINKS = [
  { href: '/catalogue', label: 'Business directory' },
  { href: '/vtu', label: 'VTU services' },
  { href: '/about', label: 'About us' },
  { href: '/support', label: 'Support' },
] as const;

function NotFoundContent() {
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
              <h1 className="text-[40px] font-bold tracking-tight text-gray-900 leading-none mb-2">
                404
              </h1>
              <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">
                Page not found
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                The page you are looking for does not exist or may have been moved.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-center">
              <p className="text-[13px] font-medium text-gray-600">
                This resource could not be found
              </p>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                try this instead
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <ul className="text-sm text-gray-600 space-y-2 mb-2">
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Go back to the home page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Check the URL for typos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A84C] font-bold">-</span>
                <span>Contact support for help</span>
              </li>
            </ul>

            <div className="flex gap-2.5 mt-6">
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-[11px] text-sm font-semibold text-white bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E] hover:shadow-md active:scale-[0.99] transition-all"
              >
                <Home size={14} />
                Go Home
              </Link>

              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-[11px] text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <RotateCw size={14} />
                Go Back
              </button>
            </div>
          </div>
        </div>

        {/*
          Internal links here are how a crawler that landed on a dead URL
          recovers — a 404 with no outbound links is a dead end for both a
          visitor and link equity. The previous version pointed at
          mailto:support@yourapp.com, an unconfigured placeholder address that
          bounced, and offered no route back into the site.
        */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-gray-300">
            or explore
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {RECOVERY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#C9A84C]/40 hover:text-[#B8962E]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <ErrorPageProvider isErrorPage={true}>
      <NotFoundContent />
    </ErrorPageProvider>
  );
}