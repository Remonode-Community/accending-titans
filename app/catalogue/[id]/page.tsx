'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Eye,
  ImageOff,
  Layers,
  MessageCircle,
  Package,
  RefreshCw,
  Share2,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { LandingTopbar } from '@/components/LandingTopbar';
import { Footer } from '@/components/shared/Footer';
import { EmptyState } from '@/components/shared/EmptyState';
import { portfolioService } from '@/services/portfolio.service';
import { formatCurrency } from '@/utils/format.utils';
import type { PortfolioItem, PublicPortfolio } from '@/types/portfolio.types';

/** Derive a wa.me deep link from a stored number, if one is available. */
function whatsappLink(number: string | null | undefined, message?: string): string | null {
  if (!number) return null;

  const digits = number.replace(/[^\d]/g, '');
  if (digits.length < 7) return null;

  // URLSearchParams (not encodeURIComponent) so characters like an apostrophe in
  // a business name are percent-encoded instead of landing raw in the query.
  const text = message ? `?${new URLSearchParams({ text: message }).toString()}` : '';
  return `https://wa.me/${digits}${text}`;
}

/** "Member since 2026" — LinkedIn-style founded/joined meta. */
function memberSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Member since ${d.getFullYear()}`;
}

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'contact', label: 'Contact' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Shared card surface so every panel matches the brand system. */
const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

export default function PublicBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const businessId = Number(id);

  const [business, setBusiness] = useState<PublicPortfolio | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [activeTab, setActiveTab] = useState<TabId>('about');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isInteger(businessId) || businessId <= 0) {
      setNotFoundState(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await portfolioService.getPortfolio(businessId);

      if (res.success && res.data?.portfolio) {
        setBusiness(res.data.portfolio);
        setItems(res.data.portfolio.items ?? []);
      } else if (res.code === 404) {
        // Not published, or hidden by an admin.
        setNotFoundState(true);
      } else if (res.success) {
        setNotFoundState(true);
      } else {
        setError(res.message || 'We could not load this business.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We could not load this business.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Highlight the tab for whichever section is currently in view.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!business) return;

    let frame = 0;

    // The last section whose top has passed the threshold wins. This always
    // resolves to a tab (defaulting to the first), so scrolling back to the top
    // can never leave a stale tab highlighted.
    const pick = () => {
      frame = 0;
      const threshold = 180;
      let current: TabId = 'about';

      for (const t of TABS) {
        const el = sectionRefs.current[t.id];
        if (el && el.getBoundingClientRect().top - threshold <= 0) {
          current = t.id;
        }
      }

      // At the very bottom, always highlight the final tab. On a short page the
      // last section can sit permanently below the threshold and never win.
      const se = document.scrollingElement;
      if (se && se.scrollTop + se.clientHeight >= se.scrollHeight - 2) {
        current = TABS[TABS.length - 1].id;
      }

      setActiveTab(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [business]);

  const filteredItems =
    typeFilter === 'all' ? items : items.filter((i) => i.item_type === typeFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <LandingTopbar />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 lg:px-6">
          <div className={CARD}>
            <div className="h-40 animate-pulse rounded-t-2xl bg-gray-200/70 sm:h-52" />
            <div className="space-y-3 p-6">
              <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200/70" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200/70" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200/70 sm:w-64" />
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-2xl bg-gray-200/70" />
              <div className="h-80 animate-pulse rounded-2xl bg-gray-200/70" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-gray-200/70" />
          </div>
        </div>
      </div>
    );
  }

  if (notFoundState) {
    notFound();
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <LandingTopbar />
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 lg:px-6">
          <EmptyState
            icon={RefreshCw}
            title="Something went wrong"
            description={error ?? 'We could not load this business right now.'}
            action={{ label: 'Try again', onClick: () => void load(), icon: RefreshCw }}
            secondaryAction={{
              label: 'Back to directory',
              onClick: () => {
                window.location.href = '/catalogue';
              },
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const cover = business.cover_image_url ?? business.profile_image_url;
  const logo = business.profile_image_url;
  const businessWhatsApp = whatsappLink(
    business.whatsapp_number ?? business.owner?.whatsapp_number,
    business.business_name
      ? `Hi ${business.business_name}, I found you on Acceding Titans.`
      : undefined,
  );
  const since = memberSince(business.created_at);

  const handleShare = async () => {
    const url = window.location.href;
    const payload = {
      title: business.business_name,
      text: business.business_description ?? business.business_name,
      url,
    };

    // Native share sheet where available (mobile), clipboard elsewhere.
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // User dismissed the sheet — fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing else to do */
    }
  };

  const scrollTo = (tabId: TabId) => {
    const node = sectionRefs.current[tabId];
    if (!node) return;
    setActiveTab(tabId);
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <LandingTopbar />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 lg:px-6">
        <Link
          href="/catalogue"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#C9A84C]"
        >
          <ArrowLeft size={15} />
          All businesses
        </Link>

        {/* ══ Company header ══ */}
        <header className={CARD}>
          {/* Banner */}
          <div className="relative h-36 overflow-hidden rounded-t-2xl sm:h-48 lg:h-56">
            {cover ? (
              <Image
                src={cover}
                alt={`${business.business_name} cover`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <BrandBanner />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          </div>

          <div className="px-5 pb-5 sm:px-7">
            {/* Logo, overlapping the banner like LinkedIn's company avatar */}
            <div className="-mt-12 flex items-end gap-4 sm:-mt-16">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_10px_35px_rgba(0,0,0,0.12)] sm:h-28 sm:w-28">
                {logo ? (
                  <Image
                    src={logo}
                    alt={business.business_name}
                    fill
                    sizes="112px"
                    className="object-contain p-1.5"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C9A84C] to-[#B8962E]">
                    <Building2 className="h-9 w-9 text-white/90" />
                  </div>
                )}
              </div>

              {/* Action buttons — align with the logo on desktop */}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 pb-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
                >
                  {copied ? <Check size={15} /> : <Share2 size={15} />}
                  {copied ? 'Link copied' : 'Share'}
                </button>

                {businessWhatsApp && (
                  <a
                    href={businessWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E]"
                  >
                    <MessageCircle size={16} />
                    Message
                  </a>
                )}
              </div>
            </div>

            {/* Name, tagline, meta */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  {business.business_name}
                </h1>
                {business.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#B8962E]">
                    <Sparkles size={11} />
                    Featured
                  </span>
                )}
              </div>

              {/*
                LinkedIn shows a short tagline under the company name and the
                full text in the About panel. We only store one description, so
                only show a header tagline when the text is long enough that the
                two genuinely differ — otherwise it just prints twice.
              */}
              {business.business_description &&
                business.business_description.length > 140 && (
                  <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    {business.business_description}
                  </p>
                )}

              {/* LinkedIn's dot-separated meta line */}
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
                {business.business_category && (
                  <>
                    <span className="font-semibold text-gray-700">
                      {business.business_category}
                    </span>
                    <Dot />
                  </>
                )}
                <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                <Dot />
                <span className="inline-flex items-center gap-1">
                  <Eye size={13} />
                  {business.views_count}{' '}
                  {business.views_count === 1 ? 'view' : 'views'}
                </span>
                {business.owner?.name && (
                  <>
                    <Dot />
                    <span className="inline-flex items-center gap-1">
                      <Store size={13} />
                      {business.owner.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sticky tab bar */}
            <nav className="sticky top-20 z-30 -mx-5 mt-5 border-t border-[#e5e7eb] bg-white/95 px-5 backdrop-blur sm:-mx-7 sm:px-7">
              <ul className="-mb-px flex gap-1 overflow-x-auto">
                {TABS.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(t.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`relative whitespace-nowrap px-3.5 py-3.5 text-sm font-bold transition ${
                          isActive
                            ? 'text-[#C9A84C]'
                            : 'text-gray-500 hover:bg-[#FDFAF3] hover:text-gray-800'
                        }`}
                      >
                        {t.label}
                        {isActive && (
                          <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#C9A84C]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </header>

        {/* ══ Two-column body, LinkedIn proportions ≈ 70 / 30 ══ */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── Main column ── */}
          <main className="min-w-0 space-y-6">
            {/* About */}
            <section
              id="about"
              ref={(n) => {
                sectionRefs.current.about = n;
              }}
              className={`${CARD} scroll-mt-40 p-5 sm:p-7`}
            >
              <h2 className="text-lg font-black tracking-tight text-gray-900">About</h2>

              {business.business_description ? (
                <ExpandableText text={business.business_description} />
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  This business hasn&apos;t added a description yet.
                </p>
              )}
            </section>

            {/* Catalogue */}
            <section
              id="catalogue"
              ref={(n) => {
                sectionRefs.current.catalogue = n;
              }}
              className={`${CARD} scroll-mt-40 p-5 sm:p-7`}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight text-gray-900">
                  Catalogue{' '}
                  <span className="font-semibold text-gray-400">({items.length})</span>
                </h2>

                {items.length > 0 && (
                  <div className="inline-flex rounded-xl border border-[#e5e7eb] bg-[#f8f8f8] p-1">
                    {(['all', 'product', 'service'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        aria-pressed={typeFilter === t}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                          typeFilter === t
                            ? 'bg-[#C9A84C] text-white shadow-sm'
                            : 'text-gray-500 hover:bg-white hover:text-gray-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={
                    items.length === 0
                      ? 'No items listed yet'
                      : `No ${typeFilter}s listed`
                  }
                  description={
                    items.length === 0
                      ? 'This business has not published any items yet. Get in touch to ask about what they offer.'
                      : 'Try a different filter to see what they do offer.'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredItems.map((item) => (
                    <PublicItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            {/* Contact */}
            <section
              id="contact"
              ref={(n) => {
                sectionRefs.current.contact = n;
              }}
              className={`${CARD} scroll-mt-40 p-5 sm:p-7`}
            >
              <h2 className="text-lg font-black tracking-tight text-gray-900">Contact</h2>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                {business.owner && (
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#FDFAF3] p-3.5">
                    {business.owner.profile_photo_url ? (
                      <Image
                        src={business.owner.profile_photo_url}
                        alt={business.owner.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#B8962E]">
                        <User size={19} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {business.owner.name}
                      </p>
                      <p className="text-xs text-gray-500">Business owner</p>
                    </div>
                  </div>
                )}

                {businessWhatsApp && (
                  <a
                    href={businessWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E] sm:shrink-0"
                  >
                    <MessageCircle size={16} />
                    Message on WhatsApp
                  </a>
                )}
              </div>

              {!businessWhatsApp && !business.owner?.name && (
                <p className="mt-2 text-sm text-gray-500">
                  This business hasn&apos;t published contact details yet.
                </p>
              )}
            </section>
          </main>

          {/* ── Right rail ── (scrolls with the page, as on LinkedIn) ── */}
          <aside className="space-y-6">
            <section
              className={`${CARD} p-5 sm:p-6`}
            >
              <h2 className="text-base font-black tracking-tight text-gray-900">
                Company details
              </h2>

              <dl className="mt-4 space-y-3.5">
                {business.business_category && (
                  <DetailRow icon={Layers} label="Industry" value={business.business_category} />
                )}
                <DetailRow
                  icon={Package}
                  label="Listings"
                  value={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                />
                <DetailRow
                  icon={Eye}
                  label="Page views"
                  value={String(business.views_count)}
                />
                {since && <DetailRow icon={CalendarDays} label="Joined" value={since.replace('Member since ', '')} />}
                {business.owner?.name && (
                  <DetailRow icon={User} label="Owner" value={business.owner.name} />
                )}
              </dl>
            </section>

            <section className="rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#FDFAF3] to-[#C9A84C]/10 p-5 text-center sm:p-6">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9A84C] text-white">
                <Store size={20} />
              </div>
              <h2 className="mt-3.5 text-base font-black text-gray-900">
                Want your business listed too?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Publish your products and services and reach thousands of
                entrepreneurs in the community.
              </p>
              <Link
                href="/dashboard/catalogue"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
              >
                Create your catalogue
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ── small building blocks ── */

function Dot() {
  return (
    <span aria-hidden className="text-gray-300">
      ·
    </span>
  );
}

/** On-brand fallback banner: cream → brand gold with a soft diagonal texture. */
function BrandBanner() {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-[#FDFAF3] via-[#F0E2B8] to-[#C9A84C]">
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #B8962E 0 1px, transparent 1px 14px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Building2 className="h-12 w-12 text-[#B8962E]/30" />
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
      <div className="min-w-0">
        <dt className="text-xs font-medium text-gray-500">{label}</dt>
        <dd className="truncate text-sm font-semibold text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

/** LinkedIn's "…see more" behaviour, without a JS height-measure loop. */
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 320;

  if (!isLong) {
    return (
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
        {text}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-gray-600 ${
          expanded ? '' : 'line-clamp-4'
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-sm font-bold text-[#C9A84C] transition hover:text-[#B8962E]"
      >
        {expanded ? 'Show less' : '…see more'}
      </button>
    </div>
  );
}

function PublicItemCard({ item }: { item: PortfolioItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const cover = item.image_urls?.[0];
  const contact = item.whatsapp_dm_link ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition hover:border-[#C9A84C]/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.07)]">
      <div className="relative h-44 flex-shrink-0 overflow-hidden bg-[#FDFAF3]">
        {cover && !imageFailed ? (
          <Image
            src={cover}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[#C9A84C]/40">
            <ImageOff size={24} />
            <span className="text-[11px] font-medium">No image</span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold capitalize text-gray-700 shadow-sm">
          {item.item_type}
        </span>

        {item.image_urls?.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            +{item.image_urls.length - 1}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <p className="text-sm font-black text-gray-900">
            {item.price !== null && item.price !== undefined
              ? formatCurrency(item.price)
              : 'Price on request'}
          </p>

          {contact && (
            <a
              href={contact}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#FDFAF3] px-3 py-1.5 text-xs font-semibold text-[#B8962E] transition hover:bg-[#C9A84C] hover:text-white"
            >
              <MessageCircle size={12} />
              Enquire
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
