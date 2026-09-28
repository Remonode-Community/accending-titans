import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/seo/config';
import {
  OG,
  OG_SIZE,
  GoldFrame,
  GoldGlow,
  brandFonts,
  brandLogoDataUri,
} from '@/lib/seo/og';

export const runtime = 'nodejs';
export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

/**
 * The branded card layout, shared by opengraph-image and twitter-image.
 *
 * Kept as a function rather than a re-exported module because Next.js only
 * recognises `runtime`, `size`, `contentType` and `alt` when they are declared
 * literally in the convention file — re-exporting them fails the build.
 */
export async function renderBrandCard(): Promise<ImageResponse> {
  const [logo, fonts] = await Promise.all([brandLogoDataUri(), brandFonts()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: OG.ink,
          position: 'relative',
        }}
      >
        <GoldGlow />
        <GoldFrame />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Crest, at its native 192px so it is never upscaled. */}
          <img src={logo} alt="" width={192} height={192} style={{ borderRadius: 96 }} />

          <div
            style={{
              display: 'flex',
              marginTop: 34,
              fontSize: 74,
              fontWeight: 800,
              color: OG.cream,
              letterSpacing: -1.5,
            }}
          >
            {BRAND.name}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 10,
              width: 90,
              height: 3,
              background: OG.gold,
            }}
          />

          <div
            style={{
              display: 'flex',
              marginTop: 24,
              maxWidth: 860,
              fontSize: 27,
              lineHeight: 1.4,
              textAlign: 'center',
              color: OG.muted,
            }}
          >
            {BRAND.tagline}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/**
 * Default social share card — /opengraph-image
 *
 * Applies to every route that does not define its own `opengraph-image`, so
 * plain pages (About, VTU, legal) and the 404 all share this card. The card has
 * no request-time data, so it is generated once at build time and served as a
 * static PNG.
 *
 * The file convention makes Next.js emit og:image, og:image:width,
 * og:image:height and og:image:type automatically — which is why
 * buildMetadata() must not hardcode an image for routes that have one of these
 * files.
 */
export default function OpengraphImage() {
  return renderBrandCard();
}
