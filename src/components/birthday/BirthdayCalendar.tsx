'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Modal } from '@/components/shared/Modal';
import { calendarService } from '@/services/calendar.service';
import type {
  AdminCalendarEvent,
  CalendarEventKind,
  CalendarEventPayload,
  CalendarEventSource,
  CalendarImportReport,
  CalendarOccurrence,
  CalendarPreviewData,
  CalendarRecurrence,
  CalendarUpcomingData,
} from '@/types/calendar.types';
import {
  BUCKET_LABELS,
  countdownLabel,
  detailCountdown,
  formatWeekdayDate,
  kindClass,
  kindLabel,
  monthLabel,
  sourceLabel,
  toRbcEvent,
} from '@/utils/calendar.utils';
import type { CalendarEvent } from '@/utils/calendar.utils';
import './BirthdayCalendar.css';

const localizer = dateFnsLocalizer({
  format: (value, pattern) => format(asDate(value), pattern),
  parse: (value, pattern, referenceDate) => parse(value, pattern, referenceDate),
  startOfWeek: (value) => startOfWeek(asDate(value), { weekStartsOn: 0 }),
  getDay: (value) => getDay(asDate(value)),
  locales: { 'en-US': enUS },
});

function asDate(value: Date | number | string): Date {
  return value instanceof Date ? value : new Date(value);
}

type CalendarGridEvent = CalendarEvent & CalendarOccurrence;

