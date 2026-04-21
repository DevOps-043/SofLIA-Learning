import {
  getGoogleCalendarEvents as getSharedGoogleCalendarEvents,
  getMicrosoftCalendarEvents as getSharedMicrosoftCalendarEvents,
} from '../events/calendar-events-provider.service';
import { normalizeExternalEventId } from '../events/calendar-events.utils';
import { resolveSessionCalendarSync } from '../../dashboard/chat/calendar.service';
import type {
  CalendarChange,
  CalendarIntegrationRow,
  ExternalCalendarEvent,
  StudySessionRow,
} from './check-changes.types';

export async function detectCalendarChanges(params: {
  accessToken: string | null;
  integration: CalendarIntegrationRow;
  sessions: StudySessionRow[];
}): Promise<CalendarChange[]> {
  const { accessToken, integration, sessions } = params;

  if (!accessToken) {
    return [];
  }

  const calendarEvents = await fetchCalendarEvents(accessToken, integration);
  const eventMap = new Map(
    calendarEvents.map((event) => [normalizeExternalEventId(event.id), event]),
  );
  const linkedSessionIds = new Set(
    calendarEvents
      .map((event) => event.linkedStudySessionId)
      .filter((value): value is string => Boolean(value)),
  );

  return sessions.flatMap((session) =>
    detectSessionChange(session, eventMap, linkedSessionIds),
  );
}

async function fetchCalendarEvents(
  accessToken: string,
  integration: CalendarIntegrationRow,
): Promise<ExternalCalendarEvent[]> {
  const dateNow = new Date();
  const dateInFuture = new Date();
  dateInFuture.setDate(dateInFuture.getDate() + 60);

  if (integration.provider === 'google') {
    return getSharedGoogleCalendarEvents(
      accessToken,
      dateNow,
      dateInFuture,
      integration.metadata?.secondary_calendar_id,
      integration.metadata?.selected_calendar_ids,
    );
  }

  if (integration.provider === 'microsoft') {
    return getSharedMicrosoftCalendarEvents(
      accessToken,
      dateNow,
      dateInFuture,
      integration.metadata?.selected_calendar_ids,
    );
  }

  return [];
}

function detectSessionChange(
  session: StudySessionRow,
  eventMap: Map<string, ExternalCalendarEvent>,
  linkedSessionIds: Set<string>,
): CalendarChange[] {
  const eventId = getSessionExternalEventId(session);

  if (!eventId) {
    return [];
  }

  const calendarEvent = eventMap.get(eventId);
  if (!calendarEvent && !linkedSessionIds.has(session.id)) {
    return [buildDeletedEventChange(session, eventId)];
  }

  if (calendarEvent && hasSessionTimeChanged(session, calendarEvent)) {
    return [buildModifiedEventChange(session, eventId, calendarEvent)];
  }

  return [];
}

function getSessionExternalEventId(session: StudySessionRow): string {
  const calendarSync = resolveSessionCalendarSync({
    externalEventId: session.external_event_id,
    calendarProvider: session.calendar_provider,
    metrics: session.metrics,
  });

  return normalizeExternalEventId(
    calendarSync?.normalizedExternalEventId
    || calendarSync?.externalEventId
    || session.external_event_id,
  );
}

function hasSessionTimeChanged(
  session: StudySessionRow,
  calendarEvent: ExternalCalendarEvent,
): boolean {
  const sessionStart = new Date(session.start_time);
  const eventStart = new Date(calendarEvent.start);
  const timeDiff = Math.abs(sessionStart.getTime() - eventStart.getTime());

  return timeDiff > 5 * 60 * 1000;
}

function buildDeletedEventChange(
  session: StudySessionRow,
  eventId: string,
): CalendarChange {
  return {
    type: 'deleted_event',
    sessionId: session.id,
    sessionTitle: session.title,
    eventTime: formatShortDateTime(new Date(session.start_time)),
    externalEventId: eventId,
    suggestedAction: 'La sesion ya no aparece vinculada en el calendario. ¿Quieres eliminarla del plan o reprogramarla?',
  };
}

function buildModifiedEventChange(
  session: StudySessionRow,
  eventId: string,
  calendarEvent: ExternalCalendarEvent,
): CalendarChange {
  const eventStart = new Date(calendarEvent.start);

  return {
    type: 'modified_event',
    sessionId: session.id,
    sessionTitle: session.title,
    eventTime: formatShortDateTime(eventStart),
    externalEventId: eventId,
    suggestedAction: `El evento fue modificado en el calendario. Nueva hora: ${eventStart.toLocaleString('es-ES')}`,
  };
}

function formatShortDateTime(date: Date): string {
  return date.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
