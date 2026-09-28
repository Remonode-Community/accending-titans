import { Smartphone, CheckCircle, Zap, Shield } from 'lucide-react';
import { HeroSection } from '@/components/vtu-public/HeroSection';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Buy airtime online',
  description: 'Buy airtime for MTN, Airtel, Glo and 9mobile through Acceding Titans, with immediate delivery at competitive rates.',
  path: '/vtu/airtime',
});

export default function AirtimePage() {
  const networks = [
    { name: 'MTN', color: 'bg-yellow-50 border-yellow-200', logo: '🟨' },
    { name: 'Airtel', color: 'bg-red-50 border-red-200', logo: '🔴' },
    { name: 'Glo (Globacom)', color: 'bg-green-50 border-green-200', logo: '🟢' },
    { name: '9mobile', color: 'bg-orange-50 border-orange-200', logo: '🟠' },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Airtime delivered to your phone within seconds',
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Your transactions are protected with bank-level encryption',
    },
    {
      icon: CheckCircle,
      title: 'Competitive Rates',
      description: 'Get the best airtime prices without any hidden charges',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Select Network',
      description: 'Choose your preferred network provider',
    },
    {
      number: 2,
      title: 'Enter Amount',
      description: 'Specify the amount of airtime you want to buy',
    },
    {
      number: 3,
      title: 'Confirm Details',
      description: 'Verify your phone number and payment details',
    },
    {
      number: 4,
      title: 'Get Airtime',
      description: 'Airtime is delivered instantly to your phone',
    },
  ];

  return (
    <main className="bg-white">
      {/* Hero */}
      <HeroSection
        title="Buy Airtime Online"
        subtitle="Fast, Secure & Affordable"
        description="Get instant airtime for all major networks in Nigeria. No waiting, no hassle, just reliable service."
        ctaText="Buy Airtime Now"
        ctaHref="/auth/register"
      />

      {/* Supported Networks */}
      <section className="border-b border-gray-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Supported Networks</h2>
            <p className="text-gray-600">We support all major telecommunications networks in Nigeria</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {networks.map((network) => (
              <div key={network.name} className={`rounded-lg border-2 p-8 text-center transition-all hover:shadow-md ${network.color}`}>
                <div className="mb-3 text-4xl">{network.logo}</div>
                <h3 className="font-bold text-gray-900">{network.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Buy From Acceding Titans?</h2>
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-600">Simple 4-step process to get your airtime</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-red-600 to-transparent md:block" style={{ left: '50%' }} />
                )}

                <div className="relative bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'How long does it take to receive airtime?',
                a: 'Airtime is delivered instantly to your phone, usually within seconds of completing your transaction.',
              },
              {
                q: 'What networks do you support?',
                a: 'We support all major networks: MTN, Airtel, Globacom (Glo), and 9mobile.',
              },
              {
                q: 'Are there any hidden charges?',
                a: 'No. The price you see is the price you pay. No hidden fees or surprise charges.',
              },
              {
                q: 'Is my payment information secure?',
                a: 'Yes. We use bank-level encryption and secure payment gateways to protect your information.',
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-bold text-gray-900">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Ready to Buy Airtime?</h2>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg shadow-red-600/30"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
