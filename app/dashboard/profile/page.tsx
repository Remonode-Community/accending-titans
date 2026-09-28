'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
  UserCircle,
} from 'lucide-react';

import { useProfile } from '@/hooks/useProfile';
import { userService } from '@/services/auth.service';
import {
  NIGERIAN_PHONE_RE,
  type AuthSession,
  type MemberProfile,
  type NotificationPreferences,
  type ProfileBasicInfo,
} from '@/types/profile.types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** The notification_preferences columns the UI exposes. */
type PreferenceKey = Exclude<
  keyof NotificationPreferences,
  'enabled' | 'update_notifications'
>;

const PREFERENCE_ROWS: Array<{
  key: PreferenceKey;
  label: string;
  desc: string;
}> = [
  {
    key: 'transaction_notifications',
    label: 'Transactions',
    desc: 'Payments, transfers and wallet activity',
  },
  {
    key: 'promotion_notifications',
    label: 'Promotions',
    desc: 'Offers, campaigns and rewards',
  },
  {
    key: 'system_notifications',
    label: 'System updates',
    desc: 'Maintenance and platform announcements',
  },
  {
    key: 'alert_notifications',
    label: 'Security alerts',
    desc: 'Login attempts and suspicious activity',
  },
  {
    key: 'email_notifications',
    label: 'Email notifications',
    desc: 'Receive summaries via email',
  },
  {
    key: 'push_notifications',
    label: 'Push notifications',
    desc: 'Instant alerts on your device',
  },
];

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tab = 'details' | 'profile' | 'password' | 'notifications' | 'security';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS: TabConfig[] = [
  { id: 'details', label: 'My details', icon: User },
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'password', label: 'Password', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FieldRowProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, required, hint, children }) => (
  <div className="grid grid-cols-1 gap-3 border-b border-gray-100 py-5 sm:grid-cols-[220px_1fr] sm:items-start">
    <div className="flex-shrink-0">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-[#C9A84C]">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/10';

const SectionHeader: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="mb-2 pt-1">
    <h2 className="text-base font-black text-gray-900">{title}</h2>
    <p className="mt-0.5 text-sm text-gray-400">{description}</p>
  </div>
);

// â”€â”€ Tab panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MyDetailsTab: React.FC<{
  profile: MemberProfile | null;
  isLoading: boolean;
  saveState: SaveState;
  saveError: string | null;
  onSave: (values: ProfileBasicInfo, phone: string) => Promise<boolean>;
}> = ({ profile, isLoading, saveState, saveError, onSave }) => {
  const basic = profile?.basicInfo;
  const savedPhone = profile?.identityInfo.phone ?? '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Seed the inputs once the real profile arrives. Guarded on the id so a later
  // re-render never stomps edits in progress.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!basic || seededFor.current === basic.id) return;
    seededFor.current = basic.id;
    setFirstName(basic.first_name ?? '');
    setLastName(basic.last_name ?? '');
    setEmail(basic.email ?? '');
    setPhone(savedPhone);
    setAddress(basic.address ?? '');
  }, [basic, savedPhone]);

  const phoneError =
    phone.length > 0 && !NIGERIAN_PHONE_RE.test(phone)
      ? 'Enter a valid Nigerian number, e.g. 08012345678'
      : null;

  const isDirty =
    !!basic &&
    (firstName !== (basic.first_name ?? '') ||
      lastName !== (basic.last_name ?? '') ||
      email !== (basic.email ?? '') ||
      phone !== savedPhone ||
      address !== (basic.address ?? ''));

  const handleSave = async () => {
    if (phoneError || !basic) return;
    await onSave(
      {
        ...basic,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        address: address.trim(),
      },
      phone.trim(),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Personal information"
        description="Update your name, contact details, and location."
      />

      <FieldRow label="Full name" required>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </FieldRow>

      <FieldRow label="Email address" required>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            className={`${inputClass} pl-9`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </FieldRow>

      <FieldRow label="Phone number" hint="Used for account recovery">
        <div className="relative">
          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            className={`${inputClass} pl-9 ${phoneError ? 'border-red-300 focus:border-red-400' : ''}`}
            placeholder="08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {phoneError && <p className="mt-1.5 text-xs text-red-500">{phoneError}</p>}
      </FieldRow>

      {/*
        The backend keeps a single free-text `address` column â€” there are no
        separate city / country columns â€” so those are not faked as fields.
      */}
      <FieldRow label="Address" hint="Street, city and state">
        <div className="relative">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="e.g. 12 Broad Street, Lagos"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </FieldRow>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-5">
        {saveError && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={14} />
            {saveError}
          </p>
        )}
        {saveState === 'saved' && !saveError && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check size={14} />
            Changes saved
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saveState === 'saving' || !!phoneError}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveState === 'saving' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saveState === 'saving' ? 'Savingâ€¦' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

const ProfileTab: React.FC<{ profile: MemberProfile | null }> = ({ profile }) => {
  const basic = profile?.basicInfo;
  const meta = profile?.profile;
  const displayName =
    [basic?.first_name, basic?.last_name].filter(Boolean).join(' ') || 'â€”';

  return (
    <div>
      <SectionHeader
        title="Public profile"
        description="This is what members see on your public catalogue page."
      />

      <FieldRow label="Display name">
        <div className="flex items-center gap-3">
          {meta?.photo_url ? (
            <Image
              src={meta.photo_url}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3] text-sm font-black text-[#C9A84C]">
              {(basic?.first_name?.[0] ?? '?').toUpperCase()}
              {(basic?.last_name?.[0] ?? '').toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400">{basic?.email ?? '\u2014'}</p>
          </div>
        </div>
      </FieldRow>

      <FieldRow label="Business / Role" hint="Shown under your name">
        <p className="text-sm text-gray-700">
          {basic?.business_name || 'Not set \u2014 add it under My details'}
        </p>
      </FieldRow>

      <FieldRow label="Membership">
        <p className="text-sm text-gray-700">
          {meta?.current_rank || (meta?.is_titan_member ? 'Titan Member' : 'Member')}
          {meta?.membership_id ? ` \u00b7 ${meta.membership_id}` : ''}
        </p>
      </FieldRow>

      {/*
        This tab used to offer editable photo / bio / website / role fields
        behind a Save button that slept for a second and then claimed
        "Saved" \u2014 nothing was written. Those fields also have no backend
        storage: there is no profile-photo upload endpoint and no bio or
        website columns. Rather than keep a convincing lie, the real stored
        values are shown and the gap is stated plainly.
      */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#C9A84C]/25 bg-[#FDFAF3] p-4">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#B8962E]" />
        <div className="text-sm">
          <p className="font-bold text-gray-900">Not available yet</p>
          <p className="mt-1 text-gray-600">
            Profile photo upload, bio and website need backend storage before
            they can be saved. Your name, email, phone, address and business
            name are fully working under My details.
          </p>
        </div>
      </div>
    </div>
  );
};

const PasswordTab: React.FC<{
  onChangePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => Promise<boolean>;
  saveState: SaveState;
  saveError: string | null;
}> = ({ onChangePassword, saveState, saveError }) => {
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const toggle = (field: keyof typeof show) =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  // Mirrors the backend rule so members get instant feedback, not a 422.
  const weaknesses = useMemo(() => {
    const problems: string[] = [];
    if (next.length < 8) problems.push('at least 8 characters');
    if (!/[a-z]/.test(next) || !/[A-Z]/.test(next)) problems.push('upper and lower case');
    if (!/[0-9]/.test(next)) problems.push('a number');
    if (!/[^A-Za-z0-9]/.test(next)) problems.push('a symbol');
    return problems;
  }, [next]);

  const mismatch = confirm.length > 0 && next !== confirm;

  const canSubmit =
    current.length > 0 &&
    next.length > 0 &&
    confirm.length > 0 &&
    weaknesses.length === 0 &&
    !mismatch &&
    saveState !== 'saving';

  const handleSave = async () => {
    if (!canSubmit) return;
    const ok = await onChangePassword({
      current_password: current,
      password: next,
      password_confirmation: confirm,
    });
    if (ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  };

  const PasswordField = ({
    label,
    field,
    value,
    onChange,
    placeholder,
    autoComplete,
  }: {
    label: string;
    field: keyof typeof show;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    autoComplete: string;
  }) => (
    <FieldRow label={label} required>
      <div>
        <div className="relative">
          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={show[field] ? 'text' : 'password'}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`${inputClass} pl-9 pr-10`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => toggle(field)}
            aria-label={show[field] ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          >
            {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    </FieldRow>
  );

  return (
    <div>
      <SectionHeader
        title="Change password"
        description="Please enter your current password to update it."
      />

      <PasswordField
        label="Current password"
        field="current"
        value={current}
        onChange={setCurrent}
        placeholder="Your current password"
        autoComplete="current-password"
      />
      <PasswordField
        label="New password"
        field="next"
        value={next}
        onChange={setNext}
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm new password"
        field="confirm"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat the new password"
        autoComplete="new-password"
      />

      {next.length > 0 && weaknesses.length > 0 && (
        <p className="pb-4 text-xs text-amber-600">
          Password needs {weaknesses.join(', ')}.
        </p>
      )}
      {mismatch && <p className="pb-4 text-xs text-red-500">Passwords do not match.</p>}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-5">
        {saveError && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={14} />
            {saveError}
          </p>
        )}
        {saveState === 'saved' && !saveError && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check size={14} />
            Password updated
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveState === 'saving' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Key size={14} />
          )}
          {saveState === 'saving' ? 'Updatingâ€¦' : 'Update password'}
        </button>
      </div>
    </div>
  );
};

/**
 * Notification preferences, backed by GET/PUT /api/v1/notifications/preferences.
 *
 * This tab previously held six toggles in local state behind a "Save
 * preferences" button that had no onClick at all â€” nothing was ever persisted
 * and the toggles reset on refresh. The UI keys map 1:1 onto the
 * notification_preferences columns, so the full record is sent on save;
 * `enabled` and `update_notifications` are round-tripped untouched because the
 * UI does not surface them.
 */
const NotificationsTab: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getPreferences();
        if (cancelled) return;
        if (res.success && res.data) setPrefs(res.data);
        else setError(res.message || 'We could not load your preferences.');
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'We could not load your preferences.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key: PreferenceKey) => {
    setSaved(false);
    setError(null);
    setPrefs((p) => (p ? { ...p, [key]: !p[key] } : p));
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      const res = await userService.updatePreferences(prefs);
      if (res.success && res.data) {
        setPrefs(res.data);
        setSaved(true);
      } else {
        // This controller returns its message under `error`, not `message`.
        setError(
          (res as { error?: string }).error ||
            res.message ||
            'We could not save your preferences.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not save your preferences.',
      );
    } finally {
      setSaving(false);
    }
  };

  const Toggle: React.FC<{ active: boolean; onChange: () => void; label: string }> = ({
    active,
    onChange,
    label,
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onChange}
      disabled={!prefs}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: active ? '#C9A84C' : '#e5e7eb' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: active ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-4 py-2" aria-busy="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="font-bold text-gray-900">
            We could not load your preferences
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {error ?? 'Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Notification preferences"
        description="Choose what you're notified about and how."
      />

      <div className="mt-1 divide-y divide-gray-100">
        {PREFERENCE_ROWS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
            </div>
            <Toggle
              active={prefs[key]}
              onChange={() => toggle(key)}
              label={label}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-5">
        {error && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="mr-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check size={14} />
            Preferences saved
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saving ? 'Savingâ€¦' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
};
/**
 * Security settings.
 *
 * Previously this tab rendered three hard-coded sessions (Chrome/Windows in
 * Lagos, Safari/iPhone in Abuja, Firefox/macOS) plus "Enable 2FA", "Revoke" and
 * "Delete account" buttons that had no onClick handlers at all. It now shows the
 * member's real API tokens, can revoke them, and states plainly which features
 * have no backend yet.
 */
const SecurityTab: React.FC = () => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getSessions();
      if (res.success && res.data?.sessions) setSessions(res.data.sessions);
      else setError(res.message || 'We could not load your sessions.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not load your sessions.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (session: AuthSession) => {
    setRevokingId(session.id);
    setError(null);
    try {
      const res = await userService.revokeSession(session.id);
      if (res.success) {
        setRevoked(`Signed out ${session.name} (${session.id}).`);
        setSessions((list) => list.filter((s) => s.id !== session.id));
      } else {
        setError(res.message || 'We could not revoke that session.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not revoke that session.',
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Security settings"
        description="Manage your account security and active sessions."
      />

      {/* 2FA â€” no backend endpoint exists yet */}
      <div className="mt-1 rounded-xl border border-gray-100 bg-gray-50/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#FDFAF3]">
              <Shield size={16} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">
                Two-factor authentication
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Add an extra layer of security to your account.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-400">
            Not available yet
          </span>
        </div>
      </div>

      {/* Active sessions â€” real API tokens */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-black text-gray-900">Active sessions</p>

        {loading ? (
          <div className="space-y-2 rounded-xl border border-gray-200/80 p-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-gray-200/80 px-5 py-6 text-center">
            <p className="text-sm font-semibold text-gray-700">No other sessions</p>
            <p className="mt-1 text-xs text-gray-400">
              This is the only client signed in to your account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {s.name}
                    </p>
                    {s.is_current && (
                      <span className="rounded-full border border-[#C9A84C]/20 bg-[#FDFAF3] px-2 py-0.5 text-[10px] font-semibold text-[#C9A84C]">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {s.last_used_at
                      ? `Last used ${new Date(s.last_used_at).toLocaleString()}`
                      : 'Never used'}
                    {s.created_at
                      ? ` Â· created ${new Date(s.created_at).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>

                {!s.is_current && (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(s)}
                    disabled={revokingId === s.id}
                    className="shrink-0 text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                  >
                    {revokingId === s.id ? 'Revokingâ€¦' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle size={13} />
            {error}
          </p>
        )}
        {revoked && !error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check size={13} />
            {revoked}
          </p>
        )}

        <p className="mt-2 text-xs text-gray-400">
          Sessions are the API clients signed in to your account. Revoking one
          signs that client out immediately.
        </p>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50/60 p-5">
        <p className="text-sm font-black text-red-800">Danger zone</p>
        <p className="mt-0.5 text-xs text-red-500">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 size={12} />
          Manage account deletion
        </Link>
      </div>
    </div>
  );
};
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const {
    profile,
    isLoading,
    loadError,
    saveError,
    saveState,
    saveBasicInfo,
    changePassword,
    resetSaveState,
  } = useProfile();

  // Clear the previous tab's "Saved" / error banner when the user navigates.
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    resetSaveState();
  };

  const handleSaveBasic = async (values: ProfileBasicInfo, phone: string) =>
    saveBasicInfo(values, phone);

  const fullName =
    [profile?.basicInfo.first_name, profile?.basicInfo.last_name]
      .filter(Boolean)
      .join(' ') || 'Your profile';

  const initials =
    ((profile?.basicInfo.first_name?.[0] ?? '') +
      (profile?.basicInfo.last_name?.[0] ?? '')).toUpperCase() || 'AT';

  const tabContent: Record<Tab, React.ReactNode> = {
    details: (
      <MyDetailsTab
        profile={profile}
        isLoading={isLoading}
        saveState={saveState}
        saveError={saveError}
        onSave={handleSaveBasic}
      />
    ),
    profile: <ProfileTab profile={profile} />,
    password: (
      <PasswordTab
        onChangePassword={changePassword}
        saveState={saveState}
        saveError={saveError}
      />
    ),
    notifications: <NotificationsTab />,
    security: <SecurityTab />,
  };

  return (
    <div className="space-y-6">

      {/* â”€â”€ Profile hero card â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        {/* Cover banner */}
        <div className="relative h-28 sm:h-36 bg-gradient-to-br from-[#FDFAF3] via-[#f5efd4] to-[#e8d9a0]">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 80% 50%, #C9A84C 0%, transparent 60%)',
            }}
          />
          <div className="h-[3px] bg-gradient-to-r from-[#C9A84C]/30 via-[#C9A84C] to-[#C9A84C]/30" />
        </div>

        {/* Avatar + info */}
        <div className="relative px-6 pb-6 sm:px-8">
          {/* Avatar — real initials, or the stored photo when there is one */}
          <div className="relative -mt-10 mb-4 inline-block">
            {profile?.profile.photo_url ? (
              <Image
                src={profile.profile.photo_url}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-sm"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#FDFAF3] text-2xl font-black text-[#C9A84C] shadow-sm">
                {initials}
              </div>
            )}
            {profile?.profile.email_verified_at && (
              <div
                title="Email verified"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#C9A84C]"
              >
                <Check size={11} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-gray-900">
                {fullName}
              </h1>
              <p className="mt-0.5 truncate text-sm text-gray-400">
                {profile?.basicInfo.email ?? '—'}
              </p>
            </div>

            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#C9A84C]/30 hover:bg-[#FDFAF3] hover:text-[#C9A84C]">
                <UserCircle size={14} />
                View profile
              </button>
            </div>
          </div>
        </div>

        {/* â”€â”€ Tabs â”€â”€ */}
        <div className="border-t border-gray-100 px-6 sm:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative flex flex-shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'text-[#C9A84C]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  {tab.label}
                  {/* Active underline */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all ${
                      active ? 'bg-[#C9A84C]' : 'bg-transparent group-hover:bg-gray-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* â”€â”€ Tab content â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white px-6 py-6 shadow-sm sm:px-8">
        {loadError ? (
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="font-bold text-gray-900">
                We could not load your profile
              </p>
              <p className="mt-1 text-sm text-gray-600">{loadError}</p>
            </div>
          </div>
        ) : (
          tabContent[activeTab]
        )}
      </div>
    </div>
  );
}
