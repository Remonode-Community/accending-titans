# SEO runbook — Acceding Titans

How search visibility is configured in this application, what is verified, and
what still needs an owner decision. Written against the actual Next.js App
Router code, not a generic checklist.

**Nothing in this document claims the site is indexed or ranked anywhere.**
Search-engine inclusion can only be confirmed after deployment, by submitting
`sitemap.xml` in Search Console / Bing Webmaster Tools and observing coverage.

---

## 1. Where the code lives

| Concern | File |
| --- | --- |
| Canonical host, brand, curated route list, contact placeholders | `src/lib/seo/config.ts` |
| Title / description / canonical / OG / Twitter builder | `src/lib/seo/metadata.ts` |
| JSON-LD node builders | `src/lib/seo/schema.ts` |
| Sitemap XML serialisation | `src/lib/seo/sitemap-xml.ts` |
| Marketing-page metadata | `src/lib/seo/pages.ts` |
| Server-side catalogue reader (public API) | `src/lib/catalogue.server.ts` |
| `<script type="application/ld+json">` emitter | `src/components/seo/JsonLd.tsx` |
| Visible + schema breadcrumbs | `src/components/seo/Breadcrumbs.tsx` |
| `robots.txt` | `app/robots.ts` |
| Sitemap index | `app/sitemap.xml/route.ts` |
| Sitemap segments | `app/sitemap-*.xml/route.ts` |
| noindex + security headers | `next.config.ts` |
| Web app manifest | `app/manifest.ts` |

**To change the domain:** set `NEXT_PUBLIC_APP_URL` at deploy time. It is read
once in `src/lib/seo/config.ts` and every canonical, sitemap URL and JSON-LD
`@id` derives from it. Do not hard-code a hostname anywhere else.

---

## 2. Indexability policy

| Area | Indexable | Mechanism |
| --- | --- | --- |
| `/`, `/about`, `/faq`, `/support`, `/privacy`, `/terms` | yes | `buildMetadata` |
| `/vtu`, `/vtu/{airtime,data,tv,bills}` | yes | `buildMetadata` |
| `/catalogue` | yes | `generateMetadata` (server) |
| `/catalogue/<id>` | yes | `generateMetadata` (server) |
| `/catalogue/category/<slug>` | yes | `generateMetadata` (server) |
| `/catalogue?q=…` (search) | **no**, follow | canonicalises to `/catalogue` |
| `/catalogue?page=N` (N>1) | yes, self-canonical | crawlable `<a href>` |
| `/multi-currency` ("Coming soon") | **no**, follow | placeholder, excluded from sitemap |
| `/dashboard/*`, `/admin/*`, `/agent/*` | **no**, nofollow | `X-Robots-Tag` header |
| `/auth/*` | **no**, nofollow | `X-Robots-Tag` header |
| `/offline` | **no**, nofollow | `X-Robots-Tag` header |

### Why the private areas use a header, not metadata

`app/dashboard/layout.tsx`, `app/admin/layout.tsx` and `app/agent/layout.tsx`
are all `'use client'` — they gate on a Zustand store — and Next.js forbids
exporting `metadata` from a client component. That is why the application
previously had no `noindex` anywhere and relied solely on `robots.txt`.

`X-Robots-Tag` in `next.config.ts` is set per route pattern and works regardless
of component type.

> **robots.txt is not a security control.** It is a crawler preference and
> protects nothing. Every private route is protected by authentication in the
> Laravel API (`auth:sanctum` + `permission:*` middleware on
> `AccedingTitansV1/routes/api/v1/portfolios.php`). The header is an indexing
> hint layered on top of that, not a replacement for it.

---

## 3. Why the catalogue is now server-rendered

This was the single largest SEO defect. `/catalogue` and `/catalogue/<id>` were
`'use client'` pages that fetched in `useEffect`, which meant:

- the server-rendered HTML contained **zero** business names or links;
- `generateMetadata` was impossible, so neither page had a title, description
  or canonical;
- pagination existed only in React state, so page 2+ had no URL at all.

Now `app/catalogue/page.tsx` and `app/catalogue/[id]/page.tsx` are server
components. They fetch through `src/lib/catalogue.server.ts` (plain `fetch` with
ISR — not `apiClient`, which is browser-oriented) and pass the results to a
client shell that owns only genuine interaction: the search box, filter chips,
scroll-spy tabs, share button.

Filters and pagination are expressed in the URL (`?category=`, `?q=`, `?page=`),
so every view is a real, linkable, server-rendered document.

### Category pages

Categories used to exist only as a `?category=` query filter, which cannot carry
a unique title and competed with `/catalogue` for the same canonical slot.
`/catalogue/category/<slug>` is now a real route with its own title, description,
canonical, breadcrumb trail and `ItemList` schema. `?category=Food` canonicalises
to `/catalogue/category/food`.

The slug is canonical because changing the business URLs would break existing
links. The business name and description are pushed into the title, description
and canonical instead.

---

## 4. Structured data

