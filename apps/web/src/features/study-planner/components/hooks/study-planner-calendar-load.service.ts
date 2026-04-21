import type { CalendarDate } from '../calendar/types';
import type { CalendarEvent, ViewType } from './study-planner-calendar.types';
import { resolveCalendarRange } from './study-planner-calendar.utils';
import type {
  CalendarApiPayload,
  CustomEventsApiPayload,
  StudySessionsApiPayload,
} from './study-planner-calendar-api.types';

async function readJsonSafely<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function cleanExternalEventId(value?: string | null): string | null {
  return value ? String(value).trim() || null : null;
}

async function fetchCalendarEvents(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate,
): Promise<CalendarEvent[]> {
  const response = await fetcher(
    `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
    calendarId: event.calendarId,
    linkedStudySessionId: event.linkedStudySessionId,
    canonicalEventKey: event.linkedStudySessionId
      ? `calendar-linked:${event.linkedStudySessionId}`
      : `calendar:${provider || 'unknown'}:${event.calendarId || 'primary'}:${event.id}`,
  }));
}

async function fetchStudySessions(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate,
  selectedPlanId?: string | null,
): Promise<{ events: CalendarEvent[]; externalIds: Set<string> }> {
  const query = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  if (selectedPlanId) {
    query.set('planId', selectedPlanId);
  }

  const response = await fetcher(`/api/study-planner/sessions?${query.toString()}`);
  if (!response.ok) {
    return { events: [], externalIds: new Set<string>() };
  }

  const payload = await readJsonSafely<StudySessionsApiPayload>(response);
  const externalIds = new Set<string>();
  const events = (payload.sessions || []).map((session) => {
    const calendarSync = session.metrics?.calendarSync || null;
    const cleanExternalId = cleanExternalEventId(
      calendarSync?.normalizedExternalEventId ||
      calendarSync?.externalEventId ||
      session.external_event_id,
    );
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
      externalEventId: calendarSync?.externalEventId || session.external_event_id || undefined,
      planId: session.plan_id,
      sessionId: session.id,
      linkedStudySessionId: session.id,
      calendarId: calendarSync?.calendarId || undefined,
      calendarSync,
      isDetachedStudySession: !cleanExternalId,
      canonicalEventKey: `study-session:${session.id}`,
    } satisfies CalendarEvent;
  });

  return { events, externalIds };
}

async function fetchCustomEvents(
  fetcher: typeof fetch,
  startDate: CalendarDate,
  endDate: CalendarDate,
): Promise<CalendarEvent[]> {
  const response = await fetcher(
    `/api/study-planner/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
    canonicalEventKey: `calendar:local:local:${event.id}`,
  }));
}

function filterUniqueCalendarEvents(params: {
  calendarEvents: CalendarEvent[];
  customEvents: CalendarEvent[];
  studySessionExternalIds: Set<string>;
}): CalendarEvent[] {
  const linkedSessionIds = new Set(
    params.calendarEvents
      .map((event) => event.linkedStudySessionId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  );
  const customEventExternalIds = new Set(
    params.customEvents
      .filter((event) => event.googleEventId || event.externalEventId)
      .map((event) => cleanExternalEventId(event.googleEventId || event.externalEventId))
      .filter((eventId): eventId is string => eventId !== null),
  );

  return params.calendarEvents.filter((event) => {
    if (event.linkedStudySessionId && linkedSessionIds.has(event.linkedStudySessionId)) {
      return false;
    }

    const cleanEventId = cleanExternalEventId(event.externalEventId || event.googleEventId);
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
    fetchStudySessions(fetcher, range.startDate, range.endDate, 'all'),
    fetchCustomEvents(fetcher, range.startDate, range.endDate),
  ]);
  const uniqueCalendarEvents = filterUniqueCalendarEvents({
    calendarEvents,
    customEvents,
    studySessionExternalIds: studySessions.externalIds,
  });
  const filteredStudySessions = params.selectedPlanId
    ? studySessions.events.filter((session) => session.planId === params.selectedPlanId)
    : [];

  const seenKeys = new Set<string>();
  return [...filteredStudySessions, ...uniqueCalendarEvents, ...customEvents].filter((event) => {
    if (seenKeys.has(event.canonicalEventKey)) {
      return false;
    }

    seenKeys.add(event.canonicalEventKey);
    return true;
  });
}
