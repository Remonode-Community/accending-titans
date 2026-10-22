'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Shield,
  Bell,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/utils/toast.utils';

// ─── Types ──────────────────────────────────────────────────────────────

interface AdminSettings {
  general: {
    platform_name: string;
    support_email: string;
    support_phone: string;
    default_currency: string;
    timezone: string;
    maintenance_mode: boolean;
  };
  security: {
    require_email_verification: boolean;
    require_phone_verification: boolean;
    max_login_attempts: number;
    session_timeout_minutes: number;
    two_factor_required: boolean;
    pin_required_for_transactions: boolean;
  };
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    admin_email_alerts: boolean;
    low_balance_threshold: number;
  };
}

// ─── Default Settings ───────────────────────────────────────────────────

const DEFAULT_SETTINGS: AdminSettings = {
  general: {
    platform_name: 'Acceding Titans',
    support_email: 'support@acceding-titans.com',
    support_phone: '+2348000000000',
    default_currency: 'NGN',
    timezone: 'Africa/Lagos',
    maintenance_mode: false,
  },
  security: {
    require_email_verification: true,
    require_phone_verification: true,
    max_login_attempts: 5,
    session_timeout_minutes: 60,
    two_factor_required: false,
    pin_required_for_transactions: true,
  },
  notifications: {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    admin_email_alerts: true,
    low_balance_threshold: 10000,
  },
};

// ─── Section Config ─────────────────────────────────────────────────────

interface SectionConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'general', label: 'General', description: 'Platform name, support info, and regional settings', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'security', label: 'Security', description: 'Authentication, verification, and session policies', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: 'notifications', label: 'Notifications', description: 'Email, push, SMS, and admin alert preferences', icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-50' },
];

// ─── Helper ─────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        // Simulate API call - replace with actual service call
        await new Promise((r) => setTimeout(r, 800));
        // In production: const response = await adminService.getSettings();
        setSettings(DEFAULT_SETTINGS);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Using defaults.');
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) loadSettings();
  }, [isAdmin]);

  const handleChange = (path: string, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev };
      setNestedValue(updated, path, value);
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setError('');

      // Simulate API call - replace with actual service call
      await new Promise((r) => setTimeout(r, 1500));
      // In production: await adminService.updateSettings(settings);

      setSuccessMessage('Settings saved successfully');
      Toast.success('Settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
      Toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  // ─── Render helpers ─────────────────────────────────────────────────

  const renderTextField = (
    path: string,
    label: string,
    placeholder: string,
    type: string = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const value = getNestedValue(settings, path);

    if (options) {
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{label}</label>
          <select
            value={value}
            onChange={(e) => handleChange(path, e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'boolean') {
      return (
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(path, e.target.checked)}
              className="sr-only peer"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#C9A84C] peer-checked:after:translate-x-full" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
        </label>
      );
    }

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleChange(path, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
        />
      </div>
    );
  };

  const renderNumberField = (path: string, label: string, placeholder: string, min?: number, max?: number, step?: number) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <input
        type="number"
        value={getNestedValue(settings, path)}
        onChange={(e) => handleChange(path, Number(e.target.value))}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/10"
      />
    </div>
  );

  // ─── Section Content ────────────────────────────────────────────────

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-5">
            {renderTextField('general.platform_name', 'Platform Name', 'Your platform name')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderTextField('general.support_email', 'Support Email', 'support@example.com')}
              {renderTextField('general.support_phone', 'Support Phone', '+2348000000000')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderTextField('general.default_currency', 'Default Currency', 'NGN', 'text', [
                { value: 'NGN', label: 'NGN - Nigerian Naira' },
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'GBP', label: 'GBP - British Pound' },
                { value: 'EUR', label: 'EUR - Euro' },
              ])}
              {renderTextField('general.timezone', 'Timezone', 'Africa/Lagos', 'text', [
                { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
                { value: 'Africa/Accra', label: 'Africa/Accra (GMT)' },
                { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
                { value: 'America/New_York', label: 'America/New_York (EST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
              ])}
            </div>
            {renderTextField('general.maintenance_mode', 'Maintenance Mode', '', 'boolean')}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Verification Requirements</p>
              <p className="text-xs text-gray-500 mb-4">Configure what users need to verify before using the platform</p>
              <div className="space-y-3">
                {renderTextField('security.require_email_verification', 'Require Email Verification', '', 'boolean')}
                {renderTextField('security.require_phone_verification', 'Require Phone Verification', '', 'boolean')}
                {renderTextField('security.two_factor_required', 'Require Two-Factor Authentication (2FA)', '', 'boolean')}
                {renderTextField('security.pin_required_for_transactions', 'Require PIN for Transactions', '', 'boolean')}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderNumberField('security.max_login_attempts', 'Max Login Attempts', '5', 1, 20)}
              {renderNumberField('security.session_timeout_minutes', 'Session Timeout (minutes)', '60', 5, 1440)}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Delivery Channels</p>
              <p className="text-xs text-gray-500 mb-4">Configure which notification channels are enabled</p>
              <div className="space-y-3">
                {renderTextField('notifications.email_notifications', 'Enable Email Notifications', '', 'boolean')}
                {renderTextField('notifications.push_notifications', 'Enable Push Notifications', '', 'boolean')}
                {renderTextField('notifications.sms_notifications', 'Enable SMS Notifications', '', 'boolean')}
                {renderTextField('notifications.admin_email_alerts', 'Admin Email Alerts', '', 'boolean')}
              </div>
            </div>
            {renderNumberField('notifications.low_balance_threshold', 'Low Balance Alert Threshold (₦)', '10000', 0)}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
            <Settings className="h-3.5 w-3.5 text-[#C9A84C]" />
            System Configuration
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Admin Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Configure platform settings, security policies, and notification preferences.
          </p>
        </div>

        {/* ── Success / Error Messages ────────────────────── */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-semibold text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && !successMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* ── Sidebar Navigation ─────────────────────────── */}
          <div className="w-full shrink-0 lg:w-64">
            <nav className="space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#C9A84C] text-white shadow-lg shadow-[#C9A84C]/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-white' : 'text-gray-400'}
                    />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── Main Content ──────────────────────────────── */}
          <div className="flex-1">
            <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {/* Section Header */}
              {SECTIONS.filter((s) => s.id === activeSection).map((section) => {
                const Icon = section.icon;
                return (
                  <CardHeader key={section.id}>
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl ${section.bgColor} p-3`}>
                        <Icon size={22} className={section.color} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900">{section.label}</h2>
                        <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                );
              })}

              <CardBody>
                <div className="space-y-6">
                  {renderSectionContent()}

                  {/* ── Save Button ──────────────────────────── */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <p className="text-xs text-gray-400">
                      Changes are applied immediately after saving.
                    </p>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
