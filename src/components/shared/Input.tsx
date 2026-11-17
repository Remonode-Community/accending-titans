'use client';

import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block label mb-2 text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-600">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}

          <input
            className={clsx(
              'w-full px-4 py-3 rounded-lg border body-base text-gray-900 placeholder-gray-400 dark:border-[#302b20] dark:bg-[#24221c] dark:text-gray-100 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed transition-all dark:disabled:bg-[#1b1a16]',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              icon && 'pl-12',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>

        {error && <p className="body-sm mt-1 text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && <p className="body-sm mt-1 text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
