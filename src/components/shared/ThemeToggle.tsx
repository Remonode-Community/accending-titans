'use client';

import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const savedTheme = document.documentElement.dataset.theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={`flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 ${
        compact ? 'p-2' : ''
      }`}
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon size={16} className="text-[#C9A84C]" aria-hidden="true" />
      ) : (
        <Sun size={16} className="text-[#C9A84C]" aria-hidden="true" />
      )}
      {!compact && <span className="hidden sm:inline">{theme}</span>}
    </button>
  );
}
