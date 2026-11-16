'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Lock, RefreshCw, Settings, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import type { AccessDenied } from '@/utils/access-denied.utils';

/**
 * The one place a refusal is shown as a card.
 *
 * `FeatureUnavailable` in the dashboard layout already explains a denial that
 * happens on *navigation*. This covers the other half — a denial that arrives
 * while a page is loading or saving — so the member is never left staring at
 * "Something went wrong" or "Could not load birthdays right now" when the API
 * had already told us exactly what was wrong.
 *
 * The wording and the next step come from `describeAccessDenied`, so this
 * component never invents a reason; it only renders one.
 */

const ICONS: Record<AccessDenied['kind'], LucideIcon> = {
  subscription: Lock,
  upgrade: Lock,
  disabled: Settings,
  permission: ShieldAlert,
  unknown: RefreshCw,
};

/** Gold for anything entitlement-related, amber for an admin switch, red for a refusal. */
const TILES: Record<AccessDenied['kind'], string> = {
  subscription: 'bg-[#FDFAF3] text-[#B8962E]',
  upgrade: 'bg-[#FDFAF3] text-[#B8962E]',
  disabled: 'bg-amber-50 text-amber-600',
  permission: 'bg-red-50 text-red-600',
  unknown: 'bg-gray-100 text-gray-600',
};

interface AccessDeniedNoticeProps {
  denied: AccessDenied;
  /**
   * `panel` stands alone in place of the page (nothing else could load).
   * `banner` sits inside a page that still has something to show.
   */
  variant?: 'panel' | 'banner';
  /** Offered for `unknown`, where the honest answer is "try again". */
  onRetry?: () => void;
  className?: string;
}

export function AccessDeniedNotice({
  denied,
  variant = 'panel',
  onRetry,
  className,
}: AccessDeniedNoticeProps) {
  const Icon = ICONS[denied.kind];

  if (variant === 'banner') {
    return (
      <div
        className={clsx(
          'flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:p-6',
          className,
        )}
      >
        <span
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            TILES[denied.kind],
          )}
        >
          <Icon size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black tracking-tight text-gray-900">
            {denied.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {denied.message}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {denied.action && (
              <Link
                href={denied.action.href}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#B8962E]"
              >
                {denied.action.label}
                <ArrowRight size={13} />
              </Link>
            )}
            {denied.secondaryAction && (
              <Link
                href={denied.secondaryAction.href}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {denied.secondaryAction.label}
              </Link>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <RefreshCw size={13} />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div
        className={clsx(
          'w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10',
          className,
        )}
      >
        <span
          className={clsx(
            'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            TILES[denied.kind],
          )}
        >
          <Icon size={26} />
        </span>

        <h2 className="text-lg font-bold text-gray-900">{denied.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {denied.message}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {denied.action && (
            <Link
              href={denied.action.href}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B8962E]"
            >
              {denied.action.label}
              <ArrowRight size={14} />
            </Link>
          )}
          {denied.secondaryAction && (
            <Link
              href={denied.secondaryAction.href}
              className={clsx(
                'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
                denied.action
                  ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  : 'bg-[#C9A84C] text-white hover:bg-[#B8962E]',
              )}
            >
              {denied.secondaryAction.label}
            </Link>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
