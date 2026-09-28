import { Tv, CheckCircle, Zap, Shield } from 'lucide-react';
import { HeroSection } from '@/components/vtu-public/HeroSection';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'TV subscriptions: DStv, GOtv and Startimes',
  description: 'Renew or subscribe to DStv, GOtv and Startimes through Acceding Titans, with immediate activation.',
  path: '/vtu/tv',
});

export default function TvPage() {
  const providers = [
    {
      name: 'DStv',
      packages: ['Lite - ₦2,050', 'Compact - ₦7,300', 'Compact Plus - ₦10,350'],
      color: 'border-yellow-200 bg-yellow-50',
    },
    {
      name: 'GOtv',
      packages: ['Max - ₦4,350', 'Plus - ₦3,350', 'Value - ₦2,050'],
      color: 'border-green-200 bg-green-50',
    },
    {
      name: 'Startimes',
      packages: ['Nova - ₦900', 'Smart - ₦1,500', 'Classic - ₦2,500'],
      color: 'border-red-200 bg-red-50',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Subscription',
      description: 'Activate or renew your TV subscription immediately',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Safe and encrypted payment processing',
    },
    {
      icon: CheckCircle,
      title: 'All Packages',
      description: 'Access to all available subscription tiers',
    },
  ];

  return (
    <main className="bg-white">
      {/* Hero */}
      <HeroSection
        title="TV Subscriptions"
        subtitle="Your Entertainment, Anytime"
        description="Subscribe to DStv, GOtv, or Startimes instantly. Enjoy your favorite channels with easy online payment."
        ctaText="Subscribe Now"
        ctaHref="/auth/register"
      />

      {/* TV Providers */}
      <section className="border-b border-gray-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Available Providers</h2>
            <p className="text-gray-600">Choose your favorite TV provider and package</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {providers.map((provider) => (
              <div key={provider.name} className={`rounded-xl border-2 p-8 shadow-sm hover:shadow-md transition-all ${provider.color}`}>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">{provider.name}</h3>
                <ul className="mb-6 space-y-3">
                  {provider.packages.map((pkg) => (
                    <li key={pkg} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      {pkg}
                    </li>
                  ))}
                </ul>
                <button className="w-full rounded-lg bg-red-600 py-2 font-semibold text-white transition-all hover:bg-red-700">
                  Subscribe to {provider.name}
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
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Subscribe with Acceding Titans?</h2>
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

      {/* How to Subscribe */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">How to Subscribe</h2>
          
          <div className="space-y-6">
            {[
              { step: 1, title: 'Choose Provider', desc: 'Select DStv, GOtv, or Startimes' },
              { step: 2, title: 'Select Package', desc: 'Pick your desired subscription tier' },
              { step: 3, title: 'Enter Details', desc: 'Provide your smart card number or IUC' },
              { step: 4, title: 'Make Payment', desc: 'Complete secure payment' },
              { step: 5, title: 'Enjoy TV', desc: 'Your subscription is instantly activated' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">FAQs</h2>

          <div className="space-y-6">
            {[
              {
                q: 'How long does activation take?',
                a: 'Subscription is activated instantly after payment confirmation.',
              },
              {
                q: 'What if I provide wrong IUC?',
                a: 'Please double-check your IUC/Smart card number before payment. Contact support for issues.',
              },
              {
                q: 'Can I renew before expiration?',
                a: 'Yes, you can renew anytime before expiration. The new subscription will be added to remaining days.',
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-bold text-gray-900">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Never Miss Your Favorite Shows</h2>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg shadow-red-600/30"
          >
            Subscribe Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
