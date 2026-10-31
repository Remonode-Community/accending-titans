/**
 * Birthday planning helpers shared by the member form and the admin views.
 *
 * The favourite colour is free text — a member can pick a swatch or type
 * "Burgundy" — so a hex value only exists for the colours we actually offer.
 * Callers use `birthdayColorHex()` to decide whether a swatch can be drawn,
 * rather than fabricating a dot for a colour we cannot represent.
 */

export interface BirthdayColor {
  name: string;
  hex: string;
}

/** The swatches the member form offers, in display order. */
export const BIRTHDAY_COLORS: BirthdayColor[] = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gold', hex: '#C9A84C' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'Purple', hex: '#7C3AED' },
];

const BIRTHDAY_COLOR_HEX = new Map(
  BIRTHDAY_COLORS.map((color) => [color.name.toLowerCase(), color.hex])
);

/**
 * The hex for a known colour name, or null when the member typed something
 * custom. Matching is case-insensitive and ignores surrounding whitespace.
 */
export function birthdayColorHex(name: string | null | undefined): string | null {
  if (!name) return null;

  return BIRTHDAY_COLOR_HEX.get(name.trim().toLowerCase()) ?? null;
}
