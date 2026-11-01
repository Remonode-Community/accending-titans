import { create } from 'zustand';
import { safeSetItem } from '@/utils/safe-storage.utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  data?: unknown;
}

interface UIStore {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modals
  modals: Record<string, Modal>;
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modals
  modals: {},
  openModal: (id, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { id, isOpen: true, data },
      },
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { ...state.modals[id], isOpen: false },
      },
    })),

  closeAllModals: () => set({ modals: {} }),

  isModalOpen: (id) => {
    const state = get();
    return state.modals[id]?.isOpen || false;
  },

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Theme
  theme: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      safeSetItem('theme', theme);
      const root = document.documentElement;
      root.dataset.theme = theme;
      root.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
}));
