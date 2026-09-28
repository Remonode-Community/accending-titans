import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Shared building blocks for the generated Open Graph / Twitter card images.
 *
 * WHY THESE ARE GENERATED RATHER THAN A STATIC FILE
 * -------------------------------------------------
 * The only existing brand asset, public/icon.png, is 192x192 — square, 1:1.
 * Social platforms render link previews at roughly 1.91:1 (1200x630). A 1:1
 * image is letterboxed into a small thumbnail with empty gutters either side,
 * which is why shared links looked unimpressive.
 *
 * The metadata also declared `width: 1200, height: 630` for that square file,
 * which is a straight lie to the crawler and can get the image rejected or
 * cropped. Generating a real 1200x630 card fixes both at once, and lets each
 * business share its own cover image and name.
 *
 * Uses `next/og`, which ships with Next.js — no extra dependency.
 *
 * SATORI CSS RULES (next/og renders with satori, not a browser)
 *   - Any element with more than one child must set `display: flex`.
 *   - `display: grid` is NOT supported.
 *   - No CSS custom properties, no `vh`/`vw`, no shorthand like `border`.
 *   - Every text node needs an explicit `fontSize` and `color`.
 *   - Background images must be absolute-positioned siblings behind content.
 */

/** OG images are 1200x630 = 1.91:1, the size every platform expects. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Brand palette, mirroring the design tokens used across the app. */
export const OG = {
  /** Matches the catalogue hero background. */
  ink: '#0F1115',
  gold: '#C9A84C',
  goldHover: '#B8962E',
  cream: '#FDFAF3',
  muted: 'rgba(253, 250, 243, 0.72)',
  line: 'rgba(201, 168, 76, 0.28)',
} as const;

let logoCache: string | null = null;

/**
 * The brand crest, inlined as a data URI.
 *
 * Cached in module scope because the image is requested on every card render,
 * and a base64 round-trip of a 77 KB PNG is not free.
 *
 * Note the crest is 192x192 natively, so it is never displayed larger than that
 * on the card. Upscaling would smear the ring lettering and the statue detail;
 * at native size the circular gold silhouette is still instantly recognisable,
 * which is what a logo needs to do at thumbnail scale.
 */
export async function brandLogoDataUri(): Promise<string> {
  if (logoCache) return logoCache;

  const path = join(process.cwd(), 'public', 'icon.png');
  const buf = await readFile(path);
  logoCache = `data:image/png;base64,${buf.toString('base64')}`;

  return logoCache;
}

/**
 * The brand typeface, for satori.
 *
 * Without this, ImageResponse falls back to its built-in font, so the cards
 * would be set in Helvetica while the site is set in Plus Jakarta Sans — the
 * share preview would not match the page it links to.
 *
 * Satori cannot read woff2 (which is what `next/font` emits and what Google
 * Fonts serves to a modern UA), so the TTF is requested by presenting an old
 * user-agent. The same build already downloads the font for `next/font/google`,
 * so this adds no new environmental requirement.
 *
 * Failures are swallowed: if the network is unavailable the card still renders
 * in satori's default face rather than the build failing. A slightly-off font in
 * a share image is a far better outcome than a deployment that will not build.
 */
let fontCache: BrandFont[] | null = null;

/**
 * A UA that makes Google Fonts serve a raw TTF.
 *
 * Satori can read TTF/OTF/WOFF but NOT woff2, which is what every modern UA
 * gets. Which legacy UA produces which format has changed over time — verified
 * against the live endpoint:
 *   Android 4.0.3  -> TTF    (what we want)
 *   Firefox 27     -> WOFF   (satori can read this too)
 *   Chrome 40      -> WOFF
 *   IE 11          -> WOFF
 *   IE 6 / MSIE 4  -> EOT    (breaks the build with "Unsupported OpenType
 *                            signature" — the header is just a file-size int)
 */
const TTF_UA =
  'Mozilla/5.0 (Linux; U; Android 4.0.3; en-us) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30';

export interface BrandFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
}

/**
 * Weights used across the cards: 400 for body copy, 700 for eyebrows, 800 for
 * the big name. The `wght@` axis value must be the numeric weight — Google
 * Fonts rejects `wght@regular` with a 400.
 */
const WEIGHTS: ReadonlyArray<400 | 700 | 800> = [400, 700, 800];

export async function brandFonts(): Promise<BrandFont[] | undefined> {
  if (fontCache) return fontCache;

  try {
    const families = await Promise.all(
      WEIGHTS.map(async (weight) => {
        const url = `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`;
        const cssRes = await fetch(url, { headers: { 'User-Agent': TTF_UA } });
        if (!cssRes.ok) throw new Error(`font css ${cssRes.status}`);

        const stylesheet = await cssRes.text();
        // First @font-face src URL in the returned stylesheet.
        const match = stylesheet.match(/src:\s*url\((https:[^)]+)\)/);
        if (!match) throw new Error(`no src url for weight ${weight}`);

        const fontRes = await fetch(match[1]);
        if (!fontRes.ok) throw new Error(`font file ${fontRes.status}`);

        return {
          name: 'Plus Jakarta Sans',
          data: await fontRes.arrayBuffer(),
          weight,
        };
      }),
    );

    fontCache = families;
  } catch {
    // Reset so a later render can retry, and fall back to satori's built-in
    // face. Returning an empty array here would be worse than useless: satori
    // treats `fonts: []` as "fonts were supplied but none are usable" and
    // fails the render, whereas omitting the key uses its default.
    fontCache = null;
    return undefined;
  }

  return fontCache;
}

/**
 * The soft gold glow behind the emblem, matching the catalogue hero.
 *
 * Rendered as a positioned div rather than a radial-gradient: satori supports
 * only a subset of CSS, and `backgroundImage` gradients on an absolutely
 * positioned element are the one case it handles reliably.
 */
export function GoldGlow() {
  return (
    <div
      style={{
        position: 'absolute',
        top: -260,
        right: -180,
        width: 720,
        height: 720,
        borderRadius: 9999,
        background: `radial-gradient(circle, ${OG.gold}22 0%, rgba(15,17,21,0) 70%)`,
      }}
    />
  );
}

/** Thin inset frame, so the card reads as deliberate rather than cropped. */
export function GoldFrame() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 28,
        right: 28,
        bottom: 28,
        borderRadius: 28,
        border: `1px solid ${OG.line}`,
      }}
    />
  );
}

/** Small uppercase eyebrow label, e.g. "BUSINESS DIRECTORY". */
export function Eyebrow({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 6,
        color: OG.gold,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}
