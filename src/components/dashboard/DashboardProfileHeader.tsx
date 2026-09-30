'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Eye, MapPin, Package, Pencil, Store, User } from 'lucide-react';
import { BrandCover, memberSince } from '@/components/shared/BrandCover';
import type { User as AuthUser } from '@/types/api.types';
import type { Portfolio } from '@/types/portfolio.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

/** The member's own catalogue, or null when they have not created one. */
export type DashboardProfile = Pick<
  Portfolio,
  | 'id'
  | 'business_name'
  | 'business_category'
  | 'business_description'
  | 'cover_image_url'
  | 'profile_image_url'
  | 'items_count'
  | 'views_count'
  | 'is_featured'
  | 'created_at'
> | null;

/**
 * `user` is nullable because useAuth() can resolve to null while the session is
 * being rehydrated. Rather than assert a non-null user, every field below
 * degrades to a sensible placeholder, so the header can never crash mid-load.
 */
function initials(user: AuthUser | null): string {
  const first = user?.first_name?.trim()?.[0] ?? '';
  const last = user?.last_name?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || 'AT';
}

function fullName(user: AuthUser | null): string {
  const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  return name || 'Acceding Titans member';
}

/**
 * The member's profile header, modelled on a LinkedIn company page:
 * cover image, an avatar that overlaps its lower edge, the name as the
 * document's <h1>, a short tagline, and a dot-separated meta line.
 *
 * It answers "who am I here, and what is my business called?" before any
 * numbers, which is what the previous header — a bare "Overview" heading and a
 * gold balance block — never did.
 *
 * Everything shown is real member data. There is no location, follower count
 * or rating, because none of those exist on the account.
 */
