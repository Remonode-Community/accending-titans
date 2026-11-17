/**
 * Calendar presentation helpers.
 *
 * Pure functions only — no store or service imports, so these can be used by
 * both the member hub and the admin screen (and tested) without dragging in
 * the API client.
 *
 * The countdown vocabulary is fixed by the product requirement: Today,
 * Tomorrow, In N Days, Next Week, Later. Anything past a week inside the
 * 92-day window falls back to a date label rather than "In 47 Days", because
 * a rail of big numbers stops being scannable at that point.
 */

import type { CalendarEventKind, CalendarOccurrence } from '@/types/calendar.types';

/** `2026-06-15` → a local Date at midnight (avoids UTC off-by-one). */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Whole days from today to the given `YYYY-MM-DD` date. */
export function daysUntil(date: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = parseISODate(date);
  const ms = target.getTime() - start.getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * The countdown label for a rail row.
 *
 * Returns one of: Today, Tomorrow, In N Days, Next Week, In <Month D>.
 */
export function countdownLabel(days: number, date: string): string {
  if (days < 0) return 'Passed';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 6) return `In ${days} Days`;
  if (days <= 7) return 'Next Week';
  return `In ${formatShortDate(date)}`;
}

/** `June 15` — month name plus day, no year anywhere. */
export function formatShortDate(date: string): string {
  return parseISODate(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/** `Mon, Jun 15` for detail rows. */
export function formatWeekdayDate(date: string): string {
  return parseISODate(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Which rail bucket a row belongs to — mirrors the backend's own counts. */
export type DayBucket = 'today' | 'tomorrow' | 'week' | 'later';

export function bucketFor(days: number): DayBucket {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return 'week';
  return 'later';
}

export const BUCKET_LABELS: Record<DayBucket, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This week',
  later: 'Later this month',
};

/**
 * Group occurrences by their date, preserving the backend's ordering
 * (date, then source, then id) so several birthdays on one day stay stable
 * across refetches.
 */
export function groupByDate(events: CalendarOccurrence[]): Array<{ date: string; items: CalendarOccurrence[] }> {
  const groups: Array<{ date: string; items: CalendarOccurrence[] }> = [];
  const index = new Map<string, number>();

  events.forEach((event) => {
    const at = index.get(event.date);
    if (at === undefined) {
      index.set(event.date, groups.length);
      groups.push({ date: event.date, items: [event] });
    } else {
      groups[at].items.push(event);
    }
  });

  return groups;
}

/** Restrict a list to one bucket (used by the "show all / just today" toggles). */
export function filterBucket(events: CalendarOccurrence[], bucket: DayBucket): CalendarOccurrence[] {
  return events.filter((event) => bucketFor(event.days_until) === bucket);
}

/**
 * Category colour key — restrained, one hue per kind so the grid never
 * becomes a rainbow. `source` is shown with a badge/label instead of colour
 * so colour alone never carries meaning (colour-blind safe).
 */
export function kindClass(kind: CalendarEventKind): string {
  switch (kind) {
    case 'birthday':
      return 'cal-chip-birthday';
    case 'reminder':
      return 'cal-chip-reminder';
    default:
      return 'cal-chip-event';
  }
}

export function kindLabel(kind: CalendarEventKind): string {
  switch (kind) {
    case 'birthday':
      return 'Birthday';
    case 'reminder':
      return 'Reminder';
    default:
      return 'Event';
  }
}

export function sourceLabel(source: CalendarOccurrence['source']): string {
  return source === 'member' ? 'Member' : 'Managed';
}

/** "In 3 Days" / "Today" for the badge on a detail modal. */
export function detailCountdown(event: CalendarOccurrence): string {
  return countdownLabel(event.days_until, event.date);
}

/**
 * Map a calendar occurrence onto the shape react-big-calendar expects.
 *
 * rbc wants `start`/`end` Date objects; a birthday is an all-day entry, so
 * the end is the start plus one day (rbc renders `[start, end)`).
 */
export function toRbcEvent(event: CalendarOccurrence): CalendarEvent & CalendarOccurrence {
  const start = parseISODate(event.date);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);

  return { ...event, title: event.title, start, end, allDay: true };
}

/** The shape rbc needs — declared structurally so we don't depend on its types. */
export interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  [key: string]: unknown;
}

/** Month heading: `June 2026`. */
export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** `June` — for section sub-headings. */
export function monthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
}
