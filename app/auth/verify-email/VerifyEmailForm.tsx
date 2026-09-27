'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Mail,
  MailCheck,
  RefreshCcw,
  ShieldCheck,
  Clock,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import {
  verifyEmailSchema,
  type VerifyEmailSchema,
} from '@/utils/validation.utils';

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';
  const [countdown, setCountdown] = useState(0);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { verifyEmail, resendEmailOTP, isLoading, emailVerificationCooldown } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: defaultEmail,
      otp: '',
    },
  });

  const email = watch('email');
  const otp = watch('otp');

  // Auto-send OTP when component mounts with email
  useEffect(() => {
    if (defaultEmail && !showOTPInput) {
      setShowOTPInput(true);
      // Trigger resend on mount (the backend sends OTP during registration, but we can trigger again if needed)
    }
  }, [defaultEmail]);

  // Handle cooldown countdown
  useEffect(() => {
    if (emailVerificationCooldown > 0) {
      setCountdown(emailVerificationCooldown);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [emailVerificationCooldown]);

  const onSubmit = async (data: VerifyEmailSchema) => {
    setHasError(false);
    const result = await verifyEmail(data);
    if (!result.success) {
      setHasError(true);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setHasError(true);
      return;
    }
    const result = await resendEmailOTP(email);
    if (result.success) {
      setCountdown(60);
    } else {
      setHasError(true);
    }
  };

  const handleOTPInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  return (
    <div className="relative min-h-screen bg-white flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-12 pb-[env(safe-area-inset-bottom)] overflow-hidden">

      {/* Subtle gold radial glow — barely there */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full bg-[#C9A84C]/[0.06] blur-3xl" />

      <div className="relative w-full max-w-[420px]">

        {/* ── Card — flat/edge-to-edge on mobile, card from sm+ ── */}
        <div className="sm:rounded-2xl sm:border sm:border-gray-100 sm:bg-white sm:shadow-[0_2px_32px_rgba(0,0,0,0.07)] sm:overflow-hidden">

          {/* Signature element: 3px gold gradient top bar (card only) */}
          <div className="hidden sm:block h-[3px] bg-gradient-to-r from-[#C9A84C]/35 via-[#C9A84C] to-[#C9A84C]/35" />

          <div className="px-5 sm:px-8 py-9 sm:py-8">
            <div className="mb-8 text-center">
              {/* Brand logo */}
              <Image
                src="/icon.png"
                alt="Acceding Titans Logo"
                width={64}
                height={64}
                className="mx-auto mb-4 h-14 w-14 rounded-full ring-1 ring-[#C9A84C]/25 shadow-sm sm:h-16 sm:w-16"
                priority
              />

              <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">
                Verify your email
              </h2>

              <p className="mt-1.5 text-sm text-gray-500">
                We've sent a 6-digit verification code to <span className="font-semibold text-gray-900">{email}</span>. Enter it below to verify your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email field - hidden if already provided */}
              {!defaultEmail && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Email address</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />

                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-gray-700">
                  <span>Verification Code</span>
                  <span className="text-xs font-normal text-gray-500">6 digits</span>
                </label>

                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    {...register('otp')}
                    onChange={handleOTPInput}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-center text-lg font-semibold tracking-[0.2em] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                  />
                </div>

                {errors.otp && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.otp.message}
                  </p>
                )}

                {hasError && !errors.otp && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Invalid or expired OTP. Please try again or request a new code.
                  </p>
                )}
              </div>

              {/* Verification Status Messages */}
              {otp.length === 6 && !hasError && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  <BadgeCheck size={14} />
                  Code ready to verify
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
                  isLoading || otp.length !== 6
                    ? 'bg-[#C9A84C]/55 cursor-not-allowed'
                    : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E]'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </span>
                ) : (
                  <>Verify Email</>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="mb-3 text-center text-sm text-gray-500">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
                className={`w-full rounded-xl py-3 sm:py-2.5 text-sm font-semibold transition-colors ${
                  countdown > 0 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-[#C9A84C] hover:text-[#B8962E]'
                }`}
              >
                {countdown > 0 ? (
                  <>
                    <Clock size={14} className="inline mr-1" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCcw size={14} className="inline mr-1" />
                    Resend verification code
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                Check your spam folder if you don't see the email
              </p>
            </div>

            {/* Already verified link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Already verified?{' '}
              <Link
                href="/auth/login"
                className="font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom security note */}
        <p className="mt-5 text-center text-xs text-gray-400">
          Secured with enterprise-grade encryption
        </p>

      </div>
    </div>
  );
}
         