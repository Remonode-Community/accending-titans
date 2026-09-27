'use client';

import type { ElementType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** `card` sits inside an existing card; `panel` is the card itself. */
  variant?: 'panel' | 'card';
  className?: string;
  children?: ReactNode;
}

/**
 * Consistent empty / zero-result state.
 *
 * Every list surface in the app uses this so "nothing here yet" always looks
 * the same, and so a filtered-to-nothing list can offer a way back.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'panel',
  className,
  children,
}: EmptyStateProps) => {
  return (
    <div
      className={clsx(
        'px-6 py-16 text-center',
        variant === 'panel' &&
          'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#FDFAF3]">
        <Icon className="h-6 w-6 text-[#C9A84C]" />
      </div>

      <h3 className="text-base font-bold text-gray-900">{title}</h3>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] sm:w-auto"
            >
              {action.icon && <action.icon size={14} />}
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
