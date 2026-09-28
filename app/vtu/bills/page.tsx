import { Receipt, CheckCircle, Zap, Shield } from 'lucide-react';
import { HeroSection } from '@/components/vtu-public/HeroSection';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Pay bills online',
  description: 'Pay electricity, water and other utility bills through Acceding Titans, with immediate confirmation.',
  path: '/vtu/bills',
});

export default function BillsPage() {
  const billTypes = [
    { name: 'Electricity', icon: '⚡', desc: 'Pay NERC electricity bills' },
    { name: 'Water', icon: '💧', desc: 'Pay water supply bills' },
    { name: 'Internet', icon: '🌐', desc: 'Pay ISP bills' },
    { name: 'Insurance', icon: '🛡️', desc: 'Pay insurance premiums' },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Payment',
      description: 'Bill payments processed immediately',
    },
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Protected with advanced encryption',
    },
    {
      icon: CheckCircle,
      title: 'Receipt & History',
      description: 'Keep track of all your bill payments',
    },
  ];

  return (
    <main className="bg-white">
      {/* Hero */}
      <HeroSection
        title="Pay Bills Online"
        subtitle="Easy & Convenient"
        description="Pay all your utility bills in one place. Fast, secure, and hassle-free payment for electricity, water, internet, and more."
        ctaText="Pay Bill Now"
        ctaHref="/auth/register"
      />

      {/* Bill Types */}
      <section className="border-b border-gray-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Supported Bill Types</h2>
            <p className="text-gray-600">Pay all your bills in one convenient place</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {billTypes.map((bill) => (
              <div key={bill.name} className="rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-all">
                <div className="mb-3 text-4xl">{bill.icon}</div>
                <h3 className="mb-2 font-bold text-gray-900">{bill.name}</h3>
                <p className="text-sm text-gray-600">{bill.desc}</p>
                <button className="mt-4 w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700">
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Pay with Acceding Titans?</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-xl bg-white p-8 text-center shadow-sm">
                  <div className="mb-4 inline-flex rounded-lg bg-red-50 p-3">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Simple Payment Process</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: 1, title: 'Select Bill Type', desc: 'Choose which bill to pay' },
              { num: 2, title: 'Enter Amount', desc: 'Input the payment amount' },
              { num: 3, title: 'Confirm & Pay', desc: 'Complete payment instantly' },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white">
                  {item.num}
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">Our Features</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {[
              '✓ Multiple bill types supported',
              '✓ Instant payment confirmation',
              '✓ Digital receipts emailed to you',
              '✓ Complete payment history',
              '✓ 24/7 customer support',
              '✓ No hidden charges',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-white p-4">
                <span className="text-lg">{feature.split('✓')[0]}✓</span>
                <span className="text-gray-700">{feature.split('✓')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Pay Your Bills Today</h2>
          <p className="mb-8 text-gray-600">Make bill payments easy and convenient with Acceding Titans</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg shadow-red-600/30"
          >
            Start Paying Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
