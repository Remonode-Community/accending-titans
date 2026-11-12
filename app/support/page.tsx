'use client';

import { Mail, MessageSquare, Phone, Clock, ArrowRight, LifeBuoy, Sparkles, Shield } from 'lucide-react';
import Link from 'next/link';
import { LandingTopbar } from '@/components/LandingTopbar';
import { Footer } from '@/components/shared/Footer';

export default function SupportPage() {
  return (
    <>
      <LandingTopbar />
      <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative px-5 py-20 lg:px-8 bg-gradient-to-br from-[#C9A84C]/10 via-transparent to-[#C9A84C]/5 border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A84C]/20 mb-6">
            <Sparkles className="text-[#C9A84C]" size={24} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We&apos;re Here to <span className="text-[#C9A84C]">Help</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Get the support you need. Our team is available 24/7 to assist with any questions or issues.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Mail,
                title: 'Email',
                desc: 'Acceding Titans.operations@gmail.com',
                time: 'Response within 2 hours',
              },
              {
                icon: MessageSquare,
                title: 'Live Chat',
                desc: 'Available in app',
                time: 'Response in < 5 minutes',
              },
              {
                icon: Phone,
                title: 'Phone',
                desc: '+1 833 803 2507',
                time: 'Mon-Sun: 9AM - 10PM WAT',
              },
              {
                icon: Clock,
                title: 'Hours',
                desc: 'Available 24/7',
                time: 'Holiday support included',
              },
            ].map((method, idx) => {
              const Icon = method.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                    <Icon className="text-[#C9A84C]" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{method.title}</h3>
                  <p className="text-sm text-gray-700 font-medium mb-2">{method.desc}</p>
                  <p className="text-xs text-gray-500">{method.time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Desk CTA */}
      <section className="px-5 py-20 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 lg:p-12 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A84C]/20 mb-6">
              <LifeBuoy className="text-[#C9A84C]" size={24} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Raise a Support Ticket
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto mb-8">
              Open a ticket in your dashboard and our team will follow up right
              in the conversation thread — with a notification and an email
              every time we reply, so nothing gets lost.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard/support/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#C9A84C]/30 transition-all hover:bg-[#B8962E] sm:w-auto"
              >
                Open a Support Ticket <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard/support"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-[#C9A84C]/40 hover:text-[#C9A84C] sm:w-auto"
              >
                View My Tickets
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              You&apos;ll be asked to sign in first — tickets are tied to your account so we
              can track and resolve them properly.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Link Section */}
      <section className="px-5 py-20 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A84C]/20 mb-4">
                  <Shield className="text-[#C9A84C]" size={24} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Quick Answers Available
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Check our comprehensive FAQ section for instant answers to frequently asked questions about Acceding Titans and how to get the most out of our platform.
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#C9A84C]/30"
                >
                  View FAQs <ArrowRight size={20} />
                </Link>
              </div>

              <div className="space-y-4">
                <Link
                  href="/faq"
                  className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <p className="font-semibold text-gray-900 text-lg">How do I create an account?</p>
                  <p className="text-sm text-gray-500 mt-1">Getting Started</p>
                </Link>
                <Link
                  href="/faq"
                  className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <p className="font-semibold text-gray-900 text-lg">What payment methods are available?</p>
                  <p className="text-sm text-gray-500 mt-1">Transactions & Payments</p>
                </Link>
                <Link
                  href="/faq"
                  className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <p className="font-semibold text-gray-900 text-lg">How do I earn referral rewards?</p>
                  <p className="text-sm text-gray-500 mt-1">Rewards & Referrals</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
