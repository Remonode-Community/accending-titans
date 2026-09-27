'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Gift,
  Globe,
  Headphones,
  Linkedin,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  Briefcase,
  Search,
  Share2,
} from 'lucide-react';
import { LandingTopbar } from '@/components/LandingTopbar';
import { SubscriptionPlansSection } from '@/components/subscription/SubscriptionPlansSection';
import BusinessShowcase from '@/components/vtu-public/BusinessShowcase';

const features = [
  {
    title: 'Business Catalogue',
    desc: 'Showcase your products and services to thousands of members.',
    icon: Store,
  },
  {
    title: 'Community Networking',
    desc: 'Connect, collaborate, and grow your network with fellow entrepreneurs.',
    icon: Users,
  },
  {
    title: 'Birthday Rewards',
    desc: 'Celebrate members with personalized rewards from the community.',
    icon: Gift,
  },
  {
    title: 'Direct Messaging',
    desc: 'Communicate directly via WhatsApp and in-app messaging.',
    icon: MessageSquare,
  },
  {
    title: 'Advertising Platform',
    desc: 'Promote your business with text, images, and short videos.',
    icon: TrendingUp,
  },
  {
    title: 'Job Opportunities',
    desc: 'Find and post gigs and job opportunities within the community.',
    icon: Briefcase,
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Sign Up & Choose Tier',
    desc: 'Create your account and select a membership plan that works for you.',
    icon: CheckCircle2,
  },
  {
    step: 2,
    title: 'Build Your Profile',
    desc: 'Add your business details, upload products, and showcase your services.',
    icon: Store,
  },
  {
    step: 3,
    title: 'Connect & Network',
    desc: 'Meet other entrepreneurs, send messages, and find collaboration opportunities.',
    icon: Users,
  },
  {
    step: 4,
    title: 'Grow & Earn',
    desc: 'Increase visibility through ads, get rewarded, and expand your reach.',
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    name: 'Chioma Nwankwo',
    role: 'Fashion Entrepreneur, Lagos',
    text: 'Since joining this platform, getting new customers has become much easier. The community exposure has helped my fashion brand grow beyond Lagos.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    rating: 5,
  },
  {
    name: 'Oluwaseun Adeyemi',
    role: 'Business Consultant, Abuja',
    text: 'The platform has made it easy to showcase my services and connect with quality clients. The support team is responsive, and everything works seamlessly.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 5,
  },
  {
    name: 'Maryam Bello',
    role: 'Event Planner, Kano',
    text: "I love how simple it is to promote my business. My digital catalogue is always available for clients, and I've received several referrals through the community.",
    rating: 5,
  },
];

