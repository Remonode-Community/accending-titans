'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Loader2, Save, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAlert } from '@/hooks/useAlert';
import { useAuthStore } from '@/store/auth.store';
import { platformSettingsService } from '@/services/platform-settings.service';
import type { FeatureFlag, FeatureKey } from '@/types/platform-settings.types';

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={clsx(
        'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:ring-offset-2',
        enabled ? 'bg-[#C9A84C]' : 'bg-gray-200'
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export default function AdminFeaturesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const isAdmin = useMemo(() => Boolean(user?.roles?.some((r) => r === 'admin')), [user]);

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await platformSettingsService.adminGet();
      if (res.success && res.data?.features) {
        setFeatures(res.data.features);
        setDirty(false);
      }
    } catch {
      showAlert('Failed to load feature switches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount; the rule flags the loading state set by `load`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: FeatureKey) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
    setDirty(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const map = Object.fromEntries(
        features.map((feature) => [feature.key, feature.enabled])
      ) as Partial<Record<FeatureKey, boolean>>;

      const res = await platformSettingsService.adminUpdateFeatures(map);
      if (res.success) {
        showAlert('Feature switches saved', 'success');
        setDirty(false);
        await load();
      } else {
        showAlert(res.message || 'Failed to save feature switches', 'error');
      }
    } catch {
      showAlert('Failed to save feature switches', 'error');
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup: Record<string, FeatureFlag[]> = {};

    for (const feature of features) {
      if (!byGroup[feature.group]) {
        byGroup[feature.group] = [];
        order.push(feature.group);
      }
      byGroup[feature.group].push(feature);
    }

    return order.map((group) => ({ group, items: byGroup[group] }));
  }, [features]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <SlidersHorizontal className="h-6 w-6 text-[#C9A84C]" /> Feature Controls
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Switch member-facing features on or off. Changes take effect immediately.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={loading || saving || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#B8962E] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </section>

      <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          A disabled feature is removed from every member&apos;s sidebar and its API
          routes refuse requests. Admin screens stay reachable.
        </p>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ group, items }) => (
            <Card
              key={group}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
            >
              <div className="border-b border-gray-100 px-5 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-start justify-between gap-6 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{feature.label}</p>
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            feature.enabled
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {feature.enabled ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{feature.description}</p>
                      {feature.path && (
                        <p className="mt-1 font-mono text-[11px] text-gray-400">{feature.path}</p>
                      )}
                    </div>
                    <Toggle
                      enabled={feature.enabled}
                      onChange={() => toggle(feature.key)}
                      label={`Toggle ${feature.label}`}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
