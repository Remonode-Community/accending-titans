import { buildMetadata } from './metadata';

/**
 * Per-page metadata for the public marketing pages.
 *
 * These six pages are all `'use client'`, so they cannot export a `metadata`
 * object — Next.js forbids it. Wrapping each in a tiny server layout (see
 * app/<route>/layout.tsx) supplies the metadata without touching the client
 * component, which is why the titles and descriptions used to be identical
 * across all of them.
 *
 * Descriptions describe what is actually on the page. They are not keyword
 * lists: a stuffed description raises the bounce rate and reads as spam to both
 * users and search engines.
 */
export const PUBLIC_PAGE_SEO = {
  about: {
    title: 'About us',
    description:
      'Learn what Acceding Titans is: a community platform and public business directory where African entrepreneurs showcase what they sell and connect with customers.',
  },
  faq: {
    title: 'Frequently asked questions',
    description:
      'Answers about joining Acceding Titans, listing your business in the public directory, contacting members on WhatsApp, membership and how the platform works.',
  },
  support: {
    title: 'Support',
    description:
      'Get help with your Acceding Titans account, business listing or directory search, and find the fastest route to reach the support team.',
  },
  privacy: {
    title: 'Privacy policy',
    description:
      'How Acceding Titans collects, uses, stores and protects your personal data, the rights you have over it, and how to exercise them.',
  },
  terms: {
    title: 'Terms of service',
    description:
      'The terms that govern your use of Acceding Titans, including account responsibilities, acceptable use of the business directory, and content ownership.',
  },
} as const;

export type PublicPageKey = keyof typeof PUBLIC_PAGE_SEO;

/** Metadata for a public marketing page, with the canonical set to its own path. */
export function publicPageMetadata(key: PublicPageKey) {
  const page = PUBLIC_PAGE_SEO[key];
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/${key}`,
  });
}
