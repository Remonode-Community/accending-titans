import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/seo/config';

/**
 * Web app manifest — /manifest.webmanifest
 *
 * The root layout previously pointed `manifest` at /manifest.json, which does
 * not exist in public/ and therefore 404'd. Next.js serves this file at
 * /manifest.webmanifest, which is what the layout now references.
 *
 * `id` is deliberately the site root rather than any member URL: it scopes the
 * manifest's identity, and a stable value stops the browser treating the app as
 * a different one depending on which deep link it was opened from.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.description,
    id: '/',
    start_url: '/',
    // A member landing directly on a deep link (e.g. a shared business page)
    // should be shown that page, not bounced to the directory.
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FDFAF3',
    theme_color: '#C9A84C',
    lang: BRAND.language,
    dir: 'ltr',
    categories: ['business', 'shopping', 'social'],
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
