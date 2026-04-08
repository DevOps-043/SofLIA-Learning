import type { CalendarDate } from '../calendar/types';
import type {
  CalendarEvent,
  StudyPlannerCalendarEventForm,
  ViewType,
} from './study-planner-calendar.types';
import {
  normalizeCalendarMutationError,
  resolveCalendarRange,
} from './study-planner-calendar.utils';

interface CalendarApiEventRecord {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  isAllDay?: boolean;
}

interface CalendarApiPayload {
  events?: CalendarApiEventRecord[];
  provider?: 'google' | 'microsoft';
  warning?: string;
  error?: string;
  hint?: string;
}

interface StudySessionApiRecord {
  id: string;
  title?: string;
  description?: string;
  start_time: string;
  end_time: string;
  external_event_id?: string | null;
}

interface StudySessionsApiPayload {
  sessions?: StudySessionApiRecord[];
}

interface CustomEventApiRecord {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day?: boolean;
  google_event_id?: string | null;
  color?: string;
}

interface CustomEventsApiPayload {
  events?: CustomEventApiRecord[];
  warning?: string;
  error?: string;
  hint?: string;
}

interface MutationApiPayload {
  error?: string;
}

async function readJsonSafely<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function cleanExternalEventId(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return String(value).split('_')[0] || null;
}

async function fetchCalendarEvents(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate
): Promise<CalendarEvent[]> {
  const response = await fetcher(
    `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
  );

  if (!response.ok) {
    return [];
  }

  const payload = await readJsonSafely<CalendarApiPayload>(response);
  const provider = payload.provider;

  return (payload.events || []).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.start,
    end: event.end,
    location: event.location,
    isAllDay: event.isAllDay,
    provider,
    source: 'calendar',
    googleEventId: provider === 'google' ? event.id : undefined,
    externalEventId: event.id,
  }));
}

async function fetchStudySessions(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate,
  selectedPlanId?: string | null,
): Promise<{
  events: CalendarEvent[];
  externalIds: Set<string>;
}> {
  const query = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  if (selectedPlanId) {
    query.set('planId', selectedPlanId);
  }

  const response = await fetcher(
    `/api/study-planner/sessions?${query.toString()}`
  );

  if (!response.ok) {
    return { events: [], externalIds: new Set<string>() };
  }

  const payload = await readJsonSafely<StudySessionsApiPayload>(response);
  const externalIds = new Set<string>();

  const events = (payload.sessions || []).map((session) => {
    const cleanExternalId = cleanExternalEventId(session.external_event_id);
    if (cleanExternalId) {
      externalIds.add(cleanExternalId);
    }

    return {
      id: session.id || `study-${session.id}`,
      title: session.title || 'Sesion de estudio',
      description: session.description,
      start: session.start_time,
      end: session.end_time,
      provider: 'study',
      source: 'study_session',
      externalEventId: session.external_event_id || undefined,
    } satisfies CalendarEvent;
  });

  return { events, externalIds };
}

async function fetchCustomEvents(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate
): Promise<CalendarEvent[]> {
  const response = await fetcher(
    `/api/study-planner/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
  );

  if (!response.ok) {
    if (response.status === 503) {
      await readJsonSafely<CustomEventsApiPayload>(response);
    }
    return [];
  }

  const payload = await readJsonSafely<CustomEventsApiPayload>(response);

  return (payload.events || []).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.start_time,
    end: event.end_time,
    location: event.location,
    isAllDay: event.is_all_day,
    provider: 'local',
    source: 'calendar',
    localEventId: event.id,
    googleEventId: event.google_event_id || undefined,
    color: event.color || undefined,
  }));
}

function filterUniqueCalendarEvents(params: {
  calendarEvents: CalendarEvent[];
  customEvents: CalendarEvent[];
  studySessionExternalIds: Set<string>;
}): CalendarEvent[] {
  const customEventExternalIds = new Set(
    params.customEvents
      .filter((event) => event.googleEventId || event.externalEventId)
      .map((event) => cleanExternalEventId(event.googleEventId || event.externalEventId))
      .filter((eventId): eventId is string => eventId !== null)
  );

  return params.calendarEvents.filter((event) => {
    const cleanEventId = cleanExternalEventId(
      event.externalEventId || event.googleEventId
    );

    if (!cleanEventId) {
      return true;
    }

    if (customEventExternalIds.has(cleanEventId)) {
      return false;
    }

    return !params.studySessionExternalIds.has(cleanEventId);
  });
}

export async function loadStudyPlannerCalendarEvents(params: {
  currentDate: CalendarDate;
  fetcher?: typeof fetch;
  selectedPlanId?: string | null;
  view: ViewType;
}): Promise<CalendarEvent[]> {
  const range = resolveCalendarRange(params.currentDate, params.view);

  if (!range) {
    return [];
  }

  const fetcher = params.fetcher || fetch;
  const [calendarEvents, studySessions, customEvents] = await Promise.all([
    fetchCalendarEvents(fetcher, range.startDate, range.endDate),
    fetchStudySessions(fetcher, range.startDate, range.endDate, params.selectedPlanId),
    fetchCustomEvents(fetcher, range.startDate, range.endDate),
  ]);

  const uniqueCalendarEvents = filterUniqueCalendarEvents({
    calendarEvents,
    customEvents,
    studySessionExternalIds: studySessions.externalIds,
  });

  return [...uniqueCalendarEvents, ...studySessions.events, ...customEvents];
}

export async function deleteStudyPlannerCalendarEvent(params: {
  event: CalendarEvent;
  fetcher?: typeof fetch;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const eventId = params.event.localEventId || params.event.id;
  const fetcher = params.fetcher || fetch;

  const response = await fetcher(`/api/study-planner/events/${eventId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    return { success: true };
  }

  const payload = await readJsonSafely<MutationApiPayload>(response);
  return {
    success: false,
    errorMessage: normalizeCalendarMutationError(
      payload.error || 'Error al eliminar el evento'
    ),
  };
}

export async function saveStudyPlannerCalendarEvent(params: {
  eventForm: StudyPlannerCalendarEventForm;
  fetcher?: typeof fetch;
  isCreatingEvent: boolean;
  selectedEvent: CalendarEvent | null;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const fetcher = params.fetcher || fetch;
  const endpoint = params.isCreatingEvent
    ? '/api/study-planner/events'
    : `/api/study-planner/events/${params.selectedEvent?.localEventId || params.selectedEvent?.id}`;
  const method = params.isCreatingEvent ? 'POST' : 'PUT';

  const response = await fetcher(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.eventForm),
  });

  if (response.ok) {
    return { success: true };
  }

  const payload = await readJsonSafely<MutationApiPayload>(response);
  return {
    success: false,
    errorMessage: normalizeCalendarMutationError(payload.error),
  };
}
