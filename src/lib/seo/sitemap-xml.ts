import { absoluteUrl } from './config';

/**
 * Minimal sitemap serialisation.
 *
 * Shared by the three dynamic sitemap routes so the XML escaping, the
 * `<lastmod>` handling and the cache headers cannot drift between them.
 */

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function toUrlSetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const lines: string[] = [`  <loc>${escapeXml(absoluteUrl(e.url))}</loc>`];

      if (e.lastModified) {
        const d = e.lastModified instanceof Date ? e.lastModified : new Date(e.lastModified);
        // An unparseable date would emit garbage into <lastmod>, which search
        // engines treat as a signal to ignore the entry.
        if (!Number.isNaN(d.getTime())) {
          lines.push(`  <lastmod>${d.toISOString()}</lastmod>`);
        }
      }

      if (e.changeFrequency) {
        lines.push(`  <changefreq>${e.changeFrequency}</changefreq>`);
      }
      if (typeof e.priority === 'number') {
        lines.push(`  <priority>${e.priority.toFixed(1)}</priority>`);
      }

      return `<url>\n${lines.join('\n')}\n</url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function toSitemapIndexXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const raw = e.lastModified ?? new Date();
      const d = raw instanceof Date ? raw : new Date(raw);
      return [
        '  <sitemap>',
        `    <loc>${escapeXml(absoluteUrl(e.url))}</loc>`,
        Number.isNaN(d.getTime()) ? null : `    <lastmod>${d.toISOString()}</lastmod>`,
        '  </sitemap>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function xmlResponse(body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Short shared cache so a new listing is discoverable quickly, with
      // stale-while-revalidate so crawlers are never served an error.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
