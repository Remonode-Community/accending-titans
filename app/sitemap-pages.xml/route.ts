import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_ROUTES } from '@/lib/seo/config';
import { toUrlSetXml, xmlResponse } from '@/lib/seo/sitemap-xml';

/**
 * Static public pages — GET /sitemap-pages.xml
 *
 * Sourced from STATIC_ROUTES in src/lib/seo/config.ts so the sitemap can never
 * drift from the curated list. The previous sitemap advertised seven
 * /services/* URLs that had no corresponding page, handing search engines
 * seven 404s; the build-time check below makes that class of mistake fail
 * loudly instead of shipping.
 */
export const dynamic = 'force-static';

/** True when app/<segment>/<segment>… contains a page.tsx. */
function isRealRoute(path: string): boolean {
  // Dynamic segments are resolved at request time, not here.
  if (path.split('/').some((s) => s.startsWith('['))) return true;

  const segments = path.split('/').filter(Boolean);
  return existsSync(join(process.cwd(), 'app', ...segments, 'page.tsx'));
}

export async function GET() {
  const missing = STATIC_ROUTES.filter((r) => r.path !== '/' && !isRealRoute(r.path));

  if (missing.length > 0) {
    // Thrown at build time, where it is cheap to fix, rather than silently
    // publishing a sitemap of 404s.
    throw new Error(
      `sitemap-pages.xml lists routes with no page under app/: ${missing
        .map((m) => m.path)
        .join(', ')}. Remove them from STATIC_ROUTES in src/lib/seo/config.ts.`,
    );
  }

  return xmlResponse(
    toUrlSetXml(
      STATIC_ROUTES.map((route) => ({
        url: route.path,
        lastModified: route.lastModified ?? new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })),
    ),
  );
}
