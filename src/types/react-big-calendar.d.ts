/**
 * Minimal local typings for `react-big-calendar` v1.20.
 *
 * The package ships no `exports` types entry and `@types/react-big-calendar`
 * is not installed, so without this file every import would be `any` under
 * `strict`. Only the surface this project actually uses is declared — the
 * Calendar component, the date-fns localizer, the `Views`/`Navigate`
 * constants, and the three component slots we override (toolbar, event).
 *
 * Anything not modelled here is intentionally reachable through the
 * `extraProps` bag on our own wrappers rather than by widening these types.
 */

declare module 'react-big-calendar' {
  import type { ComponentType, ReactNode } from 'react';

  // ── Dates ────────────────────────────────────────────────────────────

  /** rbc's own date representation: a Date, or anything `Date` can be built from. */
  export type DateLike = Date | string | number;

  export interface CalendarLocalizer {
    format(value: DateLike, format: string, culture?: string): string;
    firstOfWeek(culture?: string): number;
    startOf(value: DateLike, unit: string): Date;
    endOf(value: DateLike, unit: string): Date;
    add(value: DateLike, amount: number, unit: string): Date;
    range(start: DateLike, end: DateLike, unit?: string): Date[];
    minutes(value: DateLike): number;
    getRange(start: DateLike, end: DateLike, culture?: string): { start: Date; end: Date };
    merge(date: DateLike, time: DateLike): Date;
    inRange(day: DateLike, start: DateLike, end: DateLike): boolean;
    lt(a: DateLike, b: DateLike): boolean;
    lte(a: DateLike, b: DateLike): boolean;
    gt(a: DateLike, b: DateLike): boolean;
    gte(a: DateLike, b: DateLike): boolean;
    eq(a: DateLike, b: DateLike): boolean;
    neq(a: DateLike, b: DateLike): boolean;
    cmp(a: DateLike, b: DateLike): number;
    ceil(value: DateLike, unit: string): Date;
    floor(value: DateLike, unit: string): Date;
    offset(date: DateLike, amount: number, unit?: string): Date;
    sameDay(a: DateLike, b: DateLike): boolean;
    sameMonth(a: DateLike, b: DateLike): boolean;
    toCulture(value: DateLike): Date;
    isNaN(date: DateLike): boolean;
  }

  export interface DateFnsLocalizerSpec {
    format: (value: Date | number | string, formatStr: string, options?: { locale?: unknown }) => string;
    parse: (value: string, formatStr: string, referenceDate: Date, options?: { locale?: unknown }) => Date;
    startOfWeek: (date: Date | number, options?: { weekStartsOn?: number; locale?: unknown }) => Date;
    getDay: (date: Date | number) => number;
    locales?: Record<string, unknown>;
  }

  export function dateFnsLocalizer(spec: DateFnsLocalizerSpec): CalendarLocalizer;

  // ── Events ───────────────────────────────────────────────────────────

  /**
   * The generic event record. Our own `CalendarOccurrence` (plus the
   * `start`/`end`/`allDay` added by `toRbcEvent`) is assignable here
   * because the index signature is open.
   */
  export interface CalendarEventObj {
    title?: string;
    start?: DateLike;
    end?: DateLike;
    allDay?: boolean;
    [key: string]: unknown;
  }

  export interface EventPropGetter<E = CalendarEventObj> {
    (event: E, start: Date, end: Date, isSelected: boolean):
      | { className?: string; style?: React.CSSProperties }
      | undefined;
  }

  // ── Component slots ──────────────────────────────────────────────────

  export type ToolbarProps = {
    label: ReactNode;
    view: string;
    views: string[];
    date: Date;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void;
    onView: (view: string) => void;
    localizer: CalendarLocalizer;
    components?: Record<string, unknown>;
  };

  export type EventComponentProps<E = CalendarEventObj> = {
    event: E;
    title: ReactNode;
    continuesPrior: boolean;
    continuesAfter: boolean;
    isAllDay: boolean;
    localizer: CalendarLocalizer;
    slotStart: Date;
    slotEnd: Date;
  };

