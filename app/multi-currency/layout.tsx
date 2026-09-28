import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Server layout for the /multi-currency page.
 *
 * The page is a client component (so it cannot export metadata) and its entire
 * content is a "Coming soon" placeholder. It is deliberately marked
 * noindex,follow: there is nothing on it for a searcher to use, and indexing a
 * placeholder invites a search engine to hold a low-value result that later
 * gets replaced. It is also absent from the sitemap.
 *
 * When the feature actually ships, replace this with real content and flip
 * `index` to true.
 */
export const metadata = buildMetadata({
  title: "Multi-currency wallet — coming soon",
  description:
    "A multi-currency wallet for holding and converting between currencies is coming soon to Acceding Titans.",
  path: "/multi-currency",
  index: false,
  follow: true,
});

export default function MultiCurrencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
