'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Phone,
  CheckCircle,
  RefreshCcw,
  ShieldCheck,
  Clock,
} from 'lucide-react';

import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { useAuthStore } from '@/store/auth.store';

export function VerifyPhoneForm() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const authenticatedPhoneNumber = user?.phone_number || '';
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    phoneNumber,
    setPhoneNumber,
    verificationMethod,
    setVerificationMethod,
    otp,
    setOtp,
    step,
    isLoading,
    error,
    fieldErrors,
    expiresIn,
    maskedPhoneNumber,
    isPhoneVerified,
    sendCooldown,
    sendOTP,
    verifyOTP,
    resetToPhoneInput,
    formatTimeRemaining,
  } = usePhoneVerification();

  // Auto-populate phone from authenticated user on mount
  useEffect(() => {
    if (authenticatedPhoneNumber && !phoneNumber) {
      setPhoneNumber(authenticatedPhoneNumber);
    }
  }, [authenticatedPhoneNumber, phoneNumber, setPhoneNumber]);

  // Handle countdown
  useEffect(() => {
    if (expiresIn > 0) {
      setCountdown(expiresIn);
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
  }, [expiresIn]);

  const handleOTPKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyOTP();
    }
  };

  const handleOTPInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
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
            {/* Phone Input Step */}
            {step === 'phone-input' && (
              <>
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
                  <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">Verify your phone</h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    We'll send a verification code to your phone to verify your account.
                  </p>
                </div>

                <form className="space-y-4">
                  {/* Error Message */}
                  {(hasError || error) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">{error || 'An error occurred'}</p>
                    </div>
                  )}

                  {/* Phone Number Input - Read Only (Account Phone) */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Your Account Phone Number</label>
                    <p className="mb-2 text-xs text-gray-500">
                      This is your registered phone number and cannot be changed here.
                    </p>
                    <div className="relative">
                      <Phone
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        type="tel"
                        placeholder={authenticatedPhoneNumber || '+234 810 230 0935'}
                        value={phoneNumber}
                        onChange={() => {}} // Prevent any changes
                        onKeyPress={(e) => e.preventDefault()} // Prevent typing
                        onCut={(e) => e.preventDefault()} // Prevent cut
                        onCopy={(e) => e.preventDefault()} // Prevent copy
                        onPaste={(e) => e.preventDefault()} // Prevent paste
                        onDrag={(e) => e.preventDefault()} // Prevent drag
                        onDrop={(e) => e.preventDefault()} // Prevent drop
                        disabled
                        readOnly
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 cursor-not-allowed opacity-70"
                      />
                    </div>
                    {fieldErrors.phone_number && (
                      <p className="mt-1.5 text-xs text-red-500">{fieldErrors.phone_number[0]}</p>
                    )}
                  </div>

                  {/* Verification Method Selection */}
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-gray-700">Receive code via</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['whatsapp', 'sms'] as const).map((channel) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setVerificationMethod(channel)}
                          disabled={isLoading}
                          className={`rounded-xl py-2.5 px-3 text-sm font-semibold transition-all disabled:opacity-60 relative ${
                            verificationMethod === channel
                              ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/25'
                              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                          </div>
                          {channel === 'whatsapp' && (
                            <span className="text-xs text-gray-600 block">(Recommended)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send Code Button */}
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={isLoading || !phoneNumber.trim() || sendCooldown > 0}
                    className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
                      isLoading || !phoneNumber.trim() || sendCooldown > 0
                        ? 'bg-[#C9A84C]/55 cursor-not-allowed'
                        : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E]'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </span>
                    ) : sendCooldown > 0 ? (
                      <>
                        <Clock size={14} className="inline mr-1" />
                        Resend in {sendCooldown}s
                      </>
                    ) : (
                      <>Send Verification Code</>
                    )}
                  </button>
                </form>

                {/* Support link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                  Having trouble?{' '}
                  <Link
                    href="/support"
                    className="font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
                  >
                    Contact support
                  </Link>
                </p>
              </>
            )}

            {/* OTP Input Step */}
            {step === 'otp-input' && (
              <>
                <div className="mb-8 text-center">
                  {/* Brand logo */}
                  <Image
                    src="/icon.png"
                    alt="Acceding Titans Logo"
                    width={64}
                    height={64}
                    className="mx-auto mb-4 h-14 w-14 rounded-full ring-1 ring-[#C9A84C]/25 shadow-sm sm:h-16 sm:w-16"
                  />
                  <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">Enter verification code</h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    We sent a 6-digit code to <span className="font-semibold text-gray-900">{maskedPhoneNumber}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Code expires in {formatTimeRemaining()}</p>
                </div>

                <form className="space-y-4">
                  {/* Error Message */}
                  {(hasError || error) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">{error || 'Invalid or expired OTP. Please try again.'}</p>
                    </div>
                  )}

                  {/* Expiry Warning */}
                  {countdown === 0 && expiresIn === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-700">Code expired. Please request a new one.</p>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-gray-700">
                      <span>Verification Code</span>
                      <span className="text-xs font-normal text-gray-500">5-6 digits</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        type="text"
                        onChange={handleOTPInput}
                        onKeyPress={handleOTPKeyPress}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        disabled={countdown === 0 && expiresIn === 0}
                        value={otp}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-center text-lg font-semibold tracking-[0.2em] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors disabled:opacity-60"
                      />
                    </div>
                    {fieldErrors.otp && (
                      <p className="mt-1.5 text-xs text-red-500">{fieldErrors.otp[0]}</p>
                    )}
                  </div>

                  {/* Verification Status */}
                  {otp.length >= 5 && !hasError && !error && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                      <BadgeCheck size={14} />
                      Code ready to verify
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="button"
                    onClick={verifyOTP}
                    disabled={isLoading || otp.length < 5 || (countdown === 0 && expiresIn === 0)}
                    className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
                      isLoading || otp.length < 5 || (countdown === 0 && expiresIn === 0)
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
                      <>Verify Code</>
                    )}
                  </button>
                </form>

                {/* Resend Section */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={resetToPhoneInput}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-gray-200 py-3 sm:py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw size={14} className="inline mr-2" />
                    Use different method
                  </button>

                  <p className="mt-3 text-center text-xs text-gray-400">
                    Check your spam folder if you don't see the SMS
                  </p>
                </div>
              </>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                    <CheckCircle className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">Verified!</h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Your phone number has been successfully verified.
                  </p>
                </div>

                <div className="rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4">
                  <p className="text-sm text-gray-900">
                    <BadgeCheck size={14} className="inline mr-2 text-[#C9A84C]" />
                    <span className="font-semibold">{maskedPhoneNumber}</span> is verified
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <RefreshCcw size={14} className="inline-block animate-spin" />
                  <span>Redirecting you to your dashboard...</span>
                </div>
              </>
            )}
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
