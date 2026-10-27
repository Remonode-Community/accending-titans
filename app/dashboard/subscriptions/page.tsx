'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Star,
  Loader2,
  ArrowRight,
  Crown,
  Clock,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Ban,
  Calendar,
  History,
  ShieldCheck,
  Layers,
  Lock,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { useAlert } from '@/hooks/useAlert';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureStore } from '@/store/feature.store';
import { PaystackCheckoutModal } from '@/components/subscription/PaystackCheckoutModal';
import type { SubscriptionPlan, ActiveSubscription } from '@/types/subscription.types';
import type { FeatureCatalogueEntry } from '@/types/platform-settings.types';

// ── Utility helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

function formatPrice(
  price: number | null | undefined,
  currency?: string | null
): string {
  const code = (currency || 'NGN').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `;
  return `${symbol}${(price ?? 0).toLocaleString()}`;
}

const INTERVAL_LABELS: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  quarterly: 'quarter',
  biannually: '6 months',
  yearly: 'year',
};

function intervalUnit(interval?: string | null): string {
  return (interval && INTERVAL_LABELS[interval]) || 'month';
}

function intervalSuffix(
  interval?: string | null,
  durationDays?: number | null
): string {
  if (interval && INTERVAL_LABELS[interval]) {
    return `/${INTERVAL_LABELS[interval]}`;
  }
  if (durationDays) {
    return `/${durationDays} days`;
  }
  return '';
}

function formatInterval(interval?: string | null): string {
  if (!interval) return 'Monthly';
  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

function humanizeFeature(key: string): string {
  return key
    .split(/[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function catalogueEntry(
  catalogue: FeatureCatalogueEntry[],
  key: string
): FeatureCatalogueEntry | undefined {
  return catalogue.find((entry) => entry.key === key);
}

function PlanGlyph({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  switch (slug) {
    case 'premium':
      return <Crown className={className} />;
    case 'standard':
      return <Sparkles className={className} />;
    default:
      return <Star className={className} />;
  }
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

// ── Included features ──────────────────────────────────────────────────────

function IncludedFeatures({
  features,
  catalogue,
  showDescriptions = false,
  variant = 'light',
  emptyHint,
}: {
  features: string[];
  catalogue: FeatureCatalogueEntry[];
  showDescriptions?: boolean;
  variant?: 'light' | 'cream';
  /** Shown instead of the list when a plan has no feature keys. */
  emptyHint?: string;
}) {
  if (features.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-white/60 p-4">
        <Lock size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
        <div>
          <p className="text-sm font-semibold text-gray-700">
            No features attached yet
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {emptyHint ??
              'This plan has not been configured with any features. Contact an administrator if you expected access.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul
      className={
        showDescriptions
          ? 'grid gap-3 sm:grid-cols-2'
          : 'space-y-2.5'
      }
    >
      {features.map((key) => {
        const entry = catalogueEntry(catalogue, key);

        return (
          <li
            key={key}
            className={
              showDescriptions
                ? `flex items-start gap-3 rounded-xl border p-3.5 ${
                    variant === 'cream'
                      ? 'border-[#C9A84C]/15 bg-[#FDFAF3]'
                      : 'border-gray-100 bg-white'
                  }`
                : 'flex items-start gap-2.5'
            }
          >
            <CheckCircle2
              size={showDescriptions ? 18 : 15}
              className="mt-0.5 flex-shrink-0 text-[#C9A84C]"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {entry?.label ?? humanizeFeature(key)}
              </p>
              {showDescriptions && entry?.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {entry.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Active Subscription Card ───────────────────────────────────────────────

function ActiveSubscriptionCard({
  subscription: sub,
  catalogue,
  onCancelAutoRenew,
  onUpdateCard,
  onDisable,
  actionLoading,
}: {
  subscription: ActiveSubscription;
  catalogue: FeatureCatalogueEntry[];
  onCancelAutoRenew: () => void;
  onUpdateCard: () => void;
  onDisable: () => void;
  actionLoading: boolean;
}) {
  const progress = useMemo(() => {
    const start = new Date(sub.start_date).getTime();
    const end = new Date(sub.end_date).getTime();
    const total = Math.max(1, Math.round((end - start) / 86_400_000));
    const remaining = Math.max(0, Math.min(total, sub.days_remaining));
    const elapsed = Math.max(0, total - remaining);
    return {
      total,
      elapsed,
      percentage: Math.min(100, Math.round((elapsed / total) * 100)),
    };
  }, [sub.start_date, sub.end_date, sub.days_remaining]);

  const features = sub.plan_features ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="relative border-b border-[#C9A84C]/10 bg-gradient-to-br from-[#FDFAF3] via-[#FDFAF3] to-[#F7EEDC] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-white shadow-sm">
              <PlanGlyph
                slug={sub.plan_slug}
                className="h-7 w-7 text-[#C9A84C]"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8962E]">
                Current plan
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {sub.plan_name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={getStatusBadgeVariant(sub.payment_status)}
                  size="sm"
                >
                  {sub.payment_status.charAt(0).toUpperCase() +
                    sub.payment_status.slice(1)}
                </Badge>
                <Badge variant="info" size="sm">
                  {formatInterval(sub.interval)} plan
                </Badge>
                <span className="text-xs font-medium text-gray-500">
                  {sub.days_remaining} {sub.days_remaining === 1 ? 'day' : 'days'}{' '}
                  remaining
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold tracking-tight text-[#B8962E]">
              {formatPrice(sub.price, sub.currency)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              per {intervalUnit(sub.interval)}
            </p>
          </div>
        </div>

        {/* Term progress */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-500">Billing period</span>
            <span className="font-semibold text-gray-700">
              {progress.elapsed} of {progress.total} days
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-[#C9A84C]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#B8962E] transition-all duration-700"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        {/* Status grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Calendar size={13} />
              Started
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(sub.start_date)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Calendar size={13} />
              {sub.auto_renew ? 'Renews' : 'Ends'}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(sub.end_date)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Clock size={13} />
              Days left
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {sub.days_remaining}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <RefreshCw size={13} />
              Auto-renew
            </div>
            <p
              className={`text-sm font-semibold ${
                sub.auto_renew ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {sub.auto_renew ? 'Active' : 'Cancelled'}
            </p>
          </div>
        </div>

        {/* Included features */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Layers size={16} className="text-[#C9A84C]" />
              What your plan includes
            </h3>
            <span className="rounded-full bg-[#FDFAF3] px-2.5 py-0.5 text-xs font-semibold text-[#B8962E] ring-1 ring-inset ring-[#C9A84C]/15">
              {features.length} {features.length === 1 ? 'feature' : 'features'}
            </span>
          </div>
          <IncludedFeatures
            features={features}
            catalogue={catalogue}
            showDescriptions
            variant="cream"
          />
        </div>

        {/* Next payment */}
        {sub.next_payment_date && sub.auto_renew && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <CreditCard
              size={16}
              className="mt-0.5 flex-shrink-0 text-blue-500"
            />
            <p className="text-sm text-blue-800">
              Next payment of{' '}
              <strong className="font-semibold">
                {formatPrice(sub.price, sub.currency)}
              </strong>{' '}
              on {formatDate(sub.next_payment_date)}.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex flex-wrap gap-3">
            {sub.auto_renew && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelAutoRenew}
                disabled={actionLoading}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban size={14} />
                )}
                Cancel auto-renew
              </Button>
            )}

            {sub.paystack_subscription_code && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpdateCard}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  Update card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisable}
                  disabled={actionLoading}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  Disable subscription
                </Button>
              </>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-gray-400">
            Need a different set of features? You can move to another plan once
            this term ends on {formatDate(sub.end_date)}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Plan Selection Card ────────────────────────────────────────────────────

