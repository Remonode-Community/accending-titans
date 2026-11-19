import type { SiteContact } from '@/types/platform-settings.types';

/**
 * Contact link helpers.
 *
 * The support phone is a WhatsApp line: clicking it must open a chat, not the
 * phone dialer. `wa.me` only accepts digits (no `+`, spaces or punctuation), so
 * the stored, human-formatted number cannot be used as-is.
 */
export function whatsappHref(number: string): string {
  const digits = number.replace(/\D/g, '');

  return digits === '' ? '' : `https://wa.me/${digits}`;
}

export function mailtoHref(email: string): string {
  return email.trim() === '' ? '' : `mailto:${email.trim()}`;
}

/** One entry per social profile the administrator has actually filled in. */
export function socialLinks(contact: SiteContact): {
  key: keyof SiteContact;
  href: string;
  label: string;
}[] {
  return (
    [
      { key: 'facebook_url', href: contact.facebook_url, label: 'Facebook' },
      { key: 'twitter_url', href: contact.twitter_url, label: 'Twitter' },
      { key: 'linkedin_url', href: contact.linkedin_url, label: 'LinkedIn' },
      { key: 'instagram_url', href: contact.instagram_url, label: 'Instagram' },
    ] as const
  ).filter((link) => link.href.trim() !== '');
}