  export interface CalendarComponents<E = CalendarEventObj> {
    toolbar?: ComponentType<ToolbarProps>;
    event?: ComponentType<EventComponentProps<E>>;
    eventWrapper?: ComponentType<{ children: ReactNode; type?: string }>;
    week?: { header?: ComponentType<unknown>; event?: ComponentType<EventComponentProps<E>> };
    day?: { header?: ComponentType<unknown>; event?: ComponentType<EventComponentProps<E>> };
    agenda?: {
      date?: ComponentType<unknown>;
      time?: ComponentType<unknown>;
      event?: ComponentType<EventComponentProps<E>>;
    };
    month?: {
      header?: ComponentType<unknown>;
      dateHeader?: ComponentType<unknown>;
      event?: ComponentType<EventComponentProps<E>>;
    };
    [key: string]: unknown;
  }

  // ── Views ────────────────────────────────────────────────────────────

  export interface View {
    name: string;
    title: string;
  }

  export const Views: {
    MONTH: 'month';
    WEEK: 'week';
    DAY: 'day';
    AGENDA: 'agenda';
    WORK_WEEK: 'work_week';
    LIST: 'list';
  };

  export const Navigate: {
    PREV: 'PREV';
    NEXT: 'NEXT';
    TODAY: 'TODAY';
    DATE: 'DATE';
  };

  // ── Calendar ─────────────────────────────────────────────────────────

  export interface CalendarProps<E = CalendarEventObj> {
    events: E[];
    localizer: CalendarLocalizer;

    /** Defaults to `[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]`. */
    views?: string[] | Record<string, boolean | ComponentType<unknown>>;
    view?: string;
    date?: Date;
    onNavigate?: (newDate: Date, view?: string) => void;
    onView?: (view: string) => void;

    startAccessor?: string | ((event: E) => DateLike);
    endAccessor?: string | ((event: E) => DateLike);
    titleAccessor?: string | ((event: E) => string);
    tooltipAccessor?: string | ((event: E) => string);
    allDayAccessor?: string | ((event: E) => boolean);
    resourceAccessor?: string | ((event: E) => unknown);

    components?: CalendarComponents<E>;
    eventPropGetter?: EventPropGetter<E>;

    onSelectEvent?: (event: E, e?: React.MouseEvent) => void;
    onDoubleClickEvent?: (event: E, e?: React.MouseEvent) => void;
    onSelectSlot?: (slotInfo: {
      start: Date;
      end: Date;
      slots: Date[];
      action: 'select' | 'click' | 'doubleClick';
    }) => void;
    onSelecting?: (slotInfo: { start: Date; end: Date }) => boolean | void;
    onSelectRange?: (range: { start: Date; end: Date }) => void;

    selectable?: boolean;
    popup?: boolean;
    toolbar?: boolean;
    popupOffset?: number | { x: number; y: number };
    showMultiDayTimes?: boolean;
    step?: number;
    length?: number;
    min?: Date;
    max?: Date;
    timeslots?: number;
    rtl?: boolean;
    culture?: string;

    messages?: Record<string, string | ((...args: unknown[]) => string)>;
    formats?: Record<string, string | ((...args: unknown[]) => string)>;
    dayLayoutAlgorithm?:
      | 'overlap'
      | 'no-overlap'
      | 'no-overlap-force'
      | ((events: E[], accessors: unknown) => unknown[]);

    getNow?: () => Date;
    scrollToTime?: Date;
    debug?: boolean;

    className?: string;
    style?: React.CSSProperties;
    elementProps?: React.HTMLAttributes<HTMLDivElement>;
    children?: ReactNode;
  }

  export const Calendar: <E = CalendarEventObj>(
    props: CalendarProps<E>,
  ) => React.ReactElement | null;

  export default Calendar;
}