Emitted server-side, inline in the initial HTML. The previous version used
`next/script strategy="afterInteractive"`, which is injected only after
hydration and is invisible to anything reading the raw response.

| Page | Nodes |
| --- | --- |
| root layout | `Organization`, `WebSite` |
| `/catalogue` | `WebPage`, `ItemList` |
| `/catalogue/<id>` | `WebPage`, `LocalBusiness` (+ offers), `BreadcrumbList` |
| `/catalogue/category/<slug>` | `WebPage`, `ItemList`, `BreadcrumbList` |

`@id` values are stable and cross-referenced, so the entity graph resolves
(every `WebPage.isPartOf` → the site, `breadcrumb.@id` → the `BreadcrumbList`).

### Nothing is fabricated

`src/lib/seo/config.ts` holds `CONTACT` and `SOCIAL_PROFILES` with every
unverified value set to `null` / `[]`. The schema builders **omit** any field
left null rather than emitting a blank or a guess. Today that means no phone
number, no postal address, no founding date and no `sameAs` links are published.

The previous layout published `+234 (0) 700 000 0000`,
`support@ascendingtitans.com`, `foundingDate: "2024"`, a Lagos address, four
social profiles, a `banner.png` that does not exist, and a `WebSite/SearchAction`
pointing at a `/search` route that does not exist. All removed.

Business `LocalBusiness` nodes only include what the member published: name,
description, image, category, and their own contact number. There are no
fabricated ratings, review counts, opening hours or prices. An item is only
wrapped in an `Offer` when the member set a real price; a `null` price means
"price on request" and is advertised as a plain `Product`/`Service`.

### Before launch, replace these

```ts
// src/lib/seo/config.ts
CONTACT.email        = 'support@…'   // real address
CONTACT.phone        = '+234 …'      // real number
CONTACT.address      = { … }         // registered business address
CONTACT.foundingDate = 'YYYY'        // real founding year
SOCIAL_PROFILES      = [ 'https://www.linkedin.com/company/…', … ]
SOCIAL.twitter       = '@…'          // real handle
```

Fill them in and they propagate to every page automatically. The OG share image
is `DEFAULT_OG_IMAGE` (`/icon.png`, 79 KB square). A dedicated 1200×630 card
would render better when the site is shared on social; point that constant at it
when one exists.

---

## 5. Social share cards (Open Graph / Twitter)

### The problem this solved

The only brand asset is `public/icon.png` at **192x192, square**. Social
platforms render previews at roughly 1.91:1. A 1:1 image is letterboxed into a
small thumbnail with empty gutters either side — which is why shared links
looked unimpressive. The metadata compounded it by declaring that same square
file as `width=1200, height=630`, which is a false claim to the crawler and can
get the image cropped or rejected.

### The cards

| Route | Card | Built at |
| --- | --- | --- |
| `/opengraph-image` | crest + brand name + tagline | build time |
| `/twitter-image` | same card | build time |
| `/catalogue/<id>/opengraph-image` | member's cover photo, category, name, description, item count | per request, cached |
| `/catalogue/category/<slug>/opengraph-image` | crest, category name, business count | per request, cached |

All four emit exactly **1200x630** `image/png`, within WhatsApp's 300 KB limit.
Unknown ids and slugs fall back to the generic card rather than returning 500 —
social crawlers cache whatever they fetch, so an error would leave a permanently
blank preview.

### Why the image is set explicitly instead of left to the file convention

Next.js injects `og:image` from `app/opengraph-image.tsx`, but **a page that
exports its own `openGraph` replaces the field rather than merging with it.**
Relying on the convention therefore produced a card on the homepage and *nothing*
on `/about`, `/catalogue` and every other page — this was verified in the
rendered HTML, not assumed.

`buildMetadata()` now derives the card from the route in one place
(`generatedCardFor()`), so a newly added page cannot forget it. The root layout
sets the same explicit value for consistency.

### The brand font on the cards

Satori (which renders `next/og`) cannot read woff2, which is what every modern
user-agent gets from Google Fonts. The font is therefore requested with a
legacy user-agent that returns a raw TTF. Which legacy UA yields which format
was verified against the live endpoint:

| UA | Format returned |
| --- | --- |
| Android 4.0.3 | **TTF** (used) |
| Firefox 27 / IE 11 / Chrome 40 | WOFF |
| IE 6 / MSIE 4 | EOT — breaks the build with "Unsupported OpenType signature" |

`brandFonts()` swallows failures and returns `undefined`, so an offline build
falls back to satori's built-in face rather than failing. Note it must return
`undefined` and **not** `[]`: satori treats an empty `fonts` array as "fonts
supplied but none usable" and throws.

### Verified

All four URLs return `200 image/png` unauthenticated, and all 15 public routes
emit `og:image`, `og:image:width`, `og:image:height`, `og:image:type` and
`twitter:image`. Social crawlers do not execute JavaScript, which is why all of
this is in the server-rendered HTML rather than injected on the client.

