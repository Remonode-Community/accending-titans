import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { BRAND, DEFAULT_OG_IMAGE, SITE_URL, SOCIAL } from "@/lib/seo/config";
import { graph, organizationSchema, webSiteSchema } from "@/lib/seo/schema";

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

/**
 * The brand typeface.
 *
 * globals.css already declared 'Plus Jakarta Sans' as the first family in
 * --font-sans, but nothing ever loaded it — there was no next/font import and
 * no Google Fonts stylesheet, so every page silently rendered in system-ui
 * while still paying for a preconnect to fonts.googleapis.com.
 *
 * next/font self-hosts the woff2 files at build time, subsets them, and
 * preloads only the weights actually used. That fixes the brand mismatch and
 * removes a render-blocking third-party request in one move.
 *
 * Build-time network note: next/font/google downloads the font during
 * `next build`. On a machine with no outbound access, switch to
 * `next/font/local` with a self-hosted woff2 to keep builds hermetic.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

/**
 * Site-wide defaults.
 *
 * Deliberately NOT set here:
 *  - `alternates.canonical` — a canonical on the root layout is inherited by
 *    every route that does not override it, which would point all of them at
 *    the homepage. Each page builds its own via buildMetadata().
 *  - `keywords` — Google has ignored this tag since 2009, and a keyword list is
 *    a thin-content signal rather than a ranking aid.
 *  - openGraph/twitter images pointing at og-image.png and banner.png —
 *    neither file exists, so both were 404s on every social share. The default
 *    share image resolves to /icon.png, which does exist. Point
 *    DEFAULT_OG_IMAGE in src/lib/seo/config.ts at a 1200x630 card once one
 *    exists.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    // Any page passing a bare title renders as "… | Acceding Titans".
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  // Safe because every other route sets its own canonical via buildMetadata().
  // A new page that forgets to will inherit this and point at the homepage,
  // which silently drops it from the index — so if a route is ever added here,
  // give it metadata.
  alternates: { canonical: "/" },
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", sizes: "any", type: "image/png" }],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.png"],
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    locale: BRAND.locale,
    images: [
      { url: DEFAULT_OG_IMAGE, alt: `${BRAND.name} — ${BRAND.tagline}` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    creator: SOCIAL.twitter,
    site: SOCIAL.twitter,
    images: [DEFAULT_OG_IMAGE],
  },
  category: "Business & Entrepreneurship",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        {/*
          Entity definitions for the whole site. Rendered inline in the server
          HTML rather than via next/script, because a `strategy="afterInteractive"`
          script is injected only after hydration and is invisible to crawlers
          and AI agents that read the raw response.

          The previous version also published a phone number, support address
          and founding date that were placeholders, a banner.png that does not
          exist, and a WebSite/SearchAction pointing at a /search route that
          does not exist. All of that is gone; see src/lib/seo/config.ts.
        */}
        <JsonLd data={graph([organizationSchema(), webSiteSchema()])} />

        {/* Additional Meta Tags */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta name="theme-color" content="#C9A84C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Acceding Titans" />
        <meta name="msapplication-TileColor" content="#C9A84C" />
        <meta name="msapplication-TileImage" content="/icon.png" />

        {/*
          No preconnect to fonts.googleapis.com / fonts.gstatic.com any more:
          the brand font is now self-hosted by next/font, so those origins are
          never contacted. The preconnect was pure dead weight.
        */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Google Analytics 4 with Enhanced Tracking */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L0LS146KZG"
          strategy="afterInteractive"
          async
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L0LS146KZG', {
                'page_path': window.location.pathname,
                'page_title': document.title,
                'anonymize_ip': false,
                'allow_google_signals': true,
                'allow_ad_personalization_signals': true,
                'send_page_view': true,
                'cookie_flags': 'SameSite=None;Secure'
              });
              
              // Track all navigation events
              window.addEventListener('popstate', function() {
                gtag('event', 'page_view', {
                  'page_path': window.location.pathname,
                  'page_title': document.title,
                  'page_referrer': document.referrer
                });
              });
              
              // Enable enhanced measurement
              gtag('event', 'page_view', {
                'send_to': 'G-L0LS146KZG',
                'page_title': document.title,
                'page_path': window.location.pathname
              });
            `,
          }}
        />

        {/*
          The previous Google Ads tag was hard-coded to the literal string
          "AW-YOUR_CONVERSION_ID", so it could never attribute a conversion —
          it was a third-party request on every page load that returned an
          error and did nothing. Removed rather than left in place. Re-add it
          once a real conversion ID exists:

          <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXX" strategy="afterInteractive" />
        */}

        {/* Paystack Inline Payment Script */}
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
