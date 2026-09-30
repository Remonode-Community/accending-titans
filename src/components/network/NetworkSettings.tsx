'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, MessageCircle, ShieldAlert } from 'lucide-react';
import { networkService } from '@/services/network.service';
import type { NetworkPreferences } from '@/types/network.types';

/**
 * Consent controls.
 *
 * Both switches default to OFF on the server, so this component only ever shows
 * a member how to opt IN — there is no state where a member is exposed without
 * having chosen to be.
 *
 * `share_whatsapp` is a separate switch from `is_discoverable` deliberately: a
 * member may happily be listed in their circle without being handed out as a
 * phone number to anyone who claims an ask. Collapsing them into one "be
 * discoverable" toggle would make the more dangerous of the two the default.
 *
 * The WhatsApp switch carries an explicit warning because the failure mode is
 * not obvious to a member: a number is released to whoever claims one of their
 * asks, and they cannot see who that was.
 */
export const NetworkSettings = () => {
  const [prefs, setPrefs] = useState<NetworkPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    const res = await networkService.getPreferences();
    if (res.success && res.data) setPrefs(res.data.preferences);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (patch: Partial<NetworkPreferences>) => {
    setSaving(true);
    try {
      const res = await networkService.updatePreferences(patch);
      if (res.success && res.data) setPrefs(res.data.preferences);
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return null;

  const setDiscoverable = (on: boolean) => update({ is_discoverable: on });

  /**
   * Turning sharing ON requires an explicit second step. A single tap on a
   * phone-number toggle is not informed consent, and this is the one control in
   * the app whose consequence the member cannot later inspect or undo for
   * others.
   */
  const setShareWhatsapp = (on: boolean) => {
    if (!on) {
      update({ share_whatsapp: false });
      setConfirming(false);
      return;
    }

    setConfirming(true);
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-[#C9A84C]" />
        <h3 className="text-sm font-bold text-gray-900">Your visibility</h3>
      </div>

      <div className="mt-4 space-y-3">
        <Toggle
          label="Appear in members' circles"
          description="Lets other members find you by trade, city and when you joined. You will appear in their circle and on your ask board."
          checked={prefs.is_discoverable}
          disabled={saving}
          onChange={setDiscoverable}
          icon={prefs.is_discoverable ? Eye : EyeOff}
        />

        <Toggle
          label="Share my WhatsApp number"
          description="When somebody responds to one of your asks, they can see your number."
          checked={prefs.share_whatsapp}
          disabled={saving}
          onChange={setShareWhatsapp}
          icon={MessageCircle}
        />
      </div>

      {prefs.share_whatsapp && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          Your number is shared with whoever responds to your asks. You can turn
          this off at any time and it stops immediately.
        </p>
      )}

      {/* Second-step confirmation for the one irreversible-feeling control. */}
      {confirming && !prefs.share_whatsapp && (
        <div className="mt-3 rounded-xl border border-[#C9A84C]/40 bg-[#FDFAF3] p-4">
          <p className="text-sm font-bold text-gray-900">
            Share your number when someone responds?
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
            Any member who responds to one of your asks will be able to see your
            WhatsApp number and contact you directly. You will not be told who
            they are. Turning this off later stops future sharing but cannot
            recall a number already seen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                update({ share_whatsapp: true });
                setConfirming(false);
              }}
              className="rounded-lg bg-[#C9A84C] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#B8962E] disabled:opacity-50"
            >
              Yes, share it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Keep it private
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Toggle = ({
  label,
  description,
  checked,
  disabled,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />

    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
    </div>

    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-[#C9A84C]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);
