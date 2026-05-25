import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Calendar Event Sync Service
 *
 * Handles local/external calendar consistency: deleted external events and
 * orphaned plan events. Provider IO lives in calendar-event-provider.service.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { refreshAccessToken } from './calendar-token-manager.service';
import {
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
  type ExternalCalendarEvent,
} from './calendar-event-provider.service';

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

interface CalendarIntegrationMetadata {
  secondary_calendar_id?: string;
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
      persistSession: false,
    },
  });
}

async function resolveExternalEvents(
  integration: {
    id: string;
    access_token: string;
    provider: 'google' | 'microsoft' | string;
    refresh_token?: string | null;
    expires_at?: string | null;
  },
  startDate: string,
  endDate: string,
): Promise<ExternalCalendarEvent[]> {
  let accessToken = integration.access_token;
  const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

  if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
    const refreshResult = await refreshAccessToken(integration);
    if (!refreshResult.success || !refreshResult.accessToken) {
      return [];
    }
    accessToken = refreshResult.accessToken;
  }

  if (integration.provider === 'google') {
    return getGoogleCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
  }
  if (integration.provider === 'microsoft') {
    return getMicrosoftCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
  }

  return [];
}

function getDeletedExternalEventIds(
  localEvents: LocalCalendarEventRow[],
  externalEvents: ExternalCalendarEvent[],
): string[] {
  const externalEventIds = new Set(externalEvents.map((event) => event.id));

  return localEvents
    .filter((localEvent) => {
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
    })
    .map((event) => event.id);
}

export async function syncDeletedEvents(
  supabase: AdminCalendarClient,
  userId: string,
  localEvents: LocalCalendarEventRow[],
  startDate: string,
  endDate: string,
) {
  try {
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('id, access_token, provider, refresh_token, expires_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) {
      return;
    }

    const externalEvents = await resolveExternalEvents(integration, startDate, endDate);
    const eventIdsToDelete = getDeletedExternalEventIds(localEvents, externalEvents);

    if (eventIdsToDelete.length === 0) {
      return;
    }

    const { error: deleteError } = await supabase
      .from('user_calendar_events')
      .delete()
      .in('id', eventIdsToDelete)
      .eq('user_id', userId);

    if (deleteError) {
      techDebtLogger.error('Error eliminando eventos sincronizados:', deleteError);
    }
  } catch (error) {
    techDebtLogger.error('Error en syncDeletedEvents:', error);
  }
}

export async function cleanupOrphanedPlanEvents(
  supabase: AdminCalendarClient,
  userId: string,
): Promise<void> {
  try {
    const { data: activeSessions } = await supabase
      .from('study_sessions')
      .select('external_event_id, calendar_provider')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null);

    const activeEventIds = new Set(
      ((activeSessions as StudySessionCalendarRow[] | null) || []).map((session) => {
        const eventId = session.external_event_id;
        return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
      }),
    );

    const { data: calendarEvents } = await supabase
      .from('user_calendar_events')
      .select('id, google_event_id, microsoft_event_id')
      .eq('user_id', userId)
      .or('google_event_id.not.is.null,microsoft_event_id.not.is.null');

    if (!calendarEvents || calendarEvents.length === 0) {
      return;
    }

    const orphanedEventIds = calendarEvents
      .filter((event) => {
        const googleEventId = event.google_event_id ? String(event.google_event_id).split('_')[0] : null;
        const microsoftEventId = event.microsoft_event_id ? String(event.microsoft_event_id).split('_')[0] : null;

        return Boolean(
          (googleEventId && !activeEventIds.has(googleEventId)) ||
            (microsoftEventId && !activeEventIds.has(microsoftEventId)),
        );
      })
      .map((event) => event.id);

    if (orphanedEventIds.length === 0) {
      return;
    }

    const { error: deleteError } = await supabase
      .from('user_calendar_events')
      .delete()
      .in('id', orphanedEventIds)
      .eq('user_id', userId);

    if (deleteError) {
      techDebtLogger.error('Error eliminando eventos huerfanos:', deleteError);
    }
  } catch (error) {
    techDebtLogger.error('Error en cleanupOrphanedPlanEvents:', error);
  }
}

export type { CalendarIntegrationMetadata };
export {
  createGoogleCalendarEvent,
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
} from './calendar-event-provider.service';
