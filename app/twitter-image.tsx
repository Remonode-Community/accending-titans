import { BRAND } from '@/lib/seo/config';
import { OG_SIZE } from '@/lib/seo/og';
import { renderBrandCard } from './opengraph-image';

/**
 * Twitter / X card image — /twitter-image
 *
 * X does not reliably fall back to `og:image`, and it applies its own crop on
 * top of the 1.91:1 OG image. Reusing the same generated card keeps the
 * branding identical across X, WhatsApp, Facebook and LinkedIn instead of
 * showing a bare 192px icon on one platform and a real card on the others.
 *
 * The exports must be declared literally here: Next.js only recognises
 * `runtime`, `size`, `contentType` and `alt` on the convention file itself, and
 * re-exporting them from another module fails the build.
 */
export const runtime = 'nodejs';
export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function TwitterImage() {
  return renderBrandCard();
}
