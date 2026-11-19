'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useSiteContact } from '@/contexts/SiteContactContext';
import { mailtoHref, whatsappHref } from '@/utils/contact.utils';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const contact = useSiteContact();

  const emailHref = mailtoHref(contact.support_email);
  // The support phone is a WhatsApp line: clicking it opens a chat.
  const phoneHref = whatsappHref(contact.whatsapp_number);

  const socials = [
    { href: contact.facebook_url, label: 'Facebook', Icon: Facebook },
    { href: contact.twitter_url, label: 'Twitter', Icon: Twitter },
    { href: contact.linkedin_url, label: 'LinkedIn', Icon: Linkedin },
    { href: contact.instagram_url, label: 'Instagram', Icon: Instagram },
  ].filter((social) => social.href.trim() !== '');

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid gap-12 md:grid-cols-5 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Acceding Titans</h3>
              <p className="text-sm text-gray-600">Connect, Showcase, and Grow</p>
            </div>
            <div className="flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#C9A84C] transition"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Features</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Business Catalogue
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Community Networking
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Direct Messaging
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Advertising Platform
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Job Opportunities
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Community</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Join Now
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                {emailHref ? (
                  <a href={emailHref} className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                    {contact.support_email}
                  </a>
                ) : (
                  <span className="text-sm text-gray-600">{contact.support_email}</span>
                )}
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-[#C9A84C] transition"
                  >
                    {contact.support_phone}
                  </a>
                ) : (
                  <span className="text-sm text-gray-600">{contact.support_phone}</span>
                )}
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{contact.location}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <p className="text-sm text-gray-600">
                © {currentYear} Acceding Titans Community. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6 justify-end">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                Terms of Service
              </Link>
              <Link href="/support" className="text-sm text-gray-600 hover:text-[#C9A84C] transition">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
