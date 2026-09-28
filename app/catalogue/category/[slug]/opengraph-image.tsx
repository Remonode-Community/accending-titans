import { ImageResponse } from 'next/og';
import { categorySlug, getPortfolioCategories, getPublicPortfolios } from '@/lib/catalogue.server';
import { BRAND } from '@/lib/seo/config';
import {
  OG,
  OG_SIZE,
  GoldFrame,
  GoldGlow,
  brandFonts,
  brandLogoDataUri,
} from '@/lib/seo/og';

/**
 * Category share card — /catalogue/category/<slug>/opengraph-image
 *
 * Completes the sharing story across the whole hierarchy:
 *   site            -> generic branded card
 *   category        -> category name + how many businesses it holds
 *   business        -> the member's own cover image, name and description
 *
 * The count is the useful part: a shared category link immediately tells you
 * how much of the directory sits behind it, which is the reason someone would
 * share it.
 */
export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';

function clamp(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export default async function CategoryOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // `params` is a Promise in Next.js 15/16; reading it synchronously yields
  // undefined and silently produces the generic card.
  const { slug } = await params;
  const [logo, fonts, categories] = await Promise.all([
    brandLogoDataUri(),
    brandFonts(),
    getPortfolioCategories(),
  ]);

  const match = categories.find((c) => categorySlug(c.name) === slug);
  const name = match?.name ?? null;

  if (!name) {
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
            style={{ display: 'flex', marginTop: 28, fontSize: 62, fontWeight: 800, color: OG.cream }}
          >
            {BRAND.name}
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const listing = await getPublicPortfolios({ page: 1, perPage: 1, category: name });
  const count = listing.total;

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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} alt="" width={150} height={150} style={{ borderRadius: 75 }} />

          <div
            style={{
              display: 'flex',
              marginTop: 10,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 5,
              color: OG.gold,
              textTransform: 'uppercase',
            }}
          >
            Business directory
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 22,
              maxWidth: 960,
              fontSize: name.length > 22 ? 62 : 72,
              fontWeight: 800,
              lineHeight: 1.1,
              textAlign: 'center',
              color: OG.cream,
            }}
          >
            {clamp(name, 34)}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 26,
              alignItems: 'center',
              padding: '12px 26px',
              borderRadius: 999,
              border: `1px solid ${OG.line}`,
              fontSize: 26,
              color: OG.muted,
            }}
          >
            <span style={{ color: OG.gold, fontWeight: 800 }}>{count}</span>
            <span style={{ margin: '0 8px' }}>{count === 1 ? 'business' : 'businesses'}</span>
            <span>on {BRAND.name}</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
