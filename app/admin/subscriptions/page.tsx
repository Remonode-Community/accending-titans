'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Trash2,
  Loader2,
  Star,
  ChevronDown,
  Check,
  Layers,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminModal } from '@/components/admin/AdminModal';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useAlert } from '@/hooks/useAlert';
import { subscriptionService } from '@/services/subscription.service';
import { platformSettingsService } from '@/services/platform-settings.service';
import { formatDate } from '@/utils/format.utils';
import type { AdminSubscriptionPlan, AdminSubscriptionList } from '@/types/subscription.types';
import type { FeatureCatalogueEntry } from '@/types/platform-settings.types';

// ─── Types ──────────────────────────────────────────────────────────────

type TabView = 'subscriptions' | 'plans';

type BillingInterval = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';

const BILLING_INTERVALS: { value: BillingInterval; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Biannually' },
  { value: 'annually', label: 'Annually' },
];

interface PlanFormData {
  name: string;
  slug: string;
  price: number;
  duration_days: number;
  interval: BillingInterval;
  currency: string;
  description: string;
  send_invoices: boolean;
  send_sms: boolean;
  invoice_limit: number;
  /** Registry keys from the platform feature catalogue. */
  features: string[];
}

interface SubscriptionStats {
  total: number;
  active: number;
  cancelled: number;
  totalRevenue: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getPaymentBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    paid: 'success',
    active: 'success',
    failed: 'danger',
    pending: 'warning',
    cancelled: 'info',
  };
  return map[status?.toLowerCase()] ?? 'info';
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

function computeStats(data: AdminSubscriptionList[]): SubscriptionStats {
  const active = data.filter(
    (s) => s.payment_status === 'paid' || s.payment_status === 'active'
  ).length;
  const cancelled = data.filter(
    (s) => s.payment_status === 'cancelled'
  ).length;
  const revenue = data.reduce((sum, s) => sum + (s.price || 0), 0);

  return {
    total: data.length,
    active,
    cancelled,
    totalRevenue: revenue,
  };
}

function parseFeatures(features: unknown): string[] {
  if (!features) return [];
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  if (typeof features === 'string') {
    const trimmed = features.trim();
    if (!trimmed) return [];
    if (
      trimmed.startsWith('[') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('"')
    ) {
      try {
        return parseFeatures(JSON.parse(trimmed));
      } catch {
        // A legacy plan may still hold prose rather than JSON. Show it as one
        // label; saving will replace it with registry keys.
      }
    }
    return [trimmed];
  }
  return [];
}

// ─── Default Plan Form ──────────────────────────────────────────────────

const EMPTY_PLAN_FORM: PlanFormData = {
  name: '',
  slug: '',
  price: 2000,
  duration_days: 30,
  interval: 'monthly',
  currency: 'NGN',
  description: '',
  send_invoices: true,
  send_sms: true,
  invoice_limit: 12,
  features: [],
};

