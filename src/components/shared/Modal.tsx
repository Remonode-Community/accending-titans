'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeButton?: boolean;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * Shared modal.
 *
 * Mobile: a bottom sheet that respects the home indicator. From `sm` up it
 * centres as a dialog. The body scrolls independently so long forms stay
 * usable on small screens.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: ModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
                  'pb-[env(safe-area-inset-bottom)] sm:pb-0',
                  sizeClasses[size],
                )}
              >
                {/* Signature gold accent, consistent with the rest of the app */}
                <div className="h-1 bg-gradient-to-r from-[#C9A84C] via-[#D4B85A] to-[#B8962E]" />

                {/* Grab handle on mobile */}
                <div className="flex justify-center pt-2 sm:hidden">
                  <div className="h-1 w-10 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    {Icon && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/10">
                        <Icon className="h-5 w-5 text-[#C9A84C]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Dialog.Title className="text-base font-bold leading-tight text-gray-900">
                        {title}
                      </Dialog.Title>
                      {subtitle && (
                        <p className="mt-0.5 text-sm leading-tight text-gray-500">{subtitle}</p>
                      )}
                    </div>
                  </div>

                  {closeButton && (
                    <button
                      onClick={onClose}
                      className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Close dialog"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Body — scrolls independently so long forms never trap the footer */}
                <div
                  className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
                >
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
