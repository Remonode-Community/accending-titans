import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '@/types/api.types';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/utils/safe-storage.utils';
import { cleanupIdempotencyOnLogout } from '@/utils/idempotency-maintenance.utils';

interface PINStatus {
  has_pin: boolean;
  is_locked: boolean;
  failed_attempts?: number;
  remaining_seconds?: number;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pinStatus: PINStatus | null;
  activeRole: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerificationCooldown: number;
  isHydrated: boolean;
  
  setUser: (user: User | null) => void;
  patchUser: (partial: Partial<User>) => void;
  setAuthToken: (token: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPinStatus: (status: PINStatus | null) => void;
  setActiveRole: (role: string) => void;
  setEmailVerificationCooldown: (seconds: number) => void;
  setPhoneVerified: (verified: boolean) => void;
  setIsHydrated: (hydrated: boolean) => void;
  getPrimaryRole: (roles?: string[]) => string | null;
  logout: () => void;
  reset: () => void;
}

// Create storage with safe fallback for private mode/mobile Safari
const getStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  
  // Use safe storage wrapper that handles mobile Safari private mode
  return createJSONStorage(() => ({
    getItem: (key: string) => {
      try {
        const value = safeGetItem(key);
        return value;
      } catch (e) {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        safeSetItem(key, value);
      } catch (e) {
        // Silent fail
      }
    },
    removeItem: (key: string) => {
      try {
        safeRemoveItem(key);
      } catch (e) {
        // Silent fail
      }
    },
  }));
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pinStatus: null,
      activeRole: null,
      isEmailVerified: false,
      isPhoneVerified: false,
      emailVerificationCooldown: 0,
      isHydrated: false,

      setUser: (user) => {
        // Determine primary role for activeRole
        let primaryRole: string | null = null;
        if (user?.roles) {
          if (user.roles.includes('admin')) {
            primaryRole = 'admin';
          } else if (user.roles.includes('agent')) {
            primaryRole = 'agent';
          } else {
            primaryRole = user.roles[0] || null;
          }
        }

        set({
          user,
          isAuthenticated: !!user,
          error: null,
          isEmailVerified: user?.isEmailVerified || false,
          isPhoneVerified: user?.isPhoneVerified || false,
          // Set activeRole to primary role (admin > agent > customer/user)
          activeRole: primaryRole,
        });
      },

      /**
       * Merge fields into the current user WITHOUT setUser's side effects.
       * setUser recomputes `activeRole` from the role list, which would kick a
       * member out of a manually chosen role; this only touches the fields it
       * is given. Used by the profile photo/cover uploads so every screen that
       * reads `user` (dashboard header, topbar) shows the new image immediately
       * instead of waiting for the next full-page refresh.
       */
      patchUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setAuthToken: (token) => {
        if (typeof window !== 'undefined') {
          safeSetItem('token', token);
        }
      },

      setIsLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setPinStatus: (status) => set({ pinStatus: status }),

      setActiveRole: (role) => set({ activeRole: role }),

      setEmailVerificationCooldown: (seconds) => set({ emailVerificationCooldown: seconds }),

      setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),

      getPrimaryRole: (roles?: string[]) => {
        const rolesToCheck = roles || [];
        // Order of priority: admin > agent > customer/user
        if (rolesToCheck.includes('admin')) return 'admin';
        if (rolesToCheck.includes('agent')) return 'agent';
        return rolesToCheck.find((r) => r === 'customer' || r === 'user') || rolesToCheck[0] || null;
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          safeRemoveItem('token');
          // Clear all auth-related localStorage keys
          safeRemoveItem('auth-store');
          // Clear idempotency keys on logout
          cleanupIdempotencyOnLogout();
        }
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          pinStatus: null,
          activeRole: null,
          isEmailVerified: false,
          isPhoneVerified: false,
          emailVerificationCooldown: 0,
        });
      },

      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          pinStatus: null,
          activeRole: null,
          isEmailVerified: false,
          isPhoneVerified: false,
          emailVerificationCooldown: 0,
        });
      },
    }),
    {
      name: 'auth-store',
      storage: getStorage(),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        pinStatus: state.pinStatus,
        activeRole: state.activeRole,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark store as hydrated after persistence middleware restores state
        if (state) {
          // `isEmailVerified` / `isPhoneVerified` are intentionally not
          // persisted (they go stale the moment an address changes), so
          // rehydration otherwise leaves them at `false` even when the
          // restored `user` says verified. Re-align them with the restored
          // user immediately, so no guard can read a false negative during
          // the window before AuthInitializer's API refresh lands — that
          // disagreement is what used to bounce members between /dashboard
          // and /auth/verify-email.
          state.isEmailVerified = state.user?.isEmailVerified || false;
          state.isPhoneVerified = state.user?.isPhoneVerified || false;
          state.isHydrated = true;
        }
      },
    }
  )
);
