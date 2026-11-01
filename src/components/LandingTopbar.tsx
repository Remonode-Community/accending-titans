'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LogOut, LayoutDashboard, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

/**
 * LandingTopbar Component
 * 
 * Shows different navigation based on authentication state:
 * - Unauthenticated: Login and Sign Up buttons
 * - Authenticated: User name, profile menu with dashboard and logout
 */
export function LandingTopbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Acceding Titans Logo" width={48} height={48} />
          <span className="text-2xl font-black tracking-tight text-white">Acceding Titans</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/85 lg:flex">
          <a href="#how-it-works" className="hover:text-[#C9A84C] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#C9A84C] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[#C9A84C] transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-[#C9A84C] transition-colors">Testimonials</a>
          <a href="#stats" className="hover:text-[#C9A84C] transition-colors">Stats</a>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          {isAuthenticated && user ? (
            // Authenticated user menu
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <div className="h-8 w-8 rounded-full bg-[#c9a84c] flex items-center justify-center text-xs font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <span className="hidden sm:inline">{user.first_name}</span>
                <ChevronDown size={16} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-900 border border-white/10 shadow-xl z-50">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-t-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-white/10 rounded-b-lg transition disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Unauthenticated user buttons
            <>
              <Link
                href="/auth/login"
                className="hidden rounded-xl border border-[#C9A84C]/50 px-7 py-3 text-sm font-bold text-white transition hover:bg-[#C9A84C]/10 sm:inline-flex"
              >
                Login
              </Link>

              <Link
                href="/auth/register"
                className="rounded-xl bg-[#C9A84C] px-4 py-3 sm:px-6 text-sm font-black text-white shadow-lg shadow-[#C9A84C]/30 transition hover:bg-[#B8962E] flex items-center justify-center sm:justify-start gap-2"
              >
                <UserPlus size={20} className="sm:hidden" />
                <span className="hidden sm:inline">Create Account</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
