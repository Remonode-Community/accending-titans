import { Wifi, CheckCircle, Zap, Shield } from 'lucide-react';
import { HeroSection } from '@/components/vtu-public/HeroSection';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Buy data bundles online',
  description: 'Buy data bundles for MTN, Airtel, Glo and 9mobile through Acceding Titans, with a range of plan sizes and validity periods.',
  path: '/vtu/data',
});

export default function DataPage() {
  const providers = [
    { name: 'MTN', plans: ['500MB - ₦100', '1GB - ₦200', '5GB - ₦1,000'] },
    { name: 'Airtel', plans: ['500MB - ₦100', '1GB - ₦200', '5GB - ₦1,000'] },
    { name: 'Glo', plans: ['500MB - ₦50', '1GB - ₦100', '5GB - ₦500'] },
    { name: '9mobile', plans: ['500MB - ₦100', '1GB - ₦200', '5GB - ₦1,000'] },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Activation',
      description: 'Data is activated immediately after purchase',
    },
    {
      icon: Shield,
      title: 'Best Prices',
      description: 'Guaranteed lowest prices for data bundles',
    },
    {
      icon: CheckCircle,
      title: 'Flexible Plans',
      description: 'Choose from various bundle sizes and validity periods',
    },
  ];

  return (
    <main className="bg-white">
      {/* Hero */}
      <HeroSection
        title="Buy Data Bundles"
        subtitle="Stay Connected"
        description="Get instant data bundles for all networks. Stream, browse, and download without limits. Affordable plans for everyone."
        ctaText="Buy Data Now"
        ctaHref="/auth/register"
      />

      {/* Data Plans */}
      <section className="border-b border-gray-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Available Data Plans</h2>
            <p className="text-gray-600">Choose from our wide range of data bundles</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {providers.map((provider) => (
              <div key={provider.name} className="rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
                <h3 className="mb-4 text-lg font-bold text-gray-900">{provider.name}</h3>
                <ul className="space-y-3">
                  {provider.plans.map((plan) => (
                    <li key={plan} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      {plan}
                    </li>
                  ))}
                </ul>
                <button className="mt-6 w-full rounded-lg bg-red-600 py-2 font-semibold text-white transition-all hover:bg-red-700">
                  Buy {provider.name} Data
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
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Why Choose Acceding Titans for Data?</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-xl bg-white p-8 text-center shadow-sm">
                  <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-gray-900">Everything You Need to Know</h2>
              <ul className="space-y-4">
                {[
                  'Available for all major networks in Nigeria',
                  'Flexible validity periods (daily, weekly, monthly)',
                  'Auto-renewal options available',
                  'No expiration of unused data for most plans',
                  '24/7 customer support',
                  'Instant delivery to your device',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-8">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Pro Tips</h3>
              <ul className="space-y-4 text-sm text-gray-700">
                <li>• Larger bundles offer better value per MB</li>
                <li>• Check validity before purchasing</li>
                <li>• Some plans include WhatsApp/Twitter free</li>
                <li>• Use data rollover to save unused data</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Get Data Now</h2>
          <p className="mb-8 text-gray-600">Join millions of users enjoying fast data bundles on Acceding Titans</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg shadow-blue-600/30"
          >
            Buy Data Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
