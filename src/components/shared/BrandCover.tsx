import { Building2 } from 'lucide-react';

/**
 * On-brand fallback cover for a business/member header.
 *
 * Used when the member has not uploaded a cover image, so the header never
 * collapses to an empty grey box.
 *
 * Extracted from the public business page (app/catalogue/[id]/BusinessProfile.tsx)
 * so the dashboard header and the public page render the identical treatment
 * rather than two near-copies that drift apart.
 */
export function BrandCover({ iconSize = 48 }: { iconSize?: number }) {
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
        <Building2 style={{ height: iconSize, width: iconSize }} className="text-[#B8962E]/30" />
      </div>
    </div>
  );
}

/**
 * "Member since 2024" — the joined-date treatment used on both the public
 * business page and the member dashboard header.
 *
 * Returns null for a missing or unparseable date so the caller can simply omit
 * the meta item rather than printing "Member since Invalid Date".
 */
export function memberSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Member since ${d.getFullYear()}`;
}
