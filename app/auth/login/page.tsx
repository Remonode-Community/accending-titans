'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Chrome,
  Facebook,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { AuthProtectedRoute } from '@/components/AuthProtectedRoute';
import { loginSchema, type LoginSchema } from '@/utils/validation.utils';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    await login(data);
  };

  return (
    <AuthProtectedRoute requireUnauthenticated={true} redirectTo="/dashboard">
      <div className="relative min-h-screen bg-white flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-12 pb-[env(safe-area-inset-bottom)] overflow-hidden">

        {/* Subtle gold radial glow — barely there */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full bg-[#C9A84C]/[0.06] blur-3xl" />

        <div className="relative w-full max-w-[420px]">

          {/* ── Card — flat/edge-to-edge on mobile, card from sm+ ── */}
          <div className="sm:rounded-2xl sm:border sm:border-gray-100 sm:bg-white sm:shadow-[0_2px_32px_rgba(0,0,0,0.07)] sm:overflow-hidden">

            {/* Signature element: 3px gold gradient top bar (card only) */}
            <div className="hidden sm:block h-[3px] bg-gradient-to-r from-[#C9A84C]/35 via-[#C9A84C] to-[#C9A84C]/35" />

            <div className="px-5 sm:px-8 py-9 sm:py-8">

              {/* ── Header ── */}
              <div className="mb-7 text-center">
                {/* Brand logo */}
                <Image
                  src="/icon.png"
                  alt="Acceding Titans Logo"
                  width={64}
                  height={64}
                  className="mx-auto mb-5 h-14 w-14 rounded-full ring-1 ring-[#C9A84C]/25 shadow-sm sm:h-16 sm:w-16"
                  priority
                />
                <h2 className="text-[21px] font-semibold tracking-tight text-gray-900">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                  Sign in to continue to your account
                </p>
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="
                        w-full rounded-xl border border-gray-200 bg-gray-50
                        py-2.5 pl-9 pr-3.5 text-sm text-gray-900
                        placeholder:text-gray-400
                        focus:outline-none focus:border-[#C9A84C]
                        focus:ring-2 focus:ring-[#C9A84C]/12
                        transition-colors
                      "
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="
                        w-full rounded-xl border border-gray-200 bg-gray-50
                        py-2.5 pl-9 pr-10 text-sm text-gray-900
                        placeholder:text-gray-400
                        focus:outline-none focus:border-[#C9A84C]
                        focus:ring-2 focus:ring-[#C9A84C]/12
                        transition-colors
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me / Forgot password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      {...register('remember_me')}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#C9A84C]"
                    />
                    Remember me
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    mt-1 flex w-full items-center justify-center gap-2
                    rounded-xl py-3 sm:py-[11px] text-sm font-semibold text-white
                    transition-all
                    ${
                      isLoading
                        ? 'cursor-not-allowed bg-[#C9A84C]/55'
                        : 'bg-[#C9A84C] shadow-sm shadow-[#C9A84C]/25 hover:bg-[#B8962E] hover:shadow-md active:scale-[0.99]'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {/* ── Divider ── */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                  or
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* ── Social Buttons ── */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 sm:py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <Chrome size={15} className="text-gray-500" />
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 sm:py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <Facebook size={15} className="text-[#1877F2]" />
                  Facebook
                </button>
              </div>

              {/* ── Register link ── */}
              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold text-[#C9A84C] hover:text-[#B8962E] transition-colors"
                >
                  Create one
                </Link>
              </p>

            </div>
          </div>

          {/* Bottom security note */}
          <p className="mt-5 text-center text-xs text-gray-400">
            Secured with enterprise-grade encryption
          </p>

        </div>
      </div>
    </AuthProtectedRoute>
  );
}