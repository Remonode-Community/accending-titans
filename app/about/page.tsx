'use client';

import {
  Users,
  Target,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Store,
  Briefcase,
  Star,
  BadgeCheck,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingTopbar } from '@/components/LandingTopbar';
import { Footer } from '@/components/shared/Footer';

export default function AboutPage() {
  return (
    <>
      <LandingTopbar />
      <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-16 sm:pb-20 md:pb-28">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/10 via-transparent to-[#C9A84C]/5" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-gray-50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
              Building the Future of Business
              <span className="block text-[#C9A84C] mt-2">Networking and Growth</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed max-w-2xl">
              We're creating the world's most trusted platform where entrepreneurs, business owners, and professionals connect, showcase their expertise, and grow together.
            </p>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="px-5 py-20 lg:px-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">What guides everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Community First',
                desc: 'We build for our members. Their success is our success. Every feature, every decision prioritizes community value.',
              },
              {
                icon: Sparkles,
                title: 'Authentic Growth',
                desc: 'We believe in real connections and sustainable business growth. No shortcuts, no superficial metrics—just genuine opportunity.',
              },
              {
                icon: Shield,
                title: 'Trust & Transparency',
                desc: 'Your data is sacred. We maintain highest standards of security, privacy, and transparent communication with our community.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white p-8 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-[#C9A84C]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                From Idea to
                <span className="block text-[#C9A84C]">Community Movement</span>
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  In 2024, our founders observed a critical gap in Africa's business ecosystem. Talented entrepreneurs were struggling to find reliable networks, lacking visibility for their products, and missing opportunities for meaningful collaboration.
                </p>
                <p>
                  They envisioned a platform where any business owner—regardless of size or location—could access a thriving community of like-minded professionals, showcase their work, and unlock real growth opportunities.
                </p>
                <p>
                  What started as a simple idea has transformed into a thriving community of 10,000+ entrepreneurs across Africa. Every day, our members are making meaningful connections, closing deals, and building sustainable businesses together.
                </p>
                <p>
                  Today, we're not just building a platform—we're building a movement for entrepreneurial empowerment.
                </p>
              </div>
            </div>

     
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-5 py-20 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Community?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Built for real entrepreneurs who want real results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Vetted Members',
                desc: 'Every member is verified. You\'re networking with serious entrepreneurs, not tire-kickers.',
              },
              {
                icon: Store,
                title: 'Instant Visibility',
                desc: 'Your business catalogue reaches 10K+ qualified members actively looking for products and services.',
              },
              {
                icon: TrendingUp,
                title: 'Real Opportunities',
                desc: 'Referrals, partnerships, job openings, and collaborations—tangible growth for your business.',
              },
              {
                icon: Zap,
                title: 'Organized Platform',
                desc: 'Intuitive interface designed specifically for business networking. No clutter, no noise.',
              },
              {
                icon: Award,
                title: 'Member Recognition',
                desc: 'Birthday rewards, featured profiles, and recognition badges keep your business top-of-mind.',
                column: true,
              },
              {
                icon: Heart,
                title: 'Community Support',
                desc: 'Active community forums, expert guidance, and member-to-member support 24/7.',
              },
              {
                icon: MessageSquare,
                title: 'Direct Connection',
                desc: 'WhatsApp integration and in-app messaging for seamless professional communication.',
              },
              {
                icon: Globe,
                title: 'Growth Analytics',
                desc: 'Track your visibility, referrals, and ROI with detailed member analytics dashboards.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership */}
      {/* <section className="bg-gray-50/50 px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our <span className="text-[#c9a84c]">Leadership</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Chisom Obi',
                title: 'CEO & Co-Founder',
                bio: 'Former fintech executive with 10+ years of experience in digital payments.',
              },
              {
                name: 'Adebayo Adeyemi',
                title: 'CTO & Co-Founder',
                bio: 'Software engineer passionate about building scalable financial systems.',
              },
              {
                name: 'Nkechi Ijeoma',
                title: 'COO',
                bio: 'Operations expert focused on customer experience and team growth.',
              },
              {
                name: 'Tunde Akintola',
                title: 'Head of Compliance',
                bio: 'Regulatory specialist ensuring Acceding Titans meets all compliance standards.',
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-6 text-center hover:shadow-sm transition"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#c9a84c] to-[#a0101a] rounded-full mx-auto mb-4" />
                <h3 className="font-semibold text-sm mb-1 text-gray-900">{member.name}</h3>
                <p className="text-xs text-[#c9a84c] font-semibold mb-3">{member.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Timeline */}
      {/* <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our <span className="text-[#c9a84c]">Journey</span>
          </h2>

          <div className="space-y-8">
            {[
              {
                year: '2023 Q1',
                title: 'Acceding Titans Founded',
                desc: 'Three passionate founders come together with a vision to revolutionize African fintech.',
              },
              {
                year: '2023 Q3',
                title: 'MVP Launch',
                desc: 'Acceding Titans officially launches with airtime purchase and data bundles.',
              },
              {
                year: '2024 Q1',
                title: 'Expansion',
                desc: 'Added bill payments, TV subscriptions, and wallet funding services.',
              },
              {
                year: '2024 Q3',
                title: '50K Users Milestone',
                desc: 'Reached 50,000 active users and processed ₦1 billion in transactions.',
              },
              {
                year: '2025 Q1',
                title: 'Virtual Cards Launch',
                desc: 'Introduced virtual dollar cards for secure online shopping.',
              },
              {
                year: '2025 Q3',
                title: 'Multi-Currency Support',
                desc: 'Launched multi-currency accounts enabling global transactions.',
              },
            ].map((event, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-[#c9a84c] rounded-full" />
                  {idx !== 5 && <div className="w-1 h-20 bg-gray-300 mt-2" />}
                </div>
                <div className="pb-8">
                  <p className="text-xs font-semibold text-[#c9a84c] mb-2">{event.year}</p>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Our Impact */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#C9A84C]">Mission & Impact</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Creating lasting change in African entrepreneurship</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'Entrepreneur Empowerment',
                desc: 'We level the playing field. Giving small business owners access to the same networking and visibility tools as large corporations.',
              },
              {
                icon: Globe,
                title: 'Economic Growth',
                desc: 'Supporting sustainable business growth across Africa. When our members succeed, local economies grow stronger.',
              },
              {
                icon: Heart,
                title: 'Community Building',
                desc: 'Beyond transactions, we foster genuine relationships. Real friendships, real partnerships, real community.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white p-8 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-[#C9A84C]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Careers */}
      {/* <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-[#c9a84c]/20 bg-gradient-to-r from-[#c9a84c] to-[#a0101a] p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Join Our Team</h2>
                <p className="text-white/90 mb-6 text-sm">
                  We're looking for passionate, talented individuals who share our vision of
                  revolutionizing fintech in Africa. If you're ready to make an impact, we'd
                  love to hear from you.
                </p>
                <Link
                  href="mailto:careers@Acceding Titans.com"
                  className="inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#9b111e] transition hover:bg-white/90"
                >
                  Explore Opportunities
                </Link>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-white text-sm">Open Positions:</p>
                <ul className="space-y-3 text-white/90 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Software Engineers (Backend, Frontend, Mobile)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Product Managers</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Customer Success Specialists</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Marketing & Growth Specialists</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="bg-white px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Whether you're an entrepreneur looking for growth, a business owner seeking visibility, or a professional ready to network—we have a membership tier perfect for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#C9A84C]/30"
            >
              Get Started Now <ArrowRight size={20} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#C9A84C] text-[#C9A84C] font-semibold rounded-xl hover:bg-[#C9A84C]/5 transition-all"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Questions about our community? We're here to help.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { label: 'Email', value: 'support@community.com', Icon: Mail },
              { label: 'Phone', value: '+1 (555) 123-4567', Icon: Phone },
              { label: 'Location', value: 'Lagos, Nigeria', Icon: MapPin },
            ].map((contact, idx) => {
              const IconComponent = contact.Icon;
              return (
                <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-8 text-center hover:shadow-lg hover:border-[#C9A84C]/30 transition-all">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-[#C9A84C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">{contact.label}</p>
                  <p className="font-semibold text-gray-900">{contact.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </main>
    </>
  );
}
