'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  LifeBuoy,
  Loader2,
  Mail,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationPreference } from '@/types/notification.types';

interface NotificationPreferencesProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type ToggleableField = 
  | 'enabled'
  | 'transaction_notifications'
  | 'system_notifications'
  | 'promotion_notifications'
  | 'update_notifications'
  | 'alert_notifications'
  | 'support_ticket_notifications'
  | 'network_ask_notifications'
  | 'email_notifications'
  | 'push_notifications'
;

// ── Reusable toggle row ──────────────────────────────────────────────────────
interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  saving: boolean;
  gold?: boolean;
  icon?: React.ElementType;
  onChange: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  checked,
  disabled,
  saving,
  gold = false,
  icon: Icon,
  onChange,
}) => (
  <label
    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
      disabled
        ? 'cursor-not-allowed opacity-50'
        : 'hover:border-[#C9A84C]/30 hover:bg-[#FDFAF3]/40'
    } ${checked && !disabled ? 'border-[#C9A84C]/25 bg-[#FDFAF3]/60' : 'border-gray-100 bg-white'}`}
  >
    {/* Toggle knob */}
    <div
      className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200"
      style={{
        backgroundColor:
          checked && !disabled
            ? gold
              ? '#C9A84C'
              : '#C9A84C'
            : '#e5e7eb',
      }}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked && !disabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </div>

    {/* Label */}
    <div className="flex-1 min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        {Icon && <Icon size={14} className="flex-shrink-0 text-gray-400" />}
        {label}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{description}</p>
    </div>

    {saving && (
      <Loader2 size={14} className="flex-shrink-0 animate-spin text-[#C9A84C]" />
    )}

    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only"
    />
  </label>
);

// ── Section wrapper ──────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, icon: Icon, children }) => (
  <div>
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A84C]/20 bg-[#FDFAF3]">
        <Icon size={15} className="text-[#C9A84C]" />
      </div>
      <div>
        <h3 className="text-sm font-black text-gray-900">{title}</h3>
        <p className="text-[11px] text-gray-400">{description}</p>
      </div>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen = true,
}) => {
  const { preferences, preferencesLoading, fetchPreferences, updatePreferences } =
    useNotifications();

  const [savingField, setSavingField] = useState<ToggleableField | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (field: ToggleableField, currentValue: boolean) => {
    if (!preferences || savingField) return;

    setSavingField(field);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updatePreferences({ [field]: !currentValue });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to update preferences';
      setSaveError(message);
    } finally {
      setSavingField(null);
    }
  };

  if (!isOpen) return null;

  const notificationTypes: Array<{
    key: ToggleableField;
    label: string;
    description: string;
    icon?: React.ElementType;
  }> = [
    {
      key: 'transaction_notifications',
      label: 'Transactions',
      description: 'Payments, transfers and wallet updates',
    },
    {
      key: 'system_notifications',
      label: 'System Updates',
      description: 'Platform maintenance and important notices',
    },
    {
      key: 'promotion_notifications',
      label: 'Promotions',
      description: 'Exclusive offers, deals and campaigns',
    },
    {
      key: 'update_notifications',
      label: 'New Features',
      description: 'Product improvements and feature launches',
    },
    {
      key: 'alert_notifications',
      label: 'Security Alerts',
      description: 'Login alerts and suspicious activity',
    },
    {
      key: 'support_ticket_notifications',
      label: 'Support Tickets',
      description: 'New tickets, replies, assignments and resolutions from the support desk',
      icon: LifeBuoy,
    },
    {
      key: 'network_ask_notifications',
      label: 'Network Asks',
      description: 'Support questions raised by your network',
      icon: Users,
    },
  ];

  const deliveryChannels: Array<{
    key: ToggleableField;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      key: 'push_notifications',
      label: 'Push Notifications',
      description: 'Instant alerts on your device',
      icon: Smartphone,
    },
    {
      key: 'email_notifications',
      label: 'Email Notifications',
      description: 'Summaries delivered to your inbox',
      icon: Mail,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div className="h-[3px] bg-gradient-to-r from-[#C9A84C]/30 via-[#C9A84C] to-[#C9A84C]/30" />

      <div className="p-6 sm:p-8">

        {/* ── Loading ── */}
        {preferencesLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#FDFAF3]">
              <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Loading your preferences…</p>
          </div>
        ) : !preferences ? (
          /* ── Error loading ── */
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">Unable to load preferences</p>
              <p className="mt-0.5 text-xs text-red-600">
                We couldn't fetch your notification settings. Please try again later.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-7">

            {/* ── Toast banners ── */}
            {saveSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Preferences saved</p>
                  <p className="mt-0.5 text-xs text-green-600">
                    Your notification settings have been updated.
                  </p>
                </div>
              </div>
            )}

            {saveError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Failed to save</p>
                  <p className="mt-0.5 text-xs text-red-600">{saveError}</p>
                </div>
              </div>
            )}

            {/* ── Master toggle ── */}
            <div className="rounded-xl border border-[#C9A84C]/15 bg-[#FDFAF3] p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A84C]/20 bg-white">
                  <Bell size={15} className="text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Master Control</h3>
                  <p className="text-[11px] text-gray-400">
                    Enable or disable all notifications at once.
                  </p>
                </div>
              </div>

              <ToggleRow
                label="All Notifications"
                description={
                  preferences.enabled
                    ? 'Notifications are currently active'
                    : 'All notifications are paused'
                }
                checked={preferences.enabled}
                disabled={savingField !== null && savingField !== 'enabled'}
                saving={savingField === 'enabled'}
                gold
                onChange={() => handleToggle('enabled', preferences.enabled)}
              />
            </div>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Notification types */}
              <Section
                title="Notification Types"
                description="Choose what kinds of notifications to receive"
                icon={Zap}
              >
                {notificationTypes.map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    checked={Boolean(preferences[item.key])}
                    disabled={
                      !preferences.enabled ||
                      (savingField !== null && savingField !== item.key)
                    }
                    saving={savingField === item.key}
                    onChange={() => handleToggle(item.key, Boolean(preferences[item.key]))}
                  />
                ))}
              </Section>

              {/* Delivery channels */}
              <Section
                title="Delivery Channels"
                description="How you want to receive notifications"
                icon={Mail}
              >
                {deliveryChannels.map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    checked={Boolean(preferences[item.key])}
                    disabled={
                      !preferences.enabled ||
                      (savingField !== null && savingField !== item.key)
                    }
                    saving={savingField === item.key}
                    icon={item.icon}
                    onChange={() => handleToggle(item.key, Boolean(preferences[item.key]))}
                  />
                ))}

                {/* Informational note */}
                <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Delivery channels only apply when master notifications are enabled.
                    Individual notification types can still be toggled independently.
                  </p>
                </div>
              </Section>
            </div>

            {/* ── Footer note ── */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-[11px] text-gray-400">
                Changes are saved automatically when you toggle a setting. Some notifications
                may be required for security purposes and cannot be disabled.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};