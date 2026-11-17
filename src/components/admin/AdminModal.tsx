'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
};

/**
 * AdminModal - A premium, distinct modal for the admin panel
 * Features glass-morphism backdrop, gold accent header, clean card layout
 */
export const AdminModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = 'md',
}: AdminModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop with glass effect */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-md" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-8"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-gray-700 dark:bg-gray-900',
                  sizeClasses[size]
                )}
              >
                {/* Gold accent top bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#C9A84C] via-[#D4B85A] to-[#B8962E]" />

                {/* Header */}
                <div className="relative border-b border-gray-100 px-6 pb-4 pt-6 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {Icon && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 dark:border-[#C9A84C]/30 dark:bg-[#C9A84C]/15">
                          <Icon className="h-5 w-5 text-[#C9A84C] dark:text-[#D4B85A]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Dialog.Title className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
                          {title}
                        </Dialog.Title>
                        {subtitle && (
                          <p className="mt-0.5 text-sm leading-tight text-gray-500 dark:text-gray-400">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 max-h-[65vh] overflow-y-auto
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  hover:[&::-webkit-scrollbar-thumb]:bg-gray-300
                  dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
                  dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600"
                >
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
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
