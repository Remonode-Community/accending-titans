'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureStore } from '@/store/feature.store';
import type { SubscriptionPlan } from '@/types/subscription.types';

interface PaystackCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  paystackPublicKey?: string;
}

type CheckoutStep = 'confirm' | 'processing' | 'paystack' | 'verifying' | 'success' | 'error';

/**
 * PaystackCheckoutModal
 *
 * Uses the Paystack Inline Popup (PaystackPop) so the user never leaves the page.
 * Flow: confirm → processing (initialize) → Paystack popup (user pays) →
 *       verifying (verify-and-create) → success | error
 *
 * The PaystackPop script is loaded globally via next/script in app/layout.tsx
 * from https://js.paystack.co/v1/inline.js
 */
export function PaystackCheckoutModal({
  isOpen,
  onClose,
  plan,
  paystackPublicKey,
}: PaystackCheckoutModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    initializePayment,
    verifyAndCreate,
    actionLoading,
    error,
  } = useSubscription();
  const catalogue = useFeatureStore((state) => state.catalogue);
  const [step, setStep] = useState<CheckoutStep>('confirm');
  const [initData, setInitData] = useState<{ reference: string; authorization_url: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setInitData(null);
      setErrorMessage(null);
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown for success auto-redirect
  useEffect(() => {
    if (step === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (step === 'success' && countdown === 0) {
      onClose();
      setTimeout(() => router.push('/dashboard/subscriptions'), 100);
    }
  }, [step, countdown, router, onClose]);

  // ── Handle "Continue to Payment" ────────────────────────────────────
  const handleProceedToPayment = useCallback(async () => {
    if (!plan || !user) return;

    setStep('processing');
    setErrorMessage(null);

    // Determine payment method before the async call
    const publicKey =
      paystackPublicKey ||
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
      '';
    const hasPaystackPop = !!(window as any).PaystackPop;

    // Open a window/tab BEFORE the await so the browser recognises the user gesture
    // and doesn't block it as a popup
    let paystackWindow: Window | null = null;
    if (!publicKey || !hasPaystackPop) {
      // Fallback path: open blank window now, navigate after we get the URL
      paystackWindow = window.open('', '_blank');
    }

    // 1. Initialize payment — get reference & authorization_url from backend
    const result = await initializePayment(plan.id);
    if (!result) {
      if (paystackWindow && !paystackWindow.closed) paystackWindow.close();
      setStep('error');
      setErrorMessage(
        error || 'Failed to initialize payment. Please try again.',
      );
      return;
    }

    // 2. Use Paystack Inline Popup if available
    if (publicKey && hasPaystackPop) {
      const paystackHandler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: plan.price * 100,
        currency: (plan.currency || 'NGN').toUpperCase(),
        ref: result.reference,
        onClose: () => {
          setStep('error');
          setErrorMessage(
            'Payment was cancelled. You can try again whenever you\'re ready.',
          );
        },
        callback: async (response: any) => {
          setStep('verifying');
          const success = await verifyAndCreate(
            response.reference || result.reference,
            plan.id,
          );
          if (success) {
            setStep('success');
            setCountdown(5);
          } else {
            setStep('error');
            setErrorMessage(
              'Payment verification failed. Please contact support.',
            );
          }
        },
      });
      paystackHandler.openIframe();
      return;
    }

    // 3. Fallback: navigate the pre-opened window to Paystack checkout
    if (paystackWindow && !paystackWindow.closed) {
      paystackWindow.location.href = result.authorization_url;
    }

    setInitData(result);
    setStep('paystack');
  }, [plan, user, initializePayment, verifyAndCreate, error, paystackPublicKey]);

  // Handle "I've completed payment" — only used in fallback (no PaystackPop)
  const handlePaymentComplete = useCallback(async () => {
    if (!initData || !plan) return;

    setStep('verifying');
    setErrorMessage(null);

    const success = await verifyAndCreate(initData.reference, plan.id);
    if (success) {
      setStep('success');
      setCountdown(5);
    } else {
      setStep('error');
      setErrorMessage(
        error || 'Payment verification failed. Please contact support.',
      );
    }
  }, [initData, plan, verifyAndCreate, error]);

  // Handle payment cancelled — only used in fallback
  const handlePaymentCancelled = useCallback(() => {
    setStep('error');
    setErrorMessage(
      'Payment was cancelled. You can try again whenever you\'re ready.',
    );
  }, []);

  // Retry from error
  const handleRetry = useCallback(() => {
    setStep('confirm');
    setErrorMessage(null);
    setInitData(null);
  }, []);

  if (!plan) return null;

  const CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  const currencyCode = (plan.currency || 'NGN').toUpperCase();
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? `${currencyCode} `;
  const formatPrice = (price: number | null | undefined) =>
    `${currencySymbol}${(price ?? 0).toLocaleString()}`;

  /**
   * Safely parse plan.features into the list of registry keys it includes.
   */
  const getFeatureKeys = (): string[] => {
    const normalize = (value: unknown): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.filter((f): f is string => typeof f === 'string');
      if (typeof value === 'string') {
        const current: string = value;
        for (let i = 0; i < 3; i++) {
          const trimmed = current.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith('"')) {
            try {
              const parsed = JSON.parse(current);
              return normalize(parsed);
            } catch {
              break;
            }
          } else {
            break;
          }
        }
        return value.trim() ? [value.trim()] : [];
      }
      return [];
    };
    return normalize(plan?.features);
  };

  const featureKeys = getFeatureKeys();
  const featureLabels = featureKeys.map(
    (key) =>
      catalogue.find((entry) => entry.key === key)?.label ??
      key
        .split(/[_-]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={step === 'success' ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <Dialog.Title className="text-lg font-bold text-gray-900">
                    {step === 'success'
                      ? 'Subscription Active!'
                      : step === 'error'
                      ? 'Payment Error'
                      : 'Complete Subscription'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    disabled={actionLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                  {/* ── STEP: Confirm ── */}
                  {step === 'confirm' && (
                    <div className="space-y-6">
                      {/* Plan summary */}
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200/60 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Selected Plan
                          </span>
                          <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            {plan.slug}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {plan.name}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-[#C9A84C]">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {plan.duration_days}-day subscription
                          </span>
                        </div>
                      </div>

                      {/* Features preview */}
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          What you get
                        </p>
                        {featureLabels.slice(0, 4).map((label, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={15}
                              className="text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm text-gray-700">
                              {label}
                            </span>
                          </div>
                        ))}
                        {featureLabels.length > 4 && (
                          <p className="text-xs text-gray-400 pl-6">
                            +{featureLabels.length - 4} more features
                          </p>
                        )}
                      </div>

                      {/* Security note */}
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Lock
                          size={15}
                          className="text-gray-400 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-gray-500">
                          Secure payment powered by Paystack. Your card details
                          are encrypted and never stored on our servers.
                        </p>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={handleProceedToPayment}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#B8962E] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#C9A84C]/25 transition-all inline-flex items-center justify-center gap-2"
                      >
                        Continue to Payment
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* ── STEP: Processing ── */}
                  {step === 'processing' && (
                    <div className="py-10 text-center space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-[#C9A84C] mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Initializing Payment...
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Please wait while we set up your payment
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── STEP: Paystack (fallback — no PaystackPop available) ── */}
                  {step === 'paystack' && initData && (
                    <div className="space-y-6">
                      <div className="py-6 text-center space-y-3">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mx-auto">
                          <CreditCard className="w-7 h-7 text-[#C9A84C]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Complete Payment
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            A Paystack checkout page has been opened in a new
                            tab. Complete the payment there, then click the
                            button below.
                          </p>
                        </div>
                      </div>

                      {/* Transaction details */}
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Plan</span>
                          <span className="font-medium text-gray-900">
                            {plan.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Reference</span>
                          <span className="font-mono text-xs text-gray-600">
                            {initData.reference.slice(0, 16)}...
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={handlePaymentComplete}
                          disabled={actionLoading}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#B8962E] text-white text-sm font-bold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              I&apos;ve Completed Payment
                              <CheckCircle2 size={16} />
                            </>
                          )}
                        </button>

                        <button
                          onClick={handlePaymentCancelled}
                          disabled={actionLoading}
                          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
                        >
                          I Changed My Mind
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP: Verifying ── */}
                  {step === 'verifying' && (
                    <div className="py-10 text-center space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-[#C9A84C] mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Verifying Payment...
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Please wait while we verify your transaction and
                          activate your subscription
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── STEP: Success ── */}
                  {step === 'success' && (
                    <div className="py-6 text-center space-y-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Subscription Active!
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                          Your {plan.name} has been activated successfully.
                          Welcome to the community!
                        </p>
                      </div>

                      {/* Plan summary */}
                      <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Plan</span>
                          <span className="font-semibold text-gray-900">
                            {plan.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Amount</span>
                          <span className="font-semibold text-[#C9A84C]">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">
                        Redirecting to your plan in {countdown}s...
                      </p>

                      <button
                        onClick={() => {
                          onClose();
                          // Small delay to let the modal close before navigating
                          setTimeout(() => router.push('/dashboard/subscriptions'), 100);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#B8962E] text-white text-sm font-bold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
                      >
                        View my subscription
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* ── STEP: Error ── */}
                  {step === 'error' && (
                    <div className="py-6 text-center space-y-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Something Went Wrong
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {errorMessage || 'An unexpected error occurred'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all"
                        >
                          Try Again
                        </button>
                        <button
                          onClick={onClose}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                        >
                          Close
                        </button>
                      </div>

                      <p className="text-xs text-gray-400">
                        Need help?{' '}
                        <a
                          href="/support"
                          className="text-[#C9A84C] hover:underline font-medium"
                        >
                          Contact Support
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
