'use client';

import { useCallback, useEffect, useState } from 'react';
import { userService } from '@/services/auth.service';
import { safeSetItem } from '@/utils/safe-storage.utils';
import type {
  ChangePasswordPayload,
  MemberProfile,
  ProfileBasicInfo,
} from '@/types/profile.types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UseProfileResult {
  profile: MemberProfile | null;
  isLoading: boolean;
  loadError: string | null;
  /** Field-level or form-level error from the last save. */
  saveError: string | null;
  saveState: SaveState;
  saveBasicInfo: (values: ProfileBasicInfo, phone: string) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  resetSaveState: () => void;
  refresh: () => Promise<void>;
}

/**
 * Loads and persists the signed-in member's profile.
 *
 * The backend always answers HTTP 200 with `success: false` on failure, so
 * every call here checks `success` and surfaces `message` rather than relying
 * on a rejected promise.
 */
export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const load = useCallback(async (showSpinner = true) => {
    // On the first load both are already in their initial state, so setting
    // them here would only cause a cascading render inside the mount effect.
    if (showSpinner) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const res = await userService.getProfile();
      if (res.success && res.data?.profile) {
        setProfile(res.data.profile);
      } else {
        setLoadError(res.message || 'We could not load your profile.');
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'We could not load your profile.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // isLoading already starts true, so the first load skips the spinner set
    // and nothing is written synchronously here. The lint rule cannot prove
    // that through the async call, hence the targeted disable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
  }, [load]);

  const saveBasicInfo = useCallback(
    async (values: ProfileBasicInfo, phone: string) => {
      setSaveState('saving');
      setSaveError(null);
      try {
        // The phone lives under identityInfo but is edited alongside the basic
        // fields, so it is sent in the same request to avoid a second round-trip.
        const res = await userService.saveProfile({
          basicInfo: values,
          identityInfo: { phone },
        });

        if (res.success && res.data?.profile) {
          setProfile(res.data.profile);
          setSaveState('saved');
          return true;
        }

        setSaveError(res.message || 'We could not save your changes.');
        setSaveState('error');
        return false;
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'We could not save your changes.',
        );
        setSaveState('error');
        return false;
      }
    },
    [],
  );

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setSaveState('saving');
    setSaveError(null);
    try {
      const res = await userService.changePassword(payload);

      if (res.success) {
        // The endpoint revokes every token and issues a new one. Without this
        // the next request would 401 and bounce the member to the login page.
        const token = res.data?.token;
        if (token) safeSetItem('token', token);
        setSaveState('saved');
        return true;
      }

      setSaveError(res.message || 'We could not update your password.');
      setSaveState('error');
      return false;
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'We could not update your password.',
      );
      setSaveState('error');
      return false;
    }
  }, []);

  const resetSaveState = useCallback(() => {
    setSaveState('idle');
    setSaveError(null);
  }, []);

  return {
    profile,
    isLoading,
    loadError,
    saveError,
    saveState,
    saveBasicInfo,
    changePassword,
    resetSaveState,
    refresh: load,
  };
}