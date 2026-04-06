/**
 * Calendar Event Sync Service
 *
 * Handles syncing local calendar events with external calendars (Google, Microsoft).
 * Detects and removes events that were deleted externally, and cleans up orphaned plan events.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CalendarIntegrationService } from '../../../../features/study-planner/services/calendar-integration.service';
import { refreshAccessToken } from './calendar-token-manager.service';

type AdminCalendarClient = ReturnType<typeof createAdminClient>;

interface LocalCalendarEventRow {
  id: string;
  google_event_id?: string | null;
  microsoft_event_id?: string | null;
}

interface StudySessionCalendarRow {
  external_event_id: string | null;
  calendar_provider: string | null;
}

interface ExternalCalendarEvent {
  id: string;
  summary?: string;
  description?: string | null;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string | null;
  status?: string | null;
}

interface CalendarIntegrationMetadata {
  secondary_calendar_id?: string;
}

interface CreatedGoogleCalendarEvent {
  id: string;
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Obtiene eventos de Google Calendar
 * IMPORTANTE: Consulta TODOS los calendarios del usuario para detectar conflictos de horarios
 */
export async function getGoogleCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
  try {
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(accessToken, startDate, endDate);

    return events.map(event => ({
      id: event.id,
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime, date: event.isAllDay ? event.startTime : undefined },
      end: { dateTime: event.endTime, date: event.isAllDay ? event.endTime : undefined },
      location: event.location,
      status: event.status,
    }));
  } catch (error) {
    console.error('Error obteniendo eventos de Google Calendar:', error);
    return [];
  }
}

/**
 * Obtiene eventos de Microsoft Calendar
 */
export async function getMicrosoftCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?` +
      `startDateTime=${startDate.toISOString()}&` +
      `endDateTime=${endDate.toISOString()}&` +
      `$orderby=start/dateTime&` +
      `$top=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { value?: ExternalCalendarEvent[] };
    return data.value || [];
  } catch (error) {
    console.error('Error obteniendo eventos de Microsoft Calendar:', error);
    return [];
  }
}

/**
 * Sincroniza eventos eliminados: elimina eventos locales que fueron eliminados en Google/Microsoft Calendar
 */
export async function syncDeletedEvents(
  supabase: AdminCalendarClient,
  userId: string,
  localEvents: LocalCalendarEventRow[],
  startDate: string,
  endDate: string
) {
  try {
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('access_token, provider, refresh_token, expires_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) {
      return;
    }

    let accessToken = integration.access_token;
    const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

    if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
      const refreshResult = await refreshAccessToken(integration);
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken;
      } else {
        return;
      }
    }

    let externalEvents: ExternalCalendarEvent[] = [];

    if (integration.provider === 'google') {
      externalEvents = await getGoogleCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
    } else if (integration.provider === 'microsoft') {
      externalEvents = await getMicrosoftCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
    }

    const externalEventIds = new Set(externalEvents.map((e) => e.id));

    const eventsToDelete = localEvents.filter((localEvent) => {
      const googleEventId = localEvent.google_event_id;
      const microsoftEventId = localEvent.microsoft_event_id;

      if (!googleEventId && !microsoftEventId) {
        return false;
      }

      if (googleEventId && !externalEventIds.has(googleEventId)) {
        return true;
      }
      if (microsoftEventId && !externalEventIds.has(microsoftEventId)) {
        return true;
      }

      return false;
    });

    if (eventsToDelete.length > 0) {
      const eventIdsToDelete = eventsToDelete.map((e) => e.id);

      const { error: deleteError } = await supabase
        .from('user_calendar_events')
        .delete()
        .in('id', eventIdsToDelete)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error eliminando eventos sincronizados:', deleteError);
      }
    }
  } catch (error) {
    console.error('Error en syncDeletedEvents:', error);
  }
}

/**
 * Limpia eventos huérfanos en user_calendar_events que corresponden a sesiones eliminadas
 */
export async function cleanupOrphanedPlanEvents(supabase: AdminCalendarClient, userId: string): Promise<void> {
  try {
    const { data: activeSessions } = await supabase
      .from('study_sessions')
      .select('external_event_id, calendar_provider')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null);

    const activeEventIds = new Set(
      ((activeSessions as StudySessionCalendarRow[] | null) || []).map((s) => {
        const eventId = s.external_event_id;
        return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
      })
    );

    const { data: calendarEvents } = await supabase
      .from('user_calendar_events')
      .select('id, google_event_id, microsoft_event_id')
      .eq('user_id', userId)
      .or('google_event_id.not.is.null,microsoft_event_id.not.is.null');

    if (!calendarEvents || calendarEvents.length === 0) {
      return;
    }

    const orphanedEventIds: string[] = [];

    for (const event of calendarEvents) {
      const googleEventId = event.google_event_id ? String(event.google_event_id).split('_')[0] : null;
      const microsoftEventId = event.microsoft_event_id ? String(event.microsoft_event_id).split('_')[0] : null;

      if (googleEventId && !activeEventIds.has(googleEventId)) {
        orphanedEventIds.push(event.id);
      } else if (microsoftEventId && !activeEventIds.has(microsoftEventId)) {
        orphanedEventIds.push(event.id);
      }
    }

    if (orphanedEventIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_calendar_events')
        .delete()
        .in('id', orphanedEventIds)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ [Cleanup] Error eliminando eventos huérfanos:', deleteError);
      }
    }
  } catch (error) {
    console.error('❌ [Cleanup] Error en cleanupOrphanedPlanEvents:', error);
  }
}

/**
 * Crea un evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: {
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    isAllDay?: boolean;
  },
  calendarId: string | null = null
): Promise<CreatedGoogleCalendarEvent> {
  const targetCalendarId = calendarId || 'primary';

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: eventData.isAllDay
          ? { date: eventData.start.split('T')[0] }
          : { dateTime: eventData.start },
        end: eventData.isAllDay
          ? { date: eventData.end.split('T')[0] }
          : { dateTime: eventData.end },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Error creando evento en Google Calendar');
  }

  return await response.json() as CreatedGoogleCalendarEvent;
}

export type { CalendarIntegrationMetadata };
