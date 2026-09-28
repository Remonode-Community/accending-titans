import { Smartphone, Wifi, Tv, Receipt, TrendingUp, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { LandingTopbar } from '@/components/LandingTopbar';

export const metadata = buildMetadata({
  title: 'VTU services: airtime, data, TV and bills',
  description: 'Buy airtime, data bundles and TV subscriptions, and pay electricity, water and other bills through Acceding Titans.',
  path: '/vtu',
});

export default function VtuPage() {
  const services = [
    {
      title: 'Airtime Top-up',
      description: 'Instant airtime for all major networks',
      icon: Smartphone,
      href: '/vtu/airtime',
      features: ['All networks', 'Instant delivery', 'Best rates', '24/7 available'],
    },
    {
      title: 'Data Bundles',
      description: 'Fast data for browsing, streaming & gaming',
      icon: Wifi,
      href: '/vtu/data',
      features: ['All providers', 'Various plans', 'Auto-renewal', 'Best prices'],
    },
    {
      title: 'TV Subscriptions',
      description: 'Premium TV channels - DStv, GOtv, Startimes',
      icon: Tv,
      href: '/vtu/tv',
      features: ['All providers', 'All tiers', 'Easy renewal', 'Quick activation'],
    },
    {
      title: 'Bills Payment',
      description: 'Pay electricity, water & other bills online',
      icon: Receipt,
      href: '/vtu/bills',
      features: ['All providers', 'Secure payments', 'Receipts', 'History tracking'],
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Best Rates',
      description: 'Competitive pricing with the best rates in the market',
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Bank-level security for all your transactions',
    },
    {
      icon: Smartphone,
      title: 'Easy to Use',
      description: 'Simple, intuitive interface for quick transactions',
    },
  ];

  return (
    <>
      <LandingTopbar />
      <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative px-5 py-20 lg:px-8 bg-gradient-to-br from-[#C9A84C]/10 via-transparent to-[#C9A84C]/5 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A84C]/20 mb-6">
            <Sparkles className="text-[#C9A84C]" size={24} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Digital Payments Made <span className="text-[#C9A84C]">Easy</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-8">
            Top up airtime, buy data bundles, subscribe to TV, and pay bills - all in one place. With Acceding Titans, your payments are quick, secure, and affordable.
          </p>

          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#C9A84C]/30"
          >
            Get Started <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              All Your Payment <span className="text-[#C9A84C]">Needs</span>
            </h2>
            <p className="text-lg text-gray-600">
              Choose from our wide range of services and complete your transactions instantly
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.href}
                  href={service.href}
                  className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="text-[#C9A84C]" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-[#C9A84C]">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="px-5 py-20 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Ascending <span className="text-[#C9A84C]">Titans?</span>
            </h2>
            <p className="text-lg text-gray-600">
              The best digital payment platform for your transactions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl bg-white border border-gray-200 p-8 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                    <Icon className="text-[#C9A84C]" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-5 py-20 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Make Your First Payment?
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of satisfied users and start enjoying seamless digital payments today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#C9A84C]/30"
            >
              Create Account <ArrowRight size={20} />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#C9A84C] text-[#C9A84C] font-semibold rounded-xl hover:bg-[#C9A84C]/5 transition-all"
            >
              Already a Member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
    </>
  );
}
