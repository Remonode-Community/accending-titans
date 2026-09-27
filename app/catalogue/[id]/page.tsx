'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Eye,
  ImageOff,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Store,
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

  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

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

  const load = async () => {
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
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const filteredItems =
    typeFilter === 'all' ? items : items.filter((i) => i.item_type === typeFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <LandingTopbar />
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-32 lg:px-8">
          <div className="h-56 animate-pulse rounded-2xl bg-gray-200/70" />
          <div className="mt-8 space-y-3">
            <div className="h-7 w-1/3 animate-pulse rounded bg-gray-200/70" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200/70" />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200/70" />
            ))}
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
        <div className="mx-auto max-w-3xl px-5 pb-20 pt-32 lg:px-8">
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
  const businessWhatsApp = whatsappLink(
    business.whatsapp_number ?? business.owner?.whatsapp_number,
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <LandingTopbar />

      {/* ── Cover ── */}
      <div className="relative h-64 w-full overflow-hidden bg-[#0f1115] sm:h-80">
        {cover ? (
          <Image
            src={cover}
            alt={business.business_name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#141821] to-[#0f1115]">
            <Building2 className="h-16 w-16 text-[#C9A84C]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-5xl px-5 pb-8 lg:px-8">
            <Link
              href="/catalogue"
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft size={13} />
              All businesses
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {business.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C] px-2.5 py-1 text-[11px] font-bold text-white">
                      Featured
                    </span>
                  )}
                  {business.business_category && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      <MapPin size={10} />
                      {business.business_category}
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {business.business_name}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/70">
                  {business.owner?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Store size={13} />
                      {business.owner.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Package size={13} />
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye size={13} />
                    {business.views_count}{' '}
                    {business.views_count === 1 ? 'view' : 'views'}
                  </span>
                </div>
              </div>

              {businessWhatsApp && (
                <a
                  href={businessWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#C9A84C]/30 transition hover:bg-[#B8962E]"
                >
                  <MessageCircle size={16} />
                  Contact on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        {business.business_description && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-gray-900">About</h2>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {business.business_description}
            </p>
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Catalogue <span className="text-gray-400">({items.length})</span>
            </h2>

            {items.length > 0 && (
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
                {(['all', 'product', 'service'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    aria-pressed={typeFilter === t}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                      typeFilter === t
                        ? 'bg-[#C9A84C] text-white'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
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
              title="No items listed yet"
              description="This business has not published any items yet. Get in touch to ask about what they offer."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <PublicItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* SEO / sharing */}
        <section className="mt-12 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/5 to-[#FDFAF3] p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            Want your business listed too?
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-600">
            Publish your products and services and reach thousands of entrepreneurs in the
            community.
          </p>
          <Link
            href="/dashboard/catalogue"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
          >
            Create your catalogue
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PublicItemCard({ item }: { item: PortfolioItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const cover = item.image_urls?.[0];

  const contact = item.whatsapp_dm_link ?? null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-[#C9A84C]/40 hover:shadow-md">
      <div className="relative h-44 flex-shrink-0 overflow-hidden bg-gray-50">
        {cover && !imageFailed ? (
          <Image
            src={cover}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-200">
            <ImageOff size={26} />
            <span className="text-[11px] font-medium">No image</span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold capitalize text-gray-700 shadow-sm">
          {item.item_type}
        </span>

        {item.image_urls?.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            +{item.image_urls.length - 1}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#FDFAF3] px-3 py-1.5 text-xs font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-white"
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