export function DashboardProfileHeader({
  user,
  profile,
  dateLabel,
}: {
  user: AuthUser | null;
  profile: DashboardProfile;
  dateLabel?: string;
}) {
  /*
   * Two identities, one header.
   *
   * The MEMBER is the subject of this page: it is their dashboard, so their
   * name is the <h1> and their own photo is the large avatar. Their BUSINESS is
   * shown as an entity attached to them — a logo badge on the avatar corner, the
   * business name beneath, and its category/stats in the meta line. Previously
   * the business name replaced the member's name entirely, which made the page
   * read as a company page rather than a person's.
   */
  const memberName = fullName(user);
  const memberAvatar = user?.profile_photo_url || null;
  const businessName = profile?.business_name?.trim() || null;
  const businessAvatar = profile?.profile_image_url || null;
  const coverSrc = profile?.cover_image_url || null;

  // A business badge that just repeats the member's photo adds nothing.
  const showBusinessBadge = Boolean(businessAvatar && businessAvatar !== memberAvatar);

  /*
   * `user.created_at` is humanised by the API ("2 years ago") and cannot be
   * parsed into a date, so the member's join year comes from `joined_at`, the
   * ISO-8601 field the API returns alongside it. The business date comes from
   * the portfolio, which does return a real timestamp.
   */
  const since = memberSince(user?.joined_at);
  const businessSince = profile?.created_at ? memberSince(profile.created_at) : null;
  const tier = user?.current_rank || (user?.is_titan_member ? 'Titan Member' : 'Member');

  /**
   * A tagline only helps when it differs from the full description. We store
   * one description field, so showing it twice — truncated up here and in full
   * below — just prints the same sentence twice.
   */
  const tagline =
    profile?.business_description && profile.business_description.length > 140
      ? profile.business_description
      : null;

  return (
    <section className={`${CARD} overflow-hidden`}>
      {/* Cover — the business cover, since that is the imagery they own. */}
      <div className="relative h-28 sm:h-40 lg:h-48">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={`${businessName ?? memberName} cover image`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <BrandCover iconSize={44} />
        )}
        {/* Keeps white text legible over an arbitrary member photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent"
        />
      </div>

      <div className="px-5 pb-5 sm:px-7">
        {/*
          Member avatar, overlapping the cover like a LinkedIn profile, with the
          business logo as a small badge on its lower-right corner — the same
          relationship Facebook and LinkedIn use for "person who owns page".

          This row deliberately contains ONLY the avatar. The action buttons used
          to sit here too, bottom-aligned with it — but the row's bottom is
          pinned to the avatar, which overhangs the cover, so the buttons landed
          on top of the member's cover photo. They now sit beside the name
          below, which is always on white at every breakpoint.
        */}
        <div className="-mt-12 flex items-end sm:-mt-16">
          <div className="relative">
            {/* Member photo. */}
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_10px_35px_rgba(0,0,0,0.12)] sm:h-24 sm:w-24">
              {memberAvatar ? (
                <Image
                  src={memberAvatar}
                  alt={`${memberName} profile photo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C9A84C] to-[#B8962E] text-lg font-black text-white">
                  {initials(user)}
                </div>
              )}
            </div>

            {/* Business logo badge, overlapping the corner. */}
            {showBusinessBadge && (
              <div
                title={businessName ?? 'Business'}
                className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-white shadow-[0_4px_14px_rgba(0,0,0,0.16)] sm:h-11 sm:w-11"
              >
                <Image
                  src={businessAvatar as string}
                  alt={`${businessName ?? 'Business'} logo`}
                  fill
                  sizes="44px"
                  className="object-contain p-0.5"
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>

        {/* Member name + actions, then business, then tagline + meta. */}
        <div className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                  {memberName}
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#FDFAF3] px-2.5 py-1 text-[11px] font-semibold capitalize text-gray-600">
                  <User size={11} className="text-[#C9A84C]" />
                  {tier}
                </span>

                {profile?.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#B8962E]">
                    <BadgeCheck size={12} />
                    Featured
                  </span>
                )}
              </div>

              {/*
                The business, attached to the member. Linked to the public page
                when one exists, so the member can check exactly what customers
                see from the same screen.
              */}
              {businessName && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Store size={12} className="text-[#C9A84C]" />
                    Business
                  </span>
                  {profile ? (
                    <Link
                      href={`/catalogue/${profile.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-gray-900 transition hover:text-[#C9A84C]"
                    >
                      {businessName}
                      <ArrowUpRight size={13} className="text-[#C9A84C]" />
                    </Link>
                  ) : (
                    <span className="font-bold text-gray-900">{businessName}</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
              >
                <Pencil size={14} />
                Edit profile
              </Link>

              {profile && (
                <Link
                  href={`/catalogue/${profile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#C9A84C]/25 transition hover:bg-[#B8962E]"
                >
                  My public page
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {tagline && (
            <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              {tagline}
            </p>
          )}

          {/*
            LinkedIn's dot-separated meta line, ordered member-first: who you
            are, then what your business is. Every item is omitted when its data
            is absent, so the line never ends on a dangling separator.
          */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
            {since && (
              <>
                <span className="inline-flex items-center gap-1">
                  <User size={13} className="text-[#C9A84C]" />
                  {since}
                </span>
                {profile && <Dot />}
              </>
            )}

            {profile?.business_category && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                  <MapPin size={13} className="text-[#C9A84C]" />
                  {profile.business_category}
                </span>
                <Dot />
              </>
            )}

            {profile && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Package size={13} className="text-[#C9A84C]" />
                  {profile.items_count} {profile.items_count === 1 ? 'item' : 'items'}
                </span>
                <Dot />
                <span className="inline-flex items-center gap-1">
                  <Eye size={13} className="text-[#C9A84C]" />
                  {profile.views_count} {profile.views_count === 1 ? 'view' : 'views'}
                </span>
              </>
            )}

            {businessSince && (
              <>
                {profile && <Dot />}
                <span className="inline-flex items-center gap-1">
                  <Store size={13} className="text-[#C9A84C]" />
                  Business {businessSince.replace('Member since ', 'since ')}
                </span>
              </>
            )}

            {dateLabel && (
              <>
                {/* Only separate the date if something before it actually
                    rendered, otherwise the line opens with a stray dot. */}
                {(since || profile) && <Dot />}
                <span>{dateLabel}</span>
              </>
            )}
          </div>

          {/* Members with no catalogue get a route to fix that, instead of an
              empty meta line that reads as a broken profile. */}
          {!profile && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-[#C9A84C]/40 bg-[#FDFAF3] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Your business profile is not set up
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Add a business name, logo and what you sell so customers can find you.
                </p>
              </div>
              <Link
                href="/dashboard/catalogue"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B8962E]"
              >
                Set it up
                <Pencil size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-gray-300">
      ·
    </span>
  );
}
