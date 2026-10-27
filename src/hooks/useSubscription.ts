'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useFeatureStore } from '@/store/feature.store';
import { subscriptionService } from '@/services/subscription.service';
import type {
  SubscriptionPlan,
  ActiveSubscription,
  SubscriptionHistoryItem,
  InitializeSubscriptionResponse,
} from '@/types/subscription.types';

interface UseSubscriptionReturn {
  // Plans
  plans: SubscriptionPlan[];
  plansLoading: boolean;
  fetchPlans: () => Promise<void>;

  // Active subscription
  subscription: ActiveSubscription | null;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
  fetchSubscription: () => Promise<void>;

  // History
  history: SubscriptionHistoryItem[];
  historyLoading: boolean;
  historyPagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  fetchHistory: (page?: number) => Promise<void>;

  // Payment flow
  initializePayment: (planId: number) => Promise<InitializeSubscriptionResponse | null>;
  verifyAndCreate: (reference: string, planId: number) => Promise<boolean>;

  // Management actions
  enableSubscription: (subscriptionCode: string, emailToken: string) => Promise<boolean>;
  disableSubscription: (subscriptionCode: string, emailToken: string) => Promise<boolean>;
  cancelAutoRenew: () => Promise<boolean>;
  getCardUpdateLink: (subscriptionCode: string) => Promise<string | null>;
  sendCardUpdateEmail: (subscriptionCode: string) => Promise<boolean>;

  // State
  error: string | null;
  actionLoading: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const refreshEntitlements = useFeatureStore((s) => s.load);

  // Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Active subscription
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // History
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });

  // Error & action state
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch Plans ─────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setError(null);
    try {
      const res = await subscriptionService.getPlans();
      if (res.success && res.data?.plans) {
        setPlans(res.data.plans);
      } else {
        setError(res.message || 'Failed to load plans');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ── Fetch My Subscription ──────────────────────────────────────

  const fetchSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    setError(null);
    try {
      const res = await subscriptionService.getMySubscription();
      if (res.success && res.data) {
        setHasActiveSubscription(res.data.has_active_subscription);
        setSubscription(res.data.subscription);
      } else {
        setHasActiveSubscription(false);
        setSubscription(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription');
      setHasActiveSubscription(false);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  // ── Fetch History ───────────────────────────────────────────────

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await subscriptionService.getHistory(page);
      if (res.success && res.data) {
        setHistory(res.data.subscriptions);
        setHistoryPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Initialize Payment ──────────────────────────────────────────

  const initializePayment = useCallback(
    async (planId: number): Promise<InitializeSubscriptionResponse | null> => {
      setActionLoading(true);
      setError(null);
      try {
        const res = await subscriptionService.initializePayment({
          plan_id: planId,
        });
        if (res.success && res.data) {
          return res.data;
        }
        setError(res.message || 'Failed to initialize payment');
        return null;
      } catch (err: any) {
        const msg = err?.message || 'Failed to initialize payment';
        setError(msg);
        showAlert(msg, 'error');
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [showAlert]
  );

  // ── Verify & Create ─────────────────────────────────────────────

  const verifyAndCreate = useCallback(
    async (reference: string, planId: number): Promise<boolean> => {
      setActionLoading(true);
      setError(null);
      try {
        const res = await subscriptionService.verifyAndCreate({
          reference,
          plan_id: planId,
        });
        if (res.success) {
          showAlert('Subscription activated successfully!', 'success');
          // Refresh subscription data and the feature map: activating a plan
          // unlocks its features immediately.
          await fetchSubscription();
          await refreshEntitlements(true);
          return true;
        }
        setError(res.message || 'Failed to verify payment');
        showAlert(res.message || 'Failed to verify payment', 'error');
        return false;
      } catch (err: any) {
        const msg = err?.message || 'Failed to verify payment';
        setError(msg);
        showAlert(msg, 'error');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchSubscription, refreshEntitlements, showAlert]
  );

  // ── Enable Subscription ─────────────────────────────────────────

  const enableSubscription = useCallback(
    async (
      subscriptionCode: string,
      emailToken: string
    ): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await subscriptionService.enableSubscription({
          subscription_code: subscriptionCode,
          email_token: emailToken,
        });
        if (res.success) {
          showAlert('Subscription enabled successfully', 'success');
          await fetchSubscription();
          await refreshEntitlements(true);
          return true;
        }
        showAlert(res.message || 'Failed to enable subscription', 'error');
        return false;
      } catch (err: any) {
        showAlert(err?.message || 'Failed to enable subscription', 'error');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchSubscription, refreshEntitlements, showAlert]
  );

  // ── Disable Subscription ────────────────────────────────────────

  const disableSubscription = useCallback(
    async (
      subscriptionCode: string,
      emailToken: string
    ): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await subscriptionService.disableSubscription({
          subscription_code: subscriptionCode,
          email_token: emailToken,
        });
        if (res.success) {
          showAlert('Subscription disabled successfully', 'success');
          await fetchSubscription();
          await refreshEntitlements(true);
          return true;
        }
        showAlert(res.message || 'Failed to disable subscription', 'error');
        return false;
      } catch (err: any) {
        showAlert(err?.message || 'Failed to disable subscription', 'error');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchSubscription, refreshEntitlements, showAlert]
  );

  // ── Cancel Auto-Renew ───────────────────────────────────────────

  const cancelAutoRenew = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await subscriptionService.cancelAutoRenew();
      if (res.success) {
        showAlert('Auto-renewal cancelled successfully', 'success');
        await fetchSubscription();
        await refreshEntitlements(true);
        return true;
      }
      showAlert(res.message || 'Failed to cancel auto-renewal', 'error');
      return false;
    } catch (err: any) {
      showAlert(err?.message || 'Failed to cancel auto-renewal', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [fetchSubscription, refreshEntitlements, showAlert]);

  // ── Get Card Update Link ────────────────────────────────────────

  const getCardUpdateLink = useCallback(
    async (subscriptionCode: string): Promise<string | null> => {
      setActionLoading(true);
      try {
        const res = await subscriptionService.getCardUpdateLink(
          subscriptionCode
        );
        if (res.success && res.data?.link) {
          return res.data.link;
        }
        showAlert(
          res.message || 'Failed to generate card update link',
          'error'
        );
        return null;
      } catch (err: any) {
        showAlert(err?.message || 'Failed to get card update link', 'error');
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [showAlert]
  );

  // ── Send Card Update Email ──────────────────────────────────────

  const sendCardUpdateEmail = useCallback(
    async (subscriptionCode: string): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await subscriptionService.sendCardUpdateEmail(
          subscriptionCode
        );
        if (res.success) {
          showAlert('Card update email sent successfully', 'success');
          return true;
        }
        showAlert(
          res.message || 'Failed to send card update email',
          'error'
        );
        return false;
      } catch (err: any) {
        showAlert(
          err?.message || 'Failed to send card update email',
          'error'
        );
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [showAlert]
  );

  // ── Auto-fetch on mount ─────────────────────────────────────────

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user, fetchSubscription]);

  return {
    // Plans
    plans,
    plansLoading,
    fetchPlans,

    // Active subscription
    subscription,
    hasActiveSubscription,
    subscriptionLoading,
    fetchSubscription,

    // History
    history,
    historyLoading,
    historyPagination,
    fetchHistory,

    // Payment flow
    initializePayment,
    verifyAndCreate,

    // Management
    enableSubscription,
    disableSubscription,
    cancelAutoRenew,
    getCardUpdateLink,
    sendCardUpdateEmail,

    // State
    error,
    actionLoading,
  };
}
