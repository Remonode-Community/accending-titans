'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthProtected } from '@/components/AuthProtected';
import { useAlert } from '@/hooks/useAlert';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { authService } from '@/services/auth.service';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

function AuthBackground({ children }: { children: React.ReactNode }) {
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
            {children}
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

function ForgotPasswordPageContent() {
  const router = useRouter();
  const { success: showSuccess, error: showError, warning: showWarning } = useAlert();
  const { getPasswordStrength, requirements, isPasswordValid } = usePasswordValidation();

  const showAlert = useCallback(
    ({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) => {
      if (type === 'success') showSuccess(message);
      if (type === 'error') showError(message);
      if (type === 'warning') showWarning(message);
    },
    [showSuccess, showError, showWarning]
  );

  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(600);
  const [otpExpiredAlertShown, setOtpExpiredAlertShown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>({
    level: 'weak',
    score: 0,
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (currentStep !== 'otp') return;

    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (!otpExpiredAlertShown) {
      setOtpExpiredAlertShown(true);
      showAlert({
        type: 'error',
        message: 'OTP has expired. Please request a new one.',
      });
    }
  }, [currentStep, otpCountdown, otpExpiredAlertShown, showAlert]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      emailForm.clearErrors();

      const response = await authService.forgotPassword(data);

      if (response.success) {
        setEmail(data.email);
        setOtpCountdown(600);
        setOtpExpiredAlertShown(false);
        setCurrentStep('otp');
        setResendCountdown(60);

        showAlert({
          type: 'success',
          message: 'OTP sent successfully. Check your email.',
        });

        return;
      }

      showAlert({
        type: 'error',
        message: response.message || 'Failed to send OTP',
      });
    } catch (error: any) {
      if (error?.response?.status === 429) {
        setResendCountdown(60);

        showAlert({
          type: 'warning',
          message: 'Please wait 60 seconds before requesting again',
        });

        return;
      }

      showAlert({
        type: 'error',
        message: error?.response?.data?.message || 'An error occurred while sending OTP',
      });
    }
  };

  const handleOtpSubmit = async (data: OTPFormData) => {
    try {
      otpForm.clearErrors();

      const response = await authService.verifyPasswordResetOtp({
        email,
        otp: data.otp,
      });

      if (response.success && response.data?.reset_token) {
        setResetToken(response.data.reset_token);
        setCurrentStep('password');

        showAlert({
          type: 'success',
          message: 'OTP verified successfully',
        });

        return;
      }

      showAlert({
        type: 'error',
        message: response.message || 'OTP verification failed',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        message: error?.response?.data?.message || 'An error occurred while verifying OTP',
      });
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    try {
      const response = await authService.forgotPassword({ email });

      if (response.success) {
        setOtpCountdown(600);
        setOtpExpiredAlertShown(false);
        setResendCountdown(60);

        showAlert({
          type: 'success',
          message: 'OTP resent successfully',
        });
      }
    } catch {
      showAlert({
        type: 'error',
        message: 'Failed to resend OTP',
      });
    }
  };

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      setPasswordStrength(getPasswordStrength(value));
    },
    [getPasswordStrength]
  );

  const handlePasswordSubmit = async () => {
    try {
      setIsResettingPassword(true);

      if (!isPasswordValid()) {
        showAlert({
          type: 'error',
          message: 'Password does not meet all requirements',
        });
        setIsResettingPassword(false);
        return;
      }

      if (password !== confirmPassword) {
        showAlert({
          type: 'error',
          message: 'Passwords do not match',
        });
        setIsResettingPassword(false);
        return;
      }

      const response = await authService.resetPassword({
        email,
        reset_token: resetToken,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        setCurrentStep('success');

        showAlert({
          type: 'success',
          message: 'Password reset successfully',
        });

        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);

        return;
      }

      showAlert({
        type: 'error',
        message: response.message || 'Failed to reset password',
      });

      setIsResettingPassword(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'An error occurred while resetting password';

      if (error?.response?.status === 400 && errorMessage.includes('expired')) {
        setCurrentStep('email');

        showAlert({
          type: 'error',
          message: 'Session expired. Please start over.',
        });
      } else {
        showAlert({
          type: 'error',
          message: errorMessage,
        });
      }

      setIsResettingPassword(false);
    }
  };

  if (currentStep === 'success') {
    return (
      <AuthBackground>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20">
            <CheckCircle2 className="h-6 w-6 text-[#C9A84C]" />
          </div>

          <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">
            Password reset successful
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your password has been changed successfully. Please sign in again with your new password.
          </p>

          <Link href="/auth/login">
            <button className="mt-6 w-full rounded-xl bg-[#C9A84C] py-3 sm:py-[11px] text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E] transition-all">
              Continue to Login
            </button>
          </Link>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
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
          {currentStep === 'email' && 'Forgot password?'}
          {currentStep === 'otp' && 'Verify your email'}
          {currentStep === 'password' && 'Create new password'}
        </h2>

        <p className="mt-1.5 text-sm text-gray-500">
          {currentStep === 'email' &&
            "Enter your email address and we'll send you a password reset code."}
          {currentStep === 'otp' && 'Enter the 6-digit code sent to your email address.'}
          {currentStep === 'password' &&
            'Choose a strong password to secure your account.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex gap-2">
        {(['email', 'otp', 'password'] as const).map((step, index) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              ['email', 'otp', 'password'].indexOf(currentStep) >= index
                ? 'bg-[#C9A84C]'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {currentStep === 'email' && (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
              Email address
            </label>

            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
                {...emailForm.register('email')}
              />
            </div>

            {emailForm.formState.errors.email && (
              <p className="mt-1.5 text-xs text-red-500">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
              emailForm.formState.isSubmitting
                ? 'bg-[#C9A84C]/55 cursor-not-allowed'
                : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E]'
            }`}
          >
            {emailForm.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </span>
            ) : (
              'Send Reset Code'
            )}
          </button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        </form>
      )}

      {currentStep === 'otp' && (
        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              Code sent to <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="otp" className="text-[13px] font-medium text-gray-700">
                Verification Code
              </label>

              <span className="text-xs font-medium text-gray-500">
                Expires in {formatCountdown(otpCountdown)}
              </span>
            </div>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              disabled={otpCountdown === 0}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-lg font-semibold tracking-[0.2em] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              {...otpForm.register('otp')}
            />

            {otpForm.formState.errors.otp && (
              <p className="mt-1.5 text-xs text-red-500">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={otpForm.formState.isSubmitting || otpCountdown === 0}
            className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
              otpForm.formState.isSubmitting || otpCountdown === 0
                ? 'bg-[#C9A84C]/55 cursor-not-allowed'
                : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E]'
            }`}
          >
            {otpForm.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </span>
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center">
            <p className="mb-2 text-xs text-gray-500">Didn&apos;t receive the code?</p>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
              className="text-sm font-semibold text-[#C9A84C] disabled:cursor-not-allowed disabled:text-gray-400 hover:text-[#B8962E] transition-colors"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStep('email');
              emailForm.reset();
            }}
            className="w-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Use a different email
          </button>
        </form>
      )}

      {currentStep === 'password' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handlePasswordSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-gray-700">
              New Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {password && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                  Password Strength
                </span>
                <span className={`text-xs font-semibold ${
                  passwordStrength?.level === 'weak'
                    ? 'text-red-500'
                    : passwordStrength?.level === 'medium'
                      ? 'text-amber-500'
                      : 'text-green-500'
                }`}>
                  {passwordStrength?.level?.charAt(0).toUpperCase() +
                    passwordStrength?.level?.slice(1)}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor:
                      passwordStrength.level === 'weak'
                        ? '#ef4444'
                        : passwordStrength.level === 'medium'
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                />
              </div>

              <div className="mt-3 space-y-2">
                {[
                  { label: 'At least 8 characters', key: 'minLength' },
                  { label: 'Contains uppercase letter', key: 'hasUppercase' },
                  { label: 'Contains lowercase letter', key: 'hasLowercase' },
                  { label: 'Contains number', key: 'hasNumber' },
                  { label: 'Contains symbol', key: 'hasSymbol' },
                ].map(({ label, key }) => {
                  const passed = requirements[key as keyof typeof requirements];

                  return (
                    <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                          passed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                        {passed && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password_confirmation" className="mb-1.5 block text-[13px] font-medium text-gray-700">
              Confirm Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />

              <input
                id="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12 transition-colors"
              />
            </div>

            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1.5 text-xs text-amber-600">
                Passwords don&apos;t match
              </p>
            )}

            {confirmPassword && password === confirmPassword && (
              <p className="mt-1.5 text-xs text-green-600">
                Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isResettingPassword || !isPasswordValid() || password !== confirmPassword}
            className={`mt-1 w-full rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white transition-all ${
              isResettingPassword || !isPasswordValid() || password !== confirmPassword
                ? 'bg-[#C9A84C]/55 cursor-not-allowed'
                : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E]'
            }`}
          >
            {isResettingPassword ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep('email');
              emailForm.reset();
            }}
            className="w-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Start over
          </button>
        </form>
      )}
    </AuthBackground>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthProtected requireAuth={false}>
      <ForgotPasswordPageContent />
    </AuthProtected>
  );
}