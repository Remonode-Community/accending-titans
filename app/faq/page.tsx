'use client';

import { ChevronDown, Search, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LandingTopbar } from '@/components/LandingTopbar';
import { Footer } from '@/components/shared/Footer';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create a community account?',
        a: 'Visit our website or download our app, click "Create Account", fill in your details, and verify your email and phone number. The process takes just 5 minutes.',
      },
      {
        q: 'What membership tier should I choose?',
        a: 'Regular ($2,000/month) for basic access, VIP ($3,500/month) for enhanced visibility, or VVIP ($5,000/month) for premium features including video ads and analytics.',
      },
      {
        q: 'Is there an age requirement?',
        a: 'Yes, you must be at least 18 years old to join our community platform.',
      },
      {
        q: 'Can I change my membership tier?',
        a: 'Yes, you can upgrade or downgrade your membership anytime. Changes take effect in your next billing cycle.',
      },
    ],
  },
  {
    category: 'Business Networking',
    questions: [
      {
        q: 'How do I create my business profile?',
        a: 'After registration, go to your profile and add your business information, photos, services, and products. VIP members can list up to 5 products; VVIP members have unlimited listings.',
      },
      {
        q: 'How many people can see my listing?',
        a: 'All 10,000+ active community members can discover your business catalogue. VIP and VVIP members get featured placements and higher visibility.',
      },
      {
        q: 'Can I advertise my business?',
        a: 'Yes! Use our advertising platform to promote with text, images, and short videos. VVIP members get 5-minute video ads and custom profile designs.',
      },
    ],
  },
  {
    category: 'Messaging & Collaboration',
    questions: [
      {
        q: 'How do I connect with other members?',
        a: 'Browse profiles, send direct messages via WhatsApp or in-app chat, and join community discussions to build genuine business relationships.',
      },
      {
        q: 'Are there any communication guidelines?',
        a: 'Yes, all communication must be professional and respectful. We have zero tolerance for harassment or fraudulent behavior.',
      },
      {
        q: 'Can I export my contacts?',
        a: 'You can save contact information from member profiles. However, member data is protected under our privacy policy.',
      },
    ],
  },
  {
    category: 'Referrals & Rewards',
    questions: [
      {
        q: 'How do I earn referral bonuses?',
        a: 'Share your unique referral link. When someone joins through your link and pays their first membership fee, you earn commission based on the tier they choose.',
      },
      {
        q: 'Do I get birthday rewards?',
        a: 'Yes! In your birthday month, members with 8 or more months of active subscription receive a gift from a fellow member\u2019s business; newer members get a shoutout. Your network can also plan a surprise on your Birthdays page.',
      },
      {
        q: 'How are rewards paid?',
        a: 'Referral and reward bonuses are credited to your account wallet. You can withdraw them or use them to pay future membership fees.',
      },
    ],
  },
  {
    category: 'Community Features',
    questions: [
      {
        q: 'What is the job opportunities section?',
        a: 'Members can post and find gigs, freelance work, and job opportunities. It\'s a great way to expand your business and connect with talent.',
      },
      {
        q: 'How do I report inappropriate behavior?',
        a: 'Use the report function on any profile or message. Our moderation team reviews reports within 24 hours and takes appropriate action.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes! We use bank-level encryption, two-factor authentication, and regular security audits to protect your information.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>('Getting Started');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs
    .map((faq) => ({
      ...faq,
      questions: faq.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((faq) => faq.questions.length > 0);

  return (
    <>
      <LandingTopbar />
      <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/10 via-transparent to-[#C9A84C]/5" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-gray-50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-6">
              <Sparkles size={16} className="text-[#C9A84C]" />
              <span className="text-sm font-semibold text-[#C9A84C]">Common Questions</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
              Frequently Asked
              <span className="block text-[#C9A84C] mt-2">Questions</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-2xl">
              Find answers to common questions about joining our community, managing your profile, and growing your business.
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="px-5 py-8 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-5 py-20 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto space-y-12">
          {filteredFaqs.map((category) => (
            <div key={category.category}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-8">
                <span className="text-sm font-semibold text-[#C9A84C]">{category.category}</span>
              </div>
              
              <div className="space-y-4">
                {category.questions.map((item, idx) => {
                  const id = `${category.category}-${idx}`;
                  const isExpanded = expandedId === id;

                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-gray-200 bg-white hover:border-[#C9A84C]/30 hover:shadow-lg transition-all overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setExpandedId(isExpanded ? null : id);
                        }}
                        className="flex w-full items-center justify-between gap-4 p-6 text-left hover:bg-gray-50"
                      >
                        <span className="font-semibold text-gray-900 text-lg">{item.q}</span>
                        <ChevronDown
                          size={24}
                          className={`flex-shrink-0 text-[#C9A84C] transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 text-gray-700 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-100 bg-white px-5 py-16 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Still Have Questions?</h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is available 24/7 to help you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#C9A84C]/30"
            >
              Contact Support <ArrowRight size={20} />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#C9A84C] text-[#C9A84C] font-semibold rounded-xl hover:bg-[#C9A84C]/5 transition-all"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