const stats = [
  { value: '10K+', label: 'Active Members', icon: Users },
  { value: '50K+', label: 'Business Listings', icon: Store },
  { value: '25K+', label: 'Referrals Made', icon: Gift },
  { value: '98%', label: 'Member Satisfaction', icon: Star },
];

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1920&q=90',
    headline: 'Showcase Your Business',
    subtext: 'Display your products and services to thousands of engaged entrepreneurs and grow your sales',
    service: '📦 Business Catalogue',
  },
  {
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1920&q=90',
    headline: 'Network & Collaborate',
    subtext: 'Connect with like-minded business owners, find partners, and unlock unlimited opportunities',
    service: '🤝 Community Networking',
  },
  {
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=90',
    headline: 'Promote Your Services',
    subtext: 'Reach thousands of members with targeted advertising through text, images, and video content',
    service: '📢 Advertising Platform',
  },
  {
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=90',
    headline: 'Find Jobs & Opportunities',
    subtext: 'Post gigs, find skilled professionals, and discover new business opportunities in your network',
    service: '💼 Job Opportunities',
  },
];

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  const goToSlide = (idx: number) => {
    if (idx === activeHeroSlide) return;
    setIsTextVisible(false);
    setTimeout(() => {
      setActiveHeroSlide(idx);
      setIsTextVisible(true);
    }, 350);
  };

  // Auto-advance hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTextVisible(false);
      setTimeout(() => {
        setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
        setIsTextVisible(true);
      }, 350);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <LandingTopbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section id="hero" className="relative overflow-hidden pt-14 sm:pt-16 md:pt-20 min-h-screen flex items-center">

        {/* Stacked background images — crossfade in sync with text */}
        <div className="absolute inset-0 z-0">
          {heroSlides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                idx === activeHeroSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {/* Overlay gradients — sit above all images */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(201,168,76,0.15),transparent_60%)]" />
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-[#C9A84C]/8 via-[#C9A84C]/3 to-transparent blur-3xl" />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center">
            {/* Left content — text fades in/out in sync with background */}
            <div
              className="transition-all duration-350 ease-in-out"
              style={{
                opacity: isTextVisible ? 1 : 0,
                transform: isTextVisible ? 'translateY(0px)' : 'translateY(10px)',
                transition: 'opacity 350ms ease-in-out, transform 350ms ease-in-out',
              }}
            >
              {/* Main headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-4 sm:mb-5 min-h-[80px] sm:min-h-[100px] md:min-h-[130px]">
                {heroSlides[activeHeroSlide].headline}
                <span className="block text-[#C9A84C] mt-2">with Acceding Titans</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base md:text-lg text-white/85 mb-6 sm:mb-8 leading-relaxed max-w-lg font-light min-h-[48px] sm:min-h-[60px] md:min-h-[72px]">
                {heroSlides[activeHeroSlide].subtext}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 bg-gradient-to-r from-[#C9A84C] to-[#B8962E] text-gray-900 text-sm sm:text-base font-semibold rounded-xl hover:shadow-2xl hover:shadow-[#C9A84C]/40 transition-all duration-300 transform hover:scale-105"
                >
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 border-2 border-[#C9A84C]/60 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-[#C9A84C]/15 transition-all backdrop-blur-md hover:border-[#C9A84C] group"
                >
                  Explore Services
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-5 sm:gap-8">
                <div>
                  <div className="flex -space-x-2 sm:-space-x-3 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8962E] border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">10,000+ Active Entrepreneurs</p>
                  <p className="text-xs text-white/60">Growing every single day</p>
                </div>
                <div className="h-10 w-px bg-gradient-to-b from-[#C9A84C]/30 via-[#C9A84C]/20 to-transparent" />
                <div>
                  <div className="flex gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} className="fill-[#C9A84C] text-[#C9A84C]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">Rated 4.9/5</p>
                  <p className="text-xs text-white/60">From real members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="mt-6 sm:mt-8 flex justify-center gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`transition-all duration-300 ${
                  idx === activeHeroSlide
                    ? 'w-6 h-1.5 bg-[#C9A84C] rounded-full'
                    : 'w-1.5 h-1.5 bg-white/40 rounded-full hover:bg-white/60'
                }`}
                aria-label={`Go to service ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
              Get started in just a few minutes and begin your entrepreneurial journey
            </p>
          </div>

          {/* Horizontal scroll on mobile, 4-col grid on lg */}
          <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto gap-4 lg:gap-6 pb-4 lg:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory scroll-smooth">
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative flex-shrink-0 w-64 sm:w-72 lg:w-auto snap-start">
                  {idx < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[62%] w-[38%] h-[2px] bg-gradient-to-r from-[#C9A84C] to-transparent" />
                  )}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-md hover:border-[#C9A84C]/30 transition-all h-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 mb-4">
                      <Icon className="text-[#C9A84C]" size={20} />
                    </div>
                    <div className="mb-2 text-xs font-bold text-[#C9A84C] tracking-wide">STEP {item.step}</div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="bg-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Powerful Features for Growth
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
              Everything you need to build, promote, and grow your business
            </p>
          </div>

          {/* Horizontal scroll on mobile, grid on md+ */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto gap-4 md:gap-6 pb-4 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex-shrink-0 w-64 sm:w-72 md:w-auto snap-start bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-xl hover:border-[#C9A84C]/30 transition-all group"
                >
                  <div className="w-11 h-11 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-md transition-all">
                    <Icon className="text-[#C9A84C]" size={22} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ MEMBERSHIP PLANS (Dynamic) ═══════════════════ */}
      <SubscriptionPlansSection showViewAll />

      {/* ═══════════════════ MOBILE APP SECTION ═══════════════════ */}
      <section
        id="download-app"
        className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 px-4 sm:px-6 py-12 sm:py-16 md:py-24 lg:px-8"
      >
        <div className="absolute left-0 top-16 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-[#C9A84C]/15 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-[#C9A84C]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <span className="inline-block px-3 py-1.5 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-xs sm:text-sm font-semibold text-[#C9A84C] mb-5">
              Download Now
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 leading-tight">
              Everything you need,
              <br />
              <span className="text-[#C9A84C]">right in your pocket.</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-md">
              Access your business catalogue, connect with members, manage your profile, view analytics, and seize opportunities anytime, anywhere.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <div className="flex gap-3 w-full">
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white text-sm font-semibold transition hover:bg-white/20 hover:border-[#C9A84C]/50"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M9 7h6M9 11h6M9 15h6" />
                  </svg>
                  <div className="text-left min-w-0">
                    <p className="text-xs opacity-75 leading-none mb-0.5">Get it on</p>
                    <p className="text-sm font-bold leading-none">Google Play</p>
                  </div>
                </a>
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white text-sm font-semibold transition hover:bg-white/20 hover:border-[#C9A84C]/50"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 13.5c-.91 2.92-3.44 5.23-6.55 5.23-3.83 0-6.94-3.11-6.94-6.94s3.11-6.94 6.94-6.94c1.64 0 3.15.57 4.35 1.52l2.17-2.17C15.44 2.18 13.56 1 11.5 1 5.04 1 1 5.04 1 11.5s4.04 10.5 10.5 10.5c5.05 0 9.35-3.72 10.16-8.5h-7.61z" />
                  </svg>
                  <div className="text-left min-w-0">
                    <p className="text-xs opacity-75 leading-none mb-0.5">Download on the</p>
                    <p className="text-sm font-bold leading-none">App Store</p>
                  </div>
                </a>
              </div>

              <a
                href="#"
                download
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C9A84C] text-gray-900 text-sm font-semibold shadow-lg shadow-[#C9A84C]/25 transition hover:bg-[#B8962E]"
              >
                Direct Download APK
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute top-8 h-40 w-40 sm:h-52 sm:w-52 rounded-full bg-[#C9A84C]/20 blur-3xl -z-10" />

            <div className="relative">
              <div className="relative h-[400px] w-[200px] sm:h-[500px] sm:w-[250px] md:h-[580px] md:w-[290px] rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-gray-600 via-gray-800 to-black p-2.5 sm:p-3 shadow-2xl shadow-black/80">
                <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-black border border-gray-900">
                  <div className="absolute left-1/2 top-0 z-30 h-5 sm:h-6 w-24 sm:w-32 -translate-x-1/2 rounded-b-3xl bg-black" />
                  <div className="relative h-full w-full overflow-hidden bg-gray-950">
                    <Image
                      src="/titan_mock.png"
                      alt="Acceding Titans App Dashboard"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-2 left-1/2 z-30 h-1 w-20 sm:w-28 -translate-x-1/2 rounded-full bg-white/30" />
                </div>
                <div className="absolute left-0 top-32 z-20 h-10 w-1 rounded-r-lg bg-gray-500/70" />
                <div className="absolute right-0 top-44 z-20 h-16 w-1 rounded-l-lg bg-gray-500/70" />
                <div className="absolute right-0 top-64 z-20 h-16 w-1 rounded-l-lg bg-gray-500/70" />
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-10 sm:-left-14 top-1/4 z-20 rounded-xl border border-[#C9A84C]/50 bg-gradient-to-br from-gray-700/95 to-gray-800/95 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
                <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Members</p>
                <p className="mt-1.5 text-[#C9A84C] font-bold text-xl sm:text-2xl">10K+</p>
                <p className="text-gray-400 text-xs">Growing daily</p>
              </div>

              <div className="absolute -right-10 sm:-right-14 bottom-1/4 z-20 rounded-xl border border-[#C9A84C]/50 bg-gradient-to-br from-gray-700/95 to-gray-800/95 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
                <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Listings</p>
                <p className="mt-1.5 text-[#C9A84C] font-bold text-xl sm:text-2xl">50K+</p>
                <p className="text-gray-400 text-xs">Active now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ BUSINESS SHOWCASE ═══════════════════ */}
      <BusinessShowcase />

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section id="testimonials" className="bg-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Loved by Our Members
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
              See how entrepreneurs and business owners are thriving
            </p>
          </div>

          {/* Horizontal scroll on mobile, 3-col grid on md+ */}
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto gap-4 md:gap-6 pb-4 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="flex-shrink-0 w-72 sm:w-80 md:w-auto snap-start bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg hover:border-[#C9A84C]/30 transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={15} className="fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>

                <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">"{testimonial.text}"</p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-sm font-bold text-[#C9A84C]">
                    {testimonial.name
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section id="stats" className="bg-gradient-to-r from-[#C9A84C]/5 to-transparent py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                      <Icon className="text-[#C9A84C]" size={22} />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA SECTION ═══════════════════ */}
      <section className="bg-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Join the Community?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto">
            Start building your network and growing your business today. Join thousands of successful entrepreneurs on our platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 bg-[#C9A84C] text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-[#B8962E] transition-colors shadow-md shadow-[#C9A84C]/25"
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 border-2 border-gray-200 text-gray-900 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-gray-900 text-gray-300 py-10 sm:py-12 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/icon.png" alt="Logo" width={36} height={36} className="h-8 w-8 sm:h-9 sm:w-9" />
                <span className="font-bold text-white text-base sm:text-lg">Community</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Empowering entrepreneurs and business owners through community, connection, and opportunity.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm mb-3">Company</h3>
              <ul className="space-y-2">
                {[['About Us', '/about'], ['Blog', '/'], ['Careers', '/about'], ['Contact', '/support']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs sm:text-sm text-gray-400 hover:text-[#C9A84C] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm mb-3">Resources</h3>
              <ul className="space-y-2">
                {[['Help Center', '/support'], ['Documentation', '/'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs sm:text-sm text-gray-400 hover:text-[#C9A84C] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm mb-3">Connect</h3>
              <div className="flex gap-2.5">
                <a href="#" className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-[#C9A84C]/20 transition-colors">
                  <Linkedin size={17} />
                </a>
                <a href="mailto:support@community.com" className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-[#C9A84C]/20 transition-colors">
                  <Mail size={17} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500">© 2026 Community Platform. All rights reserved.</p>
            <p className="text-xs text-gray-500">
              Made with <span className="text-[#C9A84C]">♥</span> for entrepreneurs
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}