import Link from 'next/link';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from './JsonLd';

export interface Crumb {
  name: string;
  /** Site-relative path. The final crumb is rendered as plain text. */
  path: string;
}

/**
 * Visible breadcrumb trail that doubles as BreadcrumbList structured data.
 *
 * Two reasons this matters beyond looks:
 *  - it is a crawlable path from any page back up to /catalogue and /, which
 *    is how crawlers discover depth in a directory-style site;
 *  - it is the one place a user stranded on a deep page can find their way
 *    back without relying on the browser's back button.
 *
 * Uses <nav aria-label> and an <ol> so assistive technology announces both the
 * trail and the current position.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-slate-800">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.path}
                      className="rounded transition-colors hover:text-[#B8962E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
                    >
                      {crumb.name}
                    </Link>
                    {/* Decorative separator: hidden so it is not read aloud. */}
                    <span aria-hidden="true" className="text-slate-300">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={JSON.stringify(breadcrumbSchema(crumbs))} />
    </>
  );
}