// ─── Page Component ─────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const { showAlert } = useAlert();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabView>('subscriptions');

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionList[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsPage, setSubsPage] = useState(1);
  const [subsTotalPages, setSubsTotalPages] = useState(1);
  const [subsTotal, setSubsTotal] = useState(0);
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  // Plans state
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Plan feature catalogue
  const [featureOptions, setFeatureOptions] = useState<FeatureCatalogueEntry[]>([]);
  const [featurePickerOpen, setFeaturePickerOpen] = useState(false);
  const featurePickerRef = useRef<HTMLDivElement>(null);

  // Detail modal state
  const [selectedSub, setSelectedSub] = useState<AdminSubscriptionList | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Plan form modal state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormData>(EMPTY_PLAN_FORM);
  const [editingPlan, setEditingPlan] = useState<AdminSubscriptionPlan | null>(null);
  const [planFormSaving, setPlanFormSaving] = useState(false);

  // Delete confirm state
  const [deletingPlan, setDeletingPlan] = useState<AdminSubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const PER_PAGE = 20;

  // ── Data Loading ────────────────────────────────────────────────────

  const loadSubscriptions = useCallback(async (page = 1) => {
    setSubsLoading(true);
    try {
      const res = await subscriptionService.adminGetAll(page, PER_PAGE);
      // API returns { subscriptions: [...], pagination: {...} } inside data
      if (res.success && res.data) {
        const subs = res.data.subscriptions ?? [];
        const pagination = res.data.pagination;
        setSubscriptions(subs);
        setSubsTotalPages(pagination?.last_page || 1);
        setSubsTotal(pagination?.total || 0);
        setStats(computeStats(subs));
      }
    } catch {
      showAlert('Failed to load subscriptions', 'error');
    } finally {
      setSubsLoading(false);
    }
  }, [showAlert]);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await subscriptionService.getPlans();
      if (res.success && res.data?.plans) {
        // Map to AdminSubscriptionPlan shape with is_active default
        setPlans(
          res.data.plans.map((p) => ({
            ...p,
            is_active: true,
          })) as AdminSubscriptionPlan[]
        );
      }
    } catch {
      // Silently fail — plans are supplementary
    } finally {
      setPlansLoading(false);
    }
  }, []);

  /**
   * The catalogue is the authoritative list of plan-gated features. It comes
   * from `/v1/features`, which every signed-in member can read, so a
   * subscription manager without platform-settings permission can still
   * configure a plan.
   */
  const loadFeatureOptions = useCallback(async () => {
    try {
      const res = await platformSettingsService.getFeatures();
      if (res.success && res.data?.catalogue) {
        setFeatureOptions(res.data.catalogue);
      }
    } catch {
      // Without the catalogue the selector stays empty; saving is blocked by
      // the "at least one feature" validation rather than silently creating a
      // plan that unlocks nothing.
    }
  }, []);

  useEffect(() => {
    loadSubscriptions(1);
    loadPlans();
    loadFeatureOptions();
  }, [loadSubscriptions, loadPlans, loadFeatureOptions]);

  // Close the feature picker when clicking outside it.
  useEffect(() => {
    if (!featurePickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        featurePickerRef.current &&
        !featurePickerRef.current.contains(event.target as Node)
      ) {
        setFeaturePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [featurePickerOpen]);

  const groupedFeatureOptions = useMemo(() => {
    const groups = new Map<string, FeatureCatalogueEntry[]>();

    for (const option of featureOptions) {
      const list = groups.get(option.group) ?? [];
      list.push(option);
      groups.set(option.group, list);
    }

    return Array.from(groups.entries());
  }, [featureOptions]);

  const featureLabel = useCallback(
    (key: string) =>
      featureOptions.find((option) => option.key === key)?.label ??
      key
        .split(/[_-]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    [featureOptions]
  );

  const togglePlanFeature = (key: string) => {
    setPlanForm((prev) => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter((item) => item !== key)
        : [...prev.features, key],
    }));
  };

  // ── Handlers ────────────────────────────────────────────────────────

  const handleViewSubscription = (sub: AdminSubscriptionList) => {
    setSelectedSub(sub);
    setShowDetail(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm(EMPTY_PLAN_FORM);
    setFeaturePickerOpen(false);
    setShowPlanForm(true);
  };

  const handleEditPlan = (plan: AdminSubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      duration_days: plan.duration_days,
      interval: (plan.interval || 'monthly') as BillingInterval,
      currency: plan.currency || 'NGN',
      description: plan.description || '',
      send_invoices: plan.send_invoices ?? true,
      send_sms: plan.send_sms ?? true,
      invoice_limit: plan.invoice_limit ?? 12,
      features: parseFeatures(plan.features),
    });
    setFeaturePickerOpen(false);
    setShowPlanForm(true);
  };

  const handleSavePlan = async () => {
    // Validate
    if (!planForm.name.trim()) {
      showAlert('Plan name is required', 'error');
      return;
    }
    if (!planForm.slug.trim()) {
      showAlert('Plan slug is required', 'error');
      return;
    }
    if (planForm.price <= 0) {
      showAlert('Price must be greater than 0', 'error');
      return;
    }
    if (planForm.features.length === 0) {
      showAlert('Select at least one feature for this plan', 'error');
      return;
    }

    setPlanFormSaving(true);
    try {
      const features = planForm.features;

      if (editingPlan) {
        const res = await subscriptionService.adminUpdatePlan(editingPlan.id, {
          name: planForm.name,
          slug: planForm.slug,
          price: planForm.price,
          duration_days: planForm.duration_days,
          interval: planForm.interval,
          currency: planForm.currency,
          description: planForm.description || undefined,
          send_invoices: planForm.send_invoices,
          send_sms: planForm.send_sms,
          invoice_limit: planForm.invoice_limit,
          features,
        });
        if (res.success) {
          showAlert('Plan updated successfully', 'success');
          setShowPlanForm(false);
          loadPlans();
        } else {
          showAlert(res.message || 'Failed to update plan', 'error');
        }
      } else {
        const res = await subscriptionService.adminCreatePlan({
          name: planForm.name,
          slug: planForm.slug,
          price: planForm.price,
          duration_days: planForm.duration_days,
          interval: planForm.interval,
          currency: planForm.currency,
          description: planForm.description || undefined,
          send_invoices: planForm.send_invoices,
          send_sms: planForm.send_sms,
          invoice_limit: planForm.invoice_limit,
          features,
        });
        if (res.success) {
          showAlert('Plan created successfully', 'success');
          setShowPlanForm(false);
          loadPlans();
        } else {
          showAlert(res.message || 'Failed to create plan', 'error');
        }
      }
    } catch {
      showAlert('Failed to save plan', 'error');
    } finally {
      setPlanFormSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setDeleting(true);
    try {
      const res = await subscriptionService.adminDeletePlan(deletingPlan.id);
      if (res.success) {
        showAlert('Plan deactivated successfully', 'success');
        setDeletingPlan(null);
        loadPlans();
      } else {
        showAlert(res.message || 'Failed to deactivate plan', 'error');
      }
    } catch {
      showAlert('Failed to deactivate plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Table Columns ───────────────────────────────────────────────────

  const subscriptionColumns = [
    { key: 'id', label: 'ID', width: '60px' },
    {
      key: 'user_name',
      label: 'User',
      render: (_: unknown, row: AdminSubscriptionList) => (
        <div>
          <p className="font-medium text-gray-900">{row.user_name}</p>
          <p className="text-xs text-gray-500">{row.user_email}</p>
        </div>
      ),
    },
    { key: 'plan_name', label: 'Plan' },
    {
      key: 'price',
      label: 'Amount',
      render: (v: number) => (
        <span className="font-semibold">{formatPrice(v)}</span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (v: string) => (
        <Badge variant={getPaymentBadgeVariant(v)} size="sm">
          {v}
        </Badge>
      ),
    },
    {
      key: 'auto_renew',
      label: 'Auto-Renew',
      render: (v: boolean) => (
        <span className={v ? 'text-green-600' : 'text-gray-400'}>
          {v ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'start_date',
      label: 'Start',
      render: (v: string) => (
        <span className="text-sm text-gray-600">{formatDate(v)}</span>
      ),
    },
    {
      key: 'end_date',
      label: 'End',
      render: (v: string) => (
        <span className="text-sm text-gray-600">{formatDate(v)}</span>
      ),
    },
    {
      key: 'days_remaining',
      label: 'Days Left',
      align: 'center' as const,
      render: (v: number) => (
        <span
          className={`font-semibold ${
            v <= 3 ? 'text-red-600' : v <= 7 ? 'text-amber-600' : 'text-gray-700'
          }`}
        >
          {v}d
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (_: unknown, row: AdminSubscriptionList) => (
        <button
          onClick={() => handleViewSubscription(row)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
          title="View details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  const planColumns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'price',
      label: 'Price',
      render: (v: number, row: AdminSubscriptionPlan) => (
        <span className="font-semibold">{formatPrice(v, row.currency)}</span>
      ),
    },
    {
      key: 'duration_days',
      label: 'Duration',
      render: (v: number) => `${v}d`,
    },
    {
      key: 'interval',
      label: 'Interval',
      render: (_: unknown, row: AdminSubscriptionPlan) => {
        const interval = row.interval || 'monthly';
        return (
          <span className="capitalize text-sm text-gray-700">{interval}</span>
        );
      },
    },
    {
      key: 'features',
      label: 'Included features',
      render: (v: string[] | null) => {
        const keys = parseFeatures(v);

        if (keys.length === 0) {
          return <span className="text-xs text-gray-400">None</span>;
        }

        const visible = keys.slice(0, 2);

        return (
          <div className="flex max-w-[260px] flex-wrap items-center gap-1">
            {visible.map((key) => (
              <span
                key={key}
                className="inline-flex items-center rounded-full bg-[#FDFAF3] px-2 py-0.5 text-[11px] font-semibold text-[#8F7220] ring-1 ring-inset ring-[#C9A84C]/20"
              >
                {featureLabel(key)}
              </span>
            ))}
            {keys.length > visible.length && (
              <span className="text-[11px] font-semibold text-gray-400">
                +{keys.length - visible.length} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Active',
      render: (v: boolean) => (
        <Badge variant={v ? 'success' : 'danger'} size="sm">
          {v ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (_: unknown, row: AdminSubscriptionPlan) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEditPlan(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit plan"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setDeletingPlan(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Deactivate plan"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="Subscriptions"
        description="Manage plans, the features each one includes, and member subscriptions"
        action={{
          label: 'Create Plan',
          onClick: handleCreatePlan,
        }}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'subscriptions'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} className="inline mr-2 -mt-0.5" />
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'plans'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Star size={16} className="inline mr-2 -mt-0.5" />
          Plans
        </button>
      </div>

      {/* ── TAB: Subscriptions ── */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Stats */}
          <AdminStats
            stats={[
              {
                title: 'Total Subscriptions',
                value: stats.total,
                icon: <CreditCard size={20} />,
              },
              {
                title: 'Active',
                value: stats.active,
                icon: <CheckCircle2 size={20} className="text-green-600" />,
              },
              {
                title: 'Cancelled',
                value: stats.cancelled,
                icon: <XCircle size={20} className="text-red-500" />,
              },
              {
                title: 'Total Revenue',
                value: formatPrice(stats.totalRevenue),
                icon: <CreditCard size={20} />,
              },
            ]}
          />

          {/* Subscriptions Table */}
          <AdminTable
            columns={subscriptionColumns}
            data={subscriptions}
            loading={subsLoading}
            currentPage={subsPage}
            totalPages={subsTotalPages}
            total={subsTotal}
            onPageChange={(page) => {
              setSubsPage(page);
              loadSubscriptions(page);
            }}
            emptyMessage="No subscriptions found"
          />
        </>
      )}

      {/* ── TAB: Plans ── */}
      {activeTab === 'plans' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} configured
            </p>
            <Button variant="primary" size="sm" onClick={handleCreatePlan}>
              <Plus size={16} />
              New Plan
            </Button>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
            </div>
          ) : (
            <AdminTable
              columns={planColumns}
              data={plans}
              loading={false}
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              emptyMessage="No plans created yet. Create your first plan to get started."
            />
          )}
        </div>
      )}

      {/* ── Subscription Detail Modal ── */}
      <AdminModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Subscription Details"
        icon={CreditCard}
        size="lg"
      >
        {selectedSub && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User</p>
                <p className="mt-1 font-medium text-gray-900">{selectedSub.user_name}</p>
                <p className="text-sm text-gray-500">{selectedSub.user_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</p>
                <p className="mt-1 font-medium text-gray-900">{selectedSub.plan_name}</p>
                <p className="text-sm text-gray-500">{formatPrice(selectedSub.price)}/month</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge variant={getPaymentBadgeVariant(selectedSub.payment_status)}>
                    {selectedSub.payment_status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Auto-Renew</p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedSub.auto_renew ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</p>
                <p className="mt-1 font-medium text-gray-900">{formatDate(selectedSub.start_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</p>
                <p className="mt-1 font-medium text-gray-900">{formatDate(selectedSub.end_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Days Remaining</p>
                <p className="mt-1 font-medium text-gray-900">{selectedSub.days_remaining}d</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                <p className="mt-1 font-medium text-gray-900">{formatDate(selectedSub.created_at)}</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ── Plan Form Modal ── */}
      <AdminModal
        isOpen={showPlanForm}
        onClose={() => {
          setShowPlanForm(false);
          setFeaturePickerOpen(false);
        }}
        title={editingPlan ? 'Edit Plan' : 'Create Plan'}
        subtitle={editingPlan ? `Editing "${editingPlan.name}"` : 'Define a new subscription tier'}
        icon={editingPlan ? undefined : Plus}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPlanForm(false);
                setFeaturePickerOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePlan}
              disabled={planFormSaving}
            >
              {planFormSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingPlan ? (
                'Update Plan'
              ) : (
                'Create Plan'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none placeholder-gray-500"
                placeholder="e.g. Basic Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planForm.slug}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none placeholder-gray-500"
                placeholder="e.g. basic"
              />
            </div>
          </div>

          {/* Price & Duration & Interval */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Price ({planForm.currency}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={planForm.price}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Duration (days)
              </label>
              <input
                type="number"
                value={planForm.duration_days}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, duration_days: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Billing Interval <span className="text-red-500">*</span>
              </label>
              <select
                value={planForm.interval}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, interval: e.target.value as BillingInterval }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none bg-white"
              >
                {BILLING_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency & Invoice Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={planForm.currency}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none bg-white"
              >
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Invoice Limit <span className="text-gray-400 font-normal">(max payments)</span>
              </label>
              <input
                type="number"
                value={planForm.invoice_limit}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, invoice_limit: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none"
                min={1}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(sent to Paystack)</span>
            </label>
            <input
              type="text"
              value={planForm.description}
              onChange={(e) =>
                setPlanForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] outline-none placeholder-gray-500"
              placeholder="e.g. Network and catalogue access for 30 days"
            />
          </div>

          {/* Send Invoices & Send SMS */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={planForm.send_invoices}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, send_invoices: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">Send Invoices</p>
                <p className="text-xs text-gray-400">Email invoices to customers</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={planForm.send_sms}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, send_sms: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">Send SMS</p>
                <p className="text-xs text-gray-400">SMS notifications to customers</p>
              </div>
            </label>
          </div>

          {/* Included features */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Included features <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-medium text-gray-400">
                {planForm.features.length} selected
              </span>
            </div>
            <p className="mb-2 text-xs text-gray-400">
              Members on this plan can use only the features selected here.
            </p>

            <div className="relative" ref={featurePickerRef}>
              <button
                type="button"
                onClick={() => setFeaturePickerOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 outline-none transition-colors hover:border-[#C9A84C]/40 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
              >
                <span className="inline-flex items-center gap-2">
                  <Layers size={15} className="text-[#C9A84C]" />
                  {planForm.features.length === 0
                    ? 'Select features'
                    : `${planForm.features.length} feature${
                        planForm.features.length === 1 ? '' : 's'
                      } selected`}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${
                    featurePickerOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {featurePickerOpen && (
                <div className="mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                  {groupedFeatureOptions.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-gray-500">
                      Feature catalogue unavailable. Refresh the page to try
                      again.
                    </p>
                  ) : (
                    groupedFeatureOptions.map(([group, options]) => (
                      <div key={group} className="py-1">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {group}
                        </p>
                        {options.map((option) => {
                          const checked = planForm.features.includes(option.key);

                          return (
                            <label
                              key={option.key}
                              className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePlanFeature(option.key)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                              />
                              <span>
                                <span className="block text-sm font-medium text-gray-900">
                                  {option.label}
                                </span>
                                <span className="block text-xs text-gray-500">
                                  {option.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ))
                  )}

                  <div className="sticky bottom-0 -mx-2 mt-1 flex items-center justify-between border-t border-gray-100 bg-white px-2 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((prev) => ({
                          ...prev,
                          features: featureOptions.map((option) => option.key),
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8962E] hover:text-[#8F7220]"
                    >
                      <Check size={13} />
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((prev) => ({ ...prev, features: [] }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {planForm.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {planForm.features.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FDFAF3] px-2.5 py-1 text-xs font-semibold text-[#8F7220] ring-1 ring-inset ring-[#C9A84C]/20"
                  >
                    {featureLabel(key)}
                    <button
                      type="button"
                      onClick={() => togglePlanFeature(key)}
                      className="text-[#C9A84C] transition-colors hover:text-[#8F7220]"
                      aria-label={`Remove ${featureLabel(key)}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminModal>

      {/* ── Delete Confirm Modal ── */}
      <AdminModal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        title="Deactivate Plan"
        subtitle={
          deletingPlan
            ? `Are you sure you want to deactivate "${deletingPlan.name}"?`
            : ''
        }
        icon={Trash2}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingPlan(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePlan}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          This will mark the plan as inactive. Existing subscribers will not be
          affected, but new subscriptions to this plan will be blocked.
        </p>
      </AdminModal>
    </div>
  );
}