const PANEL =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-[#28251e] dark:bg-[#1b1a16]';
const INPUT =
  'w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#C9A84C] dark:border-[#28251e] dark:bg-[#24221c] dark:text-gray-100';
const GOLD_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-50';
const OUTLINE_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/30 bg-white px-3 py-2 text-xs font-bold text-[#8A6F1F] transition hover:bg-[#FDFAF3] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1b1a16] dark:text-[#D4B85A]';
const OWNER_BIRTHDAY_IMPORT_EXAMPLE = `January
5th - Bose's birthday
21st - OG Johnson's birthday
25th - Monthly Reminder

March
3rd - Get together (not fixed yet)`;

export function MemberBirthdayCalendar() {
  return <BirthdayCalendar admin={false} />;
}

export function AdminBirthdayCalendar() {
  return <BirthdayCalendar admin />;
}

function BirthdayCalendar({ admin }: { admin: boolean }) {
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<string>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarOccurrence | null>(null);
  const [monthResult, setMonthResult] = useState<{
    key: string;
    data?: CalendarOccurrence[];
    error?: string;
  }>({ key: '' });
  const [upcoming, setUpcoming] = useState<CalendarUpcomingData | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [upcomingRetry, setUpcomingRetry] = useState(0);

  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
  const monthEvents = useMemo(
    () => monthResult.key === monthKey ? monthResult.data ?? [] : [],
    [monthKey, monthResult],
  );
  const monthError = monthResult.key === monthKey ? monthResult.error : undefined;
  const monthLoading = monthResult.key !== monthKey;
  const events = useMemo(() => monthEvents.map(toRbcEvent), [monthEvents]);

  useEffect(() => {
    let active = true;
    void calendarService.getMonth(date.getFullYear(), date.getMonth() + 1)
      .then((response) => {
        if (!active) return;
        setMonthResult(
          response.success && response.data
            ? { key: monthKey, data: response.data.events }
            : { key: monthKey, error: response.message || 'Could not load this month.' },
        );
      })
      .catch((error: unknown) => {
        if (active) setMonthResult({ key: monthKey, error: errorMessage(error, 'Could not load this month.') });
      });

    return () => {
      active = false;
    };
  }, [date, monthKey]);

  useEffect(() => {
    let active = true;
    void calendarService.getUpcoming(92)
      .then((response) => {
        if (!active) return;
        if (response.success && response.data) {
          setUpcoming(response.data);
          setUpcomingError(null);
        } else {
          setUpcomingError(response.message || 'Could not load upcoming events.');
        }
      })
      .catch((error: unknown) => {
        if (active) setUpcomingError(errorMessage(error, 'Could not load upcoming events.'));
      });

    return () => {
      active = false;
    };
  }, [upcomingRetry]);

  const eventById = useMemo(
    () => new Map(monthEvents.map((event) => [event.id, event])),
    [monthEvents],
  );
  const eventClassName = (event: CalendarGridEvent) => ({
    className: `${kindClass(event.kind)}${event.is_tentative ? ' cal-chip-tentative' : ''}`,
  });

  return (
    <section className={`${PANEL} overflow-hidden`} aria-label="Birthday calendar">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e5e7eb] px-5 py-5 dark:border-[#28251e] sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDFAF3] text-[#C9A84C]">
            <CalendarDays size={18} />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-gray-100">
              {admin ? 'Birthday calendar' : 'Community calendar'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Birthdays, recurring reminders, and upcoming community events
            </p>
          </div>
        </div>
        {monthResult.key === monthKey && monthResult.data && (
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
            <span className="rounded-full bg-pink-50 px-2.5 py-1 text-pink-700">
              {monthResult.key === monthKey ? monthEvents.filter((event) => event.kind === 'birthday').length : 0} birthdays
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              {monthResult.key === monthKey ? monthEvents.filter((event) => event.kind === 'reminder').length : 0} reminders
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              {monthResult.key === monthKey ? monthEvents.filter((event) => event.kind === 'event').length : 0} events
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {monthError ? (
            <LoadError message={monthError} onRetry={() => setDate(new Date(date))} />
          ) : (
            <div className={`birthday-calendar ${monthLoading ? 'opacity-60' : ''}`}>
              <Calendar<CalendarGridEvent>
                localizer={localizer}
                events={events}
                date={date}
                view={view}
                views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                onNavigate={setDate}
                onView={setView}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                allDayAccessor="allDay"
                eventPropGetter={eventClassName}
                onSelectEvent={(event) => {
                  const occurrence = eventById.get(String(event.id));
                  if (occurrence) setSelectedEvent(occurrence);
                }}
                popup
                style={{ minHeight: 600 }}
                messages={{ noEventsInRange: 'No calendar entries in this range.' }}
              />
              {monthLoading && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500" aria-live="polite">
                  <Loader2 size={14} className="animate-spin" /> Loading {monthLabel(date.getFullYear(), date.getMonth() + 1)}…
                </div>
              )}
            </div>
          )}
        </div>

        <UpcomingRail
          data={upcoming}
          error={upcomingError}
          onRetry={() => {
            setUpcoming(null);
            setUpcomingError(null);
            setUpcomingRetry((value) => value + 1);
          }}
          onSelect={setSelectedEvent}
        />
      </div>

      {admin && (
        <AdminEventManager onChanged={() => setDate(new Date(date))} />
      )}

      <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </section>
  );
}

function UpcomingRail({
  data,
  error,
  onRetry,
  onSelect,
}: {
  data: CalendarUpcomingData | null;
  error: string | null;
  onRetry: () => void;
  onSelect: (event: CalendarOccurrence) => void;
}) {
  const groups = useMemo(() => {
    if (!data) return [];
    return (['today', 'tomorrow', 'week', 'later'] as const)
      .map((bucket) => ({
        bucket,
        events: data.events.filter((event) => {
          if (bucket === 'today') return event.days_until === 0;
          if (bucket === 'tomorrow') return event.days_until === 1;
          if (bucket === 'week') return event.days_until >= 2 && event.days_until <= 7;
          return event.days_until > 7;
        }),
      }))
      .filter((group) => group.events.length > 0);
  }, [data]);

  return (
    <aside className="rounded-2xl border border-[#e5e7eb] bg-[#FCFBF8] p-4 dark:border-[#28251e] dark:bg-[#161510]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">Coming up</h3>
          <p className="mt-0.5 text-[11px] text-gray-500">The next 92 days</p>
        </div>
        {data && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:bg-[#24221c]">{data.events.length}</span>}
      </div>

      {error ? (
        <LoadError message={error} onRetry={onRetry} />
      ) : !data ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500">
          <Loader2 size={14} className="animate-spin" /> Loading upcoming entries…
        </div>
      ) : groups.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-500">Nothing is scheduled in the next 92 days.</p>
      ) : (
        <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
          {groups.map(({ bucket, events }) => (
            <div key={bucket}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                {BUCKET_LABELS[bucket]}
              </p>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      className="group flex w-full items-start gap-2.5 rounded-xl border border-[#eee9dd] bg-white p-3 text-left transition hover:border-[#C9A84C]/50 hover:bg-[#FDFAF3] dark:border-[#28251e] dark:bg-[#1b1a16] dark:hover:bg-[#24221c]"
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.kind === 'birthday' ? 'bg-pink-400' : event.kind === 'reminder' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-gray-800 dark:text-gray-100">
                          {event.name ?? event.title}
                        </span>
                        <span className="mt-1 block text-[10px] text-gray-500">
                          {event.month_day} · {sourceLabel(event.source)}
                          {event.is_tentative ? ' · Tentative' : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-[#8A6F1F]">
                        {countdownLabel(event.days_until, event.date)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="flex items-center gap-2 font-semibold"><CircleAlert size={15} /> Calendar could not load</p>
      <p className="mt-1 text-xs">{message}</p>
      <button type="button" onClick={onRetry} className="mt-2 text-xs font-bold underline">Try again</button>
    </div>
  );
}

function EventDetails({ event, onClose }: { event: CalendarOccurrence | null; onClose: () => void }) {
  return (
    <Modal
      isOpen={event !== null}
      onClose={onClose}
      title={event?.title ?? 'Calendar entry'}
      subtitle={event ? formatWeekdayDate(event.date) : undefined}
      icon={CalendarDays}
    >
      {event && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${kindClass(event.kind)}`}>
              {kindLabel(event.kind)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-[#24221c] dark:text-gray-300">
              {sourceLabel(event.source)}
            </span>
            {event.is_tentative && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Tentative</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#8A6F1F]">{detailCountdown(event)}</p>
          {event.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">{event.description}</p>}
          {event.is_self && <p className="text-xs text-gray-500">This is your birthday.</p>}
          {event.can_view_profile && event.user_id !== null && (
            <Link
              href={`/dashboard/birthdays/${event.user_id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#8A6F1F] hover:underline"
            >
              Open birthday page <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}

type AdminEventForm = {
  title: string;
  name: string;
  description: string;
  kind: CalendarEventKind;
  recurrence: CalendarRecurrence;
  month: string;
  day: string;
  event_date: string;
  is_tentative: boolean;
  is_active: boolean;
  visibility: 'public' | 'members';
};

const EMPTY_FORM: AdminEventForm = {
  title: '',
  name: '',
  description: '',
  kind: 'birthday',
  recurrence: 'yearly',
  month: String(new Date().getMonth() + 1),
  day: String(new Date().getDate()),
  event_date: '',
  is_tentative: false,
  is_active: true,
  visibility: 'public',
};

function AdminEventManager({ onChanged }: { onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<CalendarEventKind | ''>('');
  const [source, setSource] = useState<'' | CalendarEventSource | 'owner_import'>('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [listResult, setListResult] = useState<{
    key: string;
    events?: AdminCalendarEvent[];
    pagination?: { current_page: number; last_page: number; per_page: number; total: number };
    error?: string;
  }>({ key: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCalendarEvent | null>(null);
  const [form, setForm] = useState<AdminEventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [preview, setPreview] = useState<CalendarPreviewData | null>(null);
  const [importReport, setImportReport] = useState<CalendarImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const filterKey = `${search.trim()}|${kind}|${source}|${page}|${revision}`;
  const entries = listResult.key === filterKey ? listResult.events ?? [] : [];
  const pagination = listResult.key === filterKey ? listResult.pagination : undefined;
  const listLoading = listResult.key !== filterKey;

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void calendarService.adminList({
        search: search.trim(),
        kind,
        source,
        page,
        per_page: 10,
      }).then((response) => {
        if (!active) return;
        setListResult(
          response.success && response.data
            ? { key: filterKey, events: response.data.events, pagination: response.data.pagination }
            : { key: filterKey, error: response.message || 'Could not load managed entries.' },
        );
      }).catch((error: unknown) => {
        if (active) setListResult({ key: filterKey, error: errorMessage(error, 'Could not load managed entries.') });
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filterKey, kind, page, revision, search, source]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, month: String(new Date().getMonth() + 1), day: String(new Date().getDate()) });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (event: AdminCalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      name: event.name ?? '',
      description: event.description ?? '',
      kind: event.kind,
      recurrence: event.kind === 'birthday' ? 'yearly' : event.recurrence,
      month: event.month === null ? '' : String(event.month),
      day: event.day === null ? '' : String(event.day),
      event_date: event.event_date ?? '',
      is_tentative: event.is_tentative,
      is_active: event.is_active,
      visibility: event.visibility,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const saveEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload: CalendarEventPayload = {
      title: form.title.trim(),
      name: form.name.trim() || null,
      description: form.description.trim() || null,
      kind: form.kind,
      recurrence: form.recurrence,
      month: form.recurrence === 'yearly' ? Number(form.month) : null,
      day: form.recurrence === 'once' ? null : Number(form.day),
      event_date: form.recurrence === 'once' ? form.event_date : null,
      is_tentative: form.is_tentative,
      is_active: form.is_active,
      visibility: form.visibility,
    };

    try {
      const response = editing
        ? await calendarService.updateEvent(editing.id, payload)
        : await calendarService.createEvent(payload);
      if (!response.success) {
        setFormError(response.message || 'Could not save this entry.');
        return;
      }
      setModalOpen(false);
      setPage(1);
      setRevision((value) => value + 1);
      onChanged();
    } catch (error) {
      setFormError(errorMessage(error, 'Could not save this entry.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event: AdminCalendarEvent) => {
    if (!window.confirm(`Delete "${event.title}" from the calendar?`)) return;
    setFormError(null);
    try {
      const response = await calendarService.deleteEvent(event.id);
      if (!response.success) {
        setFormError(response.message || 'Could not delete this entry.');
        return;
      }
      setPage(1);
      setRevision((value) => value + 1);
      onChanged();
    } catch (error) {
      setFormError(errorMessage(error, 'Could not delete this entry.'));
    }
  };

  const previewImport = async () => {
    setImportBusy(true);
    setImportError(null);
    setImportReport(null);
    try {
      const response = await calendarService.previewImport(importText);
      if (response.success && response.data) setPreview(response.data);
      else setImportError(response.message || 'Could not preview this list.');
    } catch (error) {
      setImportError(errorMessage(error, 'Could not preview this list.'));
    } finally {
      setImportBusy(false);
    }
  };

  const commitImport = async () => {
    setImportBusy(true);
    setImportError(null);
    try {
      const response = await calendarService.importList(importText);
      if (response.success && response.data) {
        setImportReport(response.data);
        setPage(1);
        setRevision((value) => value + 1);
        onChanged();
      } else {
        setImportError(response.message || 'Could not import this list.');
      }
    } catch (error) {
      setImportError(errorMessage(error, 'Could not import this list.'));
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="border-t border-[#e5e7eb] p-4 dark:border-[#28251e] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">Manage calendar entries</h3>
          <p className="mt-1 text-xs text-gray-500">Create, edit, deactivate, or safely re-import managed birthdays.</p>
        </div>
        <button type="button" onClick={openCreate} className={GOLD_BUTTON}>
          <Plus size={15} /> Add entry
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className={`${INPUT} pl-9`} placeholder="Search calendar entries" aria-label="Search calendar entries" />
        </label>
        <select value={kind} onChange={(event) => { setKind(event.target.value as CalendarEventKind | ''); setPage(1); }} className={INPUT} aria-label="Filter by kind">
          <option value="">All kinds</option>
          <option value="birthday">Birthdays</option>
          <option value="reminder">Reminders</option>
          <option value="event">Events</option>
        </select>
        <select value={source} onChange={(event) => { setSource(event.target.value as typeof source); setPage(1); }} className={INPUT} aria-label="Filter by source">
          <option value="">All sources</option>
          <option value="owner_import">Owner import</option>
          <option value="admin">Admin created</option>
        </select>
      </div>

      {formError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{formError}</p>}

      <div className="mt-3 overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#28251e]">
        {listLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-gray-500"><Loader2 size={14} className="animate-spin" /> Loading entries…</div>
        ) : listResult.error ? (
          <div role="alert" className="p-5 text-sm text-red-700">{listResult.error}</div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-xs text-gray-500">No managed calendar entries match these filters.</p>
        ) : (
          <ul className="divide-y divide-[#e5e7eb] dark:divide-[#28251e]">
            {entries.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${kindClass(event.kind)}`}>{kindLabel(event.kind)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">{event.name ?? event.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {event.next_occurrence ? formatWeekdayDate(event.next_occurrence) : 'No upcoming occurrence'}
                    {' · '}{event.source === 'owner_import' ? 'Owner import' : 'Admin'}
                    {!event.is_active ? ' · Inactive' : ''}
                    {event.is_tentative ? ' · Tentative' : ''}
                  </p>
                </div>
                <button type="button" onClick={() => openEdit(event)} className={OUTLINE_BUTTON} aria-label={`Edit ${event.title}`}><Pencil size={13} /> Edit</button>
                <button type="button" onClick={() => void deleteEvent(event)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50" aria-label={`Delete ${event.title}`}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {pagination && pagination.total > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            Showing {(pagination.current_page - 1) * pagination.per_page + 1}–
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className={OUTLINE_BUTTON}>Previous</button>
            <span>Page {pagination.current_page} of {pagination.last_page}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pagination.last_page, value + 1))} disabled={page >= pagination.last_page} className={OUTLINE_BUTTON}>Next</button>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)]">
        <div className="rounded-xl border border-[#e5e7eb] p-4 dark:border-[#28251e]">
          <h4 className="flex items-center gap-2 text-xs font-black text-gray-800 dark:text-gray-100"><Upload size={14} /> Import owner list</h4>
          <p className="mt-1 text-[11px] text-gray-500">Preview before committing. Re-imports update matching rows instead of creating duplicates.</p>
          <p id="owner-birthday-import-help" className="mt-2 text-[11px] leading-relaxed text-gray-500">
            Start with a month heading, then add one date per line, such as <code>5th - Name&apos;s birthday</code>. Don&apos;t include birth years.
          </p>
          <textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setPreview(null);
              setImportReport(null);
              setImportError(null);
            }}
            rows={5}
            className={`${INPUT} mt-3 resize-y`}
            placeholder={'January\n5th - Name\'s birthday'}
            aria-label="Owner birthday list to import"
            aria-describedby="owner-birthday-import-help"
          />
          <details className="mt-3 rounded-lg bg-[#FCFBF8] p-3 dark:bg-[#161510]">
            <summary className="cursor-pointer text-[11px] font-bold text-[#8A6F1F] dark:text-[#D4B85A]">
              View a full example
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              The monthly reminder repeats every month. A get-together marked “not fixed yet” is imported as tentative.
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] leading-relaxed text-gray-700 dark:bg-[#1b1a16] dark:text-gray-300">
              {OWNER_BIRTHDAY_IMPORT_EXAMPLE}
            </pre>
            <button
              type="button"
              onClick={() => {
                setImportText(OWNER_BIRTHDAY_IMPORT_EXAMPLE);
                setPreview(null);
                setImportReport(null);
                setImportError(null);
              }}
              disabled={importBusy}
              className={`${OUTLINE_BUTTON} mt-2`}
            >
              Use this example
            </button>
          </details>
          {importError && <p role="alert" className="mt-2 text-xs text-red-600">{importError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void previewImport()} disabled={!importText.trim() || importBusy} className={OUTLINE_BUTTON}>
              {importBusy ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Preview
            </button>
            <button type="button" onClick={() => void commitImport()} disabled={!preview || !importText.trim() || importBusy} className={GOLD_BUTTON}>
              {importBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Import list
            </button>
          </div>
        </div>
        <div className="rounded-xl bg-[#FCFBF8] p-4 dark:bg-[#161510]">
          {importReport ? (
            <>
              <h4 className="text-xs font-black text-gray-800 dark:text-gray-100">Import complete</h4>
              <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                {importReport.created} created · {importReport.updated} updated · {importReport.unchanged} unchanged · {importReport.reconciled} matched to members · {importReport.invalid} invalid
              </p>
            </>
          ) : preview ? (
            <>
              <h4 className="text-xs font-black text-gray-800 dark:text-gray-100">Preview: {preview.rows.length} rows</h4>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                <span>{preview.counts.birthday ?? 0} birthdays</span>
                <span>{preview.counts.reminder ?? 0} reminders</span>
                <span>{preview.counts.event ?? 0} events</span>
              </div>
              <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-xs text-gray-600 dark:text-gray-300">
                {preview.rows.slice(0, 20).map((row, index) => (
                  <li key={`${row.title}-${index}`} className="truncate">{row.title}{row.is_tentative ? ' · Tentative' : ''}</li>
                ))}
                {preview.rows.length > 20 && <li className="font-semibold">and {preview.rows.length - 20} more…</li>}
              </ul>
            </>
          ) : (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500"><CircleAlert size={14} className="mt-0.5 shrink-0" /> Review the parsed rows before importing. Invalid rows are reported without blocking valid rows.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit calendar entry' : 'Add calendar entry'}
        subtitle="Managed birthdays never store a birth year."
        icon={CalendarDays}
        size="lg"
      >
        <form onSubmit={(event) => void saveEvent(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Title
              <input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`${INPUT} mt-1.5`} />
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Name (optional)
              <input maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${INPUT} mt-1.5`} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Description (optional)
            <textarea rows={2} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${INPUT} mt-1.5 resize-y`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Kind
              <select
                value={form.kind}
                onChange={(event) => {
                  const nextKind = event.target.value as CalendarEventKind;
                  const nextRecurrence = nextKind === 'birthday' ? 'yearly' : form.recurrence;
                  setForm({
                    ...form,
                    kind: nextKind,
                    recurrence: nextRecurrence,
                    month: nextRecurrence === 'yearly' && !form.month ? String(new Date().getMonth() + 1) : form.month,
                    day: nextRecurrence !== 'once' && !form.day ? String(new Date().getDate()) : form.day,
                  });
                }}
                className={`${INPUT} mt-1.5`}
              >
                <option value="birthday">Birthday</option><option value="reminder">Reminder</option><option value="event">Event</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Recurrence
              <select value={form.recurrence} onChange={(event) => setForm({ ...form, recurrence: event.target.value as CalendarRecurrence })} className={`${INPUT} mt-1.5`}>
                <option value="yearly">Yearly</option>
                {form.kind !== 'birthday' && <><option value="monthly">Monthly</option><option value="once">One time</option></>}
              </select>
            </label>
          </div>
          {form.recurrence === 'once' ? (
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Event date
              <input required type="date" value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} className={`${INPUT} mt-1.5`} />
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {form.recurrence === 'yearly' && (
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Month
                  <select required value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} className={`${INPUT} mt-1.5`}>
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>{new Date(2026, index, 1).toLocaleString('en-US', { month: 'long' })}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Day of month
                <input required type="number" min={1} max={31} value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })} className={`${INPUT} mt-1.5`} />
              </label>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Visibility
              <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as 'public' | 'members' })} className={`${INPUT} mt-1.5`}>
                <option value="public">Public</option><option value="members">Members</option>
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-2 text-xs text-gray-600 dark:text-gray-300">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_tentative} onChange={(event) => setForm({ ...form, is_tentative: event.target.checked })} /> Tentative</label>
            </div>
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-[#e5e7eb] pt-4 dark:border-[#28251e]">
            <button type="button" onClick={() => setModalOpen(false)} className={OUTLINE_BUTTON}><X size={13} /> Cancel</button>
            <button type="submit" disabled={saving} className={GOLD_BUTTON}>{saving && <Loader2 size={14} className="animate-spin" />}{editing ? 'Save changes' : 'Create entry'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}