function PlanSelectionCard({
  plan,
  catalogue,
  isRecommended,
  onSelect,
}: {
  plan: SubscriptionPlan;
  catalogue: FeatureCatalogueEntry[];
  isRecommended: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  const features = plan.features ?? [];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-300 ${
        isRecommended
          ? 'z-10 border-[#C9A84C] shadow-lg shadow-[#C9A84C]/10 md:scale-[1.03]'
          : 'border-gray-200 shadow-sm hover:border-[#C9A84C]/30 hover:shadow-lg'
      }`}
    >
      {isRecommended && (
        <>
          <div className="absolute -top-px left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-[#C9A84C]/35 via-[#C9A84C] to-[#C9A84C]/35" />
          <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#B8962E] px-4 py-1 text-xs font-bold text-white shadow-lg shadow-[#C9A84C]/30">
              <Star size={13} />
              Most popular
            </span>
          </div>
        </>
      )}

      <div className="flex h-full flex-col p-6">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isRecommended ? 'bg-[#C9A84C]/15' : 'bg-gray-100'
            }`}
          >
            <PlanGlyph
              slug={plan.slug}
              className={`h-6 w-6 ${
                isRecommended ? 'text-[#C9A84C]' : 'text-gray-500'
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-xs font-medium text-gray-500">
              {formatInterval(plan.interval)} billing
            </p>
          </div>
        </div>

        <div className="mb-5">
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            {formatPrice(plan.price, plan.currency)}
          </span>
          <span className="ml-1.5 text-sm text-gray-500">
            {intervalSuffix(plan.interval, plan.duration_days)}
          </span>
        </div>

        <div className="flex-1">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Included
          </p>
          <IncludedFeatures features={features} catalogue={catalogue} emptyHint="Feature details for this plan are being finalised." />
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="mb-4 text-xs text-gray-500">
            {plan.duration_days}-day billing term
          </p>
          <button
            onClick={() => onSelect(plan)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
              isRecommended
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#B8962E] text-white shadow-md shadow-[#C9A84C]/20 hover:shadow-lg hover:shadow-[#C9A84C]/30'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            Choose {plan.name}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { showAlert } = useAlert();
  const catalogue = useFeatureStore((state) => state.catalogue);
  const loadFeatures = useFeatureStore((state) => state.load);
  const {
    plans,
    plansLoading,
    fetchPlans,
    subscription,
    hasActiveSubscription,
    subscriptionLoading,
    history,
    historyLoading,
    historyPagination,
    fetchHistory,
    cancelAutoRenew,
    getCardUpdateLink,
    disableSubscription,
    actionLoading,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // The catalogue provides human labels for the feature keys stored on a plan.
  // The dashboard layout normally loads it first; this call is a no-op when it
  // already has (the store guards against duplicate requests).
  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, fetchHistory]);

  // ── Plan selection handler ──

  const handleSelectPlan = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  }, []);

  // ── Cancel auto-renew ──

  const handleCancelAutoRenew = useCallback(async () => {
    await cancelAutoRenew();
  }, [cancelAutoRenew]);

  // ── Update card ──

  const handleUpdateCard = useCallback(async () => {
    if (!subscription?.paystack_subscription_code) {
      showAlert('No active subscription found', 'error');
      return;
    }
    const link = await getCardUpdateLink(
      subscription.paystack_subscription_code
    );
    if (link) {
      window.open(link, '_blank');
    }
  }, [subscription, getCardUpdateLink, showAlert]);

  // ── Disable subscription ──

  const handleDisable = useCallback(async () => {
    if (!subscription?.paystack_subscription_code) {
      showAlert('No active subscription found', 'error');
      return;
    }

    // Prompt for email token
    const token = window.prompt(
      'Enter your email token to disable this subscription:'
    );
    if (!token) return;

    await disableSubscription(
      subscription.paystack_subscription_code,
      token
    );
  }, [subscription, disableSubscription, showAlert]);

  // ── Loading state ──

  // Wait for the subscription answer before deciding which page to show;
  // otherwise an existing member briefly sees the "choose a plan" pitch.
  if (subscriptionLoading || (!hasActiveSubscription && plansLoading)) {
    return <PageSkeleton />;
  }

  const recommendedSlug =
    plans.find((p) => p.slug === 'standard')?.slug ||
    plans[Math.floor(plans.length / 2)]?.slug ||
    '';

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Page header */}
      <section className="rounded-2xl border border-[#C9A84C]/15 bg-gradient-to-br from-[#FDFAF3] to-white px-6 py-8 sm:px-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8962E]">
              Membership
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {hasActiveSubscription ? 'Your membership' : 'Choose your membership'}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
              {hasActiveSubscription
                ? 'Manage your plan, review everything it includes, and keep your billing details current.'
                : 'Every plan unlocks a distinct set of features. Choose the one that fits how you use the network.'}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#C9A84C]/15 bg-white/70 px-4 py-3 text-xs font-medium text-gray-600">
            <ShieldCheck size={16} className="flex-shrink-0 text-[#C9A84C]" />
            Secure payments by Paystack
          </div>
        </div>
      </section>

      {/* Active subscription section */}
      {hasActiveSubscription && subscription && (
        <section className="space-y-4">
          <ActiveSubscriptionCard
            subscription={subscription}
            catalogue={catalogue}
            onCancelAutoRenew={handleCancelAutoRenew}
            onUpdateCard={handleUpdateCard}
            onDisable={handleDisable}
            actionLoading={actionLoading}
          />

          {/* View history button */}
          <div className="text-center">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8962E] transition-colors hover:text-[#8F7220]"
            >
              <History size={16} />
              {showHistory ? 'Hide history' : 'View subscription history'}
            </button>
          </div>

          {/* History section */}
          {showHistory && (
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-gray-900">
                  Subscription history
                </h3>
              </CardHeader>
              <CardBody>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No subscription history found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 transition-colors hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.plan}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.start_date)} -{' '}
                            {formatDate(item.end_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(item.amount)}
                          </p>
                          <Badge
                            variant={getStatusBadgeVariant(item.payment_status)}
                            size="sm"
                          >
                            {item.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {historyPagination.last_page > 1 && (
                      <div className="flex justify-center gap-2 pt-2">
                        {Array.from(
                          { length: historyPagination.last_page },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => fetchHistory(page)}
                            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                              page === historyPagination.current_page
                                ? 'bg-[#C9A84C] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </section>
      )}

      {/* Plan selection section — shown when no active subscription */}
      {!hasActiveSubscription && !subscriptionLoading && (
        <section>
          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No plans available at the moment</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <PlanSelectionCard
                  key={plan.id}
                  plan={plan}
                  catalogue={catalogue}
                  isRecommended={plan.slug === recommendedSlug}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Checkout modal */}
      <PaystackCheckoutModal
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </div>
  );
}