Preview caching is on the platform side: Facebook, WhatsApp, LinkedIn and X all
cache fetched images for days to months, so a new card only appears after their
scraper re-crawls. Use a URL-debugger tool (LinkedIn Post Inspector, WhatsApp's
link preview, or `curl` + the Open Graph debugger) rather than expecting an
instant change.

---

`robots.txt` advertises one entry point, `sitemap.xml`, which is a real
`<sitemapindex>`:

| Segment | Contents | Refresh |
| --- | --- | --- |
| `sitemap-businesses.xml` | every published member business | 5 min (ISR) |
| `sitemap-categories.xml` | one URL per non-empty category | 5 min (ISR) |
| `sitemap-pages.xml` | curated static public pages | static |

The whole business catalogue was **absent** from the sitemap before this work.

`sitemap-pages.xml` validates `STATIC_ROUTES` against the real `app/` tree at
build time and **throws** if a listed route has no `page.tsx`. The previous
sitemap listed seven `/services/*` URLs for a directory that does not exist,
producing seven 404s; that class of mistake now fails the build.

`lastModified` uses real data. Note the public projection omits `updated_at`, so
business entries use `created_at` — a truthful creation date beats a fabricated
modification date.

**Scale limit:** businesses are capped at 5,000 per file. Beyond that, split
into numbered segments and list each in `app/sitemap.xml/route.ts`.

---

## 6. robots.txt

Single `User-Agent: *` rule. Public crawling is allowed; private and utility
areas are disallowed. AI discovery agents (GPTBot, ChatGPT-User, OAI-SearchBot,
ClaudeBot, PerplexityBot, Google-Extended, Applebot, Bingbot) are **not**
excluded, so the directory can be found by assistants and answer engines.

Bugs this replaced:

1. `Disallow: /*.xml` matched `/sitemap.xml` itself — the sitemap was forbidden
   from being crawled while being advertised.
2. `Disallow: /*?page=*` blocked every paginated directory page. Google
   explicitly advises against blocking pagination; it is how deep pages are
   discovered.
3. The base URL fallback was the literal string `" https://…"` — a **leading
   space** — and `NEXT_PUBLIC_APP_URL` was never set, so the broken fallback was
   always used.

To opt out of AI *training* crawlers while keeping search and answer-engine
discovery, add a rule above the wildcard in `app/robots.ts` with
`userAgent: ['CCBot', 'GPTBot', 'Google-Extended']` and `disallow: '/'`.

---

## 7. Search console setup (post-deployment)

1. Set `NEXT_PUBLIC_APP_URL=https://accedingtitans.com` in the deploy
   environment. Nothing else is hard-coded.
2. Verify the site is reachable at that host and that
   `https://accedingtitans.com/robots.txt` lists the right `Sitemap:` line.
3. **Google Search Console** → add property → URL prefix → confirm ownership
   (DNS TXT is the option that does not depend on the deployment).
4. **Bing Webmaster Tools** → import from Search Console, or verify with a
   `msft` meta tag.
5. Submit `https://accedingtitans.com/sitemap.xml` in both.
6. Watch Coverage for: `Discovered – currently not indexed` on
   `/catalogue/category/*` (would mean too few businesses per category) and any
   `Soft 404` (would mean a sitemap entry with no content).
7. Run the Rich Results Test against one business URL and one category URL to
   confirm `LocalBusiness` and `BreadcrumbList` validate.

No verification meta tag has been added, because it requires a token only the
account owner can supply.

---

## 8. Known gaps and deliberate omissions

- **The brand font was never loading.** `globals.css` declared
  `'Plus Jakarta Sans'` first in `--font-sans`, but there was no `next/font`
  import and no Google Fonts stylesheet, so every page rendered in `system-ui`
  while still paying a preconnect to `fonts.googleapis.com`. Now self-hosted via
  `next/font/google`. **This downloads the font during `next build`** — on a
  machine with no outbound access, switch to `next/font/local`.
- **`/multi-currency` is a "Coming soon" placeholder** and is noindex + excluded
  from the sitemap. Flip `index` to `true` and add it to `STATIC_ROUTES` when it
  ships.
- **Five footer "quick links" all point at `/#features`.** They carry no
  descriptive anchor text and no distinct destination. Needs a content decision.
- **The footer still shows the old-domain placeholders**
  `support@ascendingtitans.com` and `+2347000000000` as live `mailto:`/`tel:`
  links. Those were removed from structured data but remain user-facing.
- **VTU transaction backend is incomplete.** The `/vtu/*` pages have genuine
  written feature copy and are legitimately indexable, but `payment.service.ts`
  calls `/vtu/pay`, `/transactions/data/purchase` and `/transactions/bills/pay`,
  none of which exist. A visitor can land from search and be unable to complete
  a purchase. Worth resolving before investing in ranking these pages.
- **No per-business custom SEO fields.** Deliberate. Free-form title/description
  editing by members is an abuse vector (keyword injection, spam). Metadata is
  derived from the business's own published name and description. If admins need
  a per-listing `noindex` switch for moderation, that is a backend migration
  and should be admin-only.
