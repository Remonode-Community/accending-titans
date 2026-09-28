import { publicPageMetadata } from "@/lib/seo/pages";

/**
 * Server layout supplying metadata for the /about page.
 *
 * The page itself is a client component, and Next.js forbids exporting
 *  + "metadata" +  from one. Without this wrapper it inherited the site-wide
 * defaults, so every one of these pages shipped an identical title and
 * description.
 */
export const metadata = publicPageMetadata("about");

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}