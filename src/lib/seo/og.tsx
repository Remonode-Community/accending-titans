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
 * Without this, ImageResponse falls back to its built-in face, so the cards
 * would be set in Helvetica while the site is set in Plus Jakarta Sans — the
 * share preview would not match the page it links to.
 *
 * Read from the SAME committed files the site uses (src/fonts/), not fetched
 * from Google. Two reasons:
 *   - satori cannot read woff2, so the TTFs are kept alongside the woff2 rather
 *     than derived from them;
 *   - fetching at build time was a second, separate network dependency that
 *     could fail on its own, and the format dance (a legacy user-agent to coax
 *     a TTF out of Google) silently breaks when Google changes its behaviour.
 *
 * Only 400/700/800 are shipped: those are the weights the cards actually use
 * (body copy, eyebrow, display name).
 */
let fontCache: BrandFont[] | null = null;

export interface BrandFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
}

const FONT_DIR = join(process.cwd(), 'src', 'fonts');
const FONT_NAME = 'Plus Jakarta Sans';

const FONT_FILES: ReadonlyArray<{ weight: 400 | 700 | 800; file: string }> = [
  { weight: 400, file: 'PlusJakartaSans-400.ttf' },
  { weight: 700, file: 'PlusJakartaSans-700.ttf' },
  { weight: 800, file: 'PlusJakartaSans-800.ttf' },
];

export async function brandFonts(): Promise<BrandFont[] | undefined> {
  if (fontCache) return fontCache;

  try {
    const files = await Promise.all(
      FONT_FILES.map(async ({ weight, file }) => {
        const buf = await readFile(join(FONT_DIR, file));
        return {
          name: FONT_NAME,
          data: buf.buffer.slice(
            buf.byteOffset,
            buf.byteOffset + buf.byteLength,
          ) as ArrayBuffer,
          weight,
        };
      }),
    );

    fontCache = files;
  } catch {
    // Fall back to satori's built-in face rather than failing the render.
    // NOTE: must return undefined, never []. Satori reads an empty `fonts`
    // array as "fonts were supplied but none are usable" and throws
    // "No fonts are loaded", which fails the whole build.
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
