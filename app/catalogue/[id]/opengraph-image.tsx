import { ImageResponse } from 'next/og';
import { getPublicPortfolio } from '@/lib/catalogue.server';
import { BRAND } from '@/lib/seo/config';
import {
  OG,
  OG_SIZE,
  Eyebrow,
  GoldFrame,
  GoldGlow,
  brandFonts,
  brandLogoDataUri,
} from '@/lib/seo/og';

/**
 * Per-business social share card — /catalogue/<id>/opengraph-image
 *
 * When a member shares their catalogue link on WhatsApp or Facebook, the card
 * shows their own cover image and business name rather than generic site
 * branding. This is the single highest-leverage social feature for a directory:
 * member links are what get shared, so the preview is effectively their
 * storefront.
 *
 * Requests are dynamic because the portfolio is per-id. Next.js caches the
 * generated PNG per URL, and the underlying fetch is ISR-cached, so this does
 * not re-render on every crawler hit.
 */
export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';

/** Strims to a single line and keeps the card layout intact. */
function clamp(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export default async function BusinessOpengraphImage({
  params,
}: {
  // Since Next.js 15/16 dynamic route params are a Promise. Reading
  // `params.id` synchronously yields undefined, which silently sends every
  // business card down the generic fallback branch.
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  const business = Number.isSafeInteger(id) && id > 0
    ? await getPublicPortfolio(id)
    : null;

  const [logo, fonts] = await Promise.all([brandLogoDataUri(), brandFonts()]);
  const fallback = `alt="${BRAND.name} — ${BRAND.tagline}"`;

  if (!business) {
    // An unknown or unpublished business still gets a valid branded card rather
    // than a broken image, because social crawlers cache whatever they fetch
    // and a 500 here would leave a blank preview permanently.
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
          <img src={logo} alt="" width={160} height={160} style={{ borderRadius: 80 }} />
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 62,
              fontWeight: 800,
              color: OG.cream,
            }}
          >
            {BRAND.name}
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const cover = business.cover_image_url ?? business.profile_image_url ?? null;
  const hasLogoGlyph = Boolean(business.profile_image_url);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: OG.ink,
          position: 'relative',
        }}
      >
        <GoldGlow />
        <GoldFrame />

        {/* Left: the member's own image, or a brand fallback. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 520,
            height: '100%',
            position: 'relative',
            background: OG.ink,
            borderRight: `1px solid ${OG.line}`,
          }}
        >
          {cover ? (
            <img
              src={cover}
              alt={fallback}
              width={440}
              height={440}
              style={{ objectFit: 'cover', borderRadius: 28 }}
            />
          ) : (
            <img
              src={logo}
              alt=""
              width={200}
              height={200}
              style={{ borderRadius: 100 }}
            />
          )}
        </div>

        {/* Right: who it is and what they offer. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 680,
            padding: '0 56px',
          }}
        >
          <Eyebrow>
            {business.business_category
              ? business.business_category
              : 'Business directory'}
          </Eyebrow>

          <div
            style={{
              display: 'flex',
              marginTop: 20,
              fontSize: business.business_name.length > 26 ? 50 : 58,
              fontWeight: 800,
              lineHeight: 1.12,
              color: OG.cream,
            }}
          >
            {clamp(business.business_name, 48)}
          </div>

          {business.business_description ? (
            <div
              style={{
                display: 'flex',
                marginTop: 20,
                fontSize: 25,
                lineHeight: 1.45,
                color: OG.muted,
              }}
            >
              {clamp(business.business_description, 150)}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 30,
            }}
          >
            {/* Fall back to the site crest when the member has no logo. */}
            {hasLogoGlyph ? null : (
              <img
                src={logo}
                alt=""
                width={34}
                height={34}
                style={{ borderRadius: 17, marginRight: 12 }}
              />
            )}
            <div style={{ display: 'flex', fontSize: 23, color: OG.gold }}>
              {BRAND.name}
            </div>
            {business.items_count > 0 ? (
              <div
                style={{
                  display: 'flex',
                  marginLeft: 16,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px solid ${OG.line}`,
                  fontSize: 20,
                  color: OG.muted,
                }}
              >
                {business.items_count}{' '}
                {business.items_count === 1 ? 'item' : 'items'}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
