'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useFeatureStore } from '@/store/feature.store';
import { birthdayService } from '@/services/birthday.service';

/**
 * Whether the signed-in member has completed the compulsory birthday plan
 * form (the onboarding gate for the Birthdays module).
 *
 * `null` means "not known yet" — no member on the client, or the check still in
 * flight. Callers treat `null` as "not decided".
 */
export function useBirthdayPreferencesComplete(): boolean | null {
  const user = useAuthStore((s) => s.user);
  const birthdaysEnabled = useFeatureStore((s) => (s.features.birthdays ?? true)) !== false;

  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !birthdaysEnabled) {
      // Nothing to owe without a member or without the feature.
      return;
    }

    let cancelled = false;

    birthdayService.getMine().then((res) => {
      if (cancelled) return;
      // Strictly `false`: an API that predates the form omits the flag, and
      // an undefined value must not be read as "the member has not done it".
      setComplete(Boolean(res.success && res.data ? res.data.profile.preferences_complete !== false : true));
    }).catch(() => {
      // Leave it undecided rather than guessing; the page-level gate keeps
      // its own safe default.
      if (!cancelled) setComplete(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user, birthdaysEnabled]);

  if (!user) {
    return null;
  }

  return birthdaysEnabled ? complete : true;
}
