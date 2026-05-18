import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Event Update Service
 *
 * Handles update and delete operations for individual calendar events,
 * including sync with Google Calendar.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

export interface CalendarIntegrationRow {
  id: string;
  access_token: string;
  refresh_token?: string | null;
  provider: string;
  expires_at?: string | null;
  metadata?: { secondary_calendar_id?: string } | null;
}

interface GoogleRefreshTokenResponse {
  access_token: string;
  expires_in: number;
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
 * Refresca el access token usando el refresh token
 */
export async function refreshAccessToken(
  integration: CalendarIntegrationRow
): Promise<{ success: boolean; accessToken?: string }> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

  try {
    if (integration.provider === 'google') {
      const response = await fetchWithCircuitBreaker('google-oauth-event-update', 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        techDebtLogger.error('Error refrescando token de Google:', errorText);
        return { success: false };
      }

      const tokens = (await response.json()) as GoogleRefreshTokenResponse;
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }

    return { success: false };
  } catch (error) {
    techDebtLogger.error('Error en refreshAccessToken:', error);
    return { success: false };
  }
}

/**
 * Actualiza un evento en Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  eventData: {
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    isAllDay?: boolean;
  },
  calendarId?: string | null
) {
  const targetCalendarId = calendarId || 'primary';

  const response = await fetchWithCircuitBreaker(
    'google-calendar-event-update',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
    {
      method: 'PUT',
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
    const errorText = await response.text();
    let errorMessage = 'Error actualizando evento en Google Calendar';

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;

      if (errorJson.error?.message?.includes('insufficient authentication scopes') ||
        errorJson.error?.message?.includes('Insufficient Permission') ||
        response.status === 403) {
        errorMessage = 'Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
      }
    } catch {
      if (errorText.includes('insufficient authentication scopes') ||
        errorText.includes('Insufficient Permission')) {
        errorMessage = 'Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
      } else {
        errorMessage = errorText || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  calendarId?: string | null
) {
  const cleanEventId = googleEventId.split('_')[0];
  const targetCalendarId = calendarId || 'primary';

  const response = await fetchWithCircuitBreaker(
    'google-calendar-event-update',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Error eliminando evento de Google Calendar';

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;

      if (errorJson.error?.message?.includes('insufficient authentication scopes') ||
        errorJson.error?.message?.includes('Insufficient Permission') ||
        response.status === 403) {
        errorMessage = 'Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
        throw new Error(errorMessage);
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes('insufficient authentication scopes')) {
        throw parseError;
      }
      if (errorText.includes('insufficient authentication scopes') ||
        errorText.includes('Insufficient Permission')) {
        throw new Error('Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.');
      }
    }

    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallbackResponse = await fetchWithCircuitBreaker(
        'google-calendar-event-update',
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (fallbackResponse.ok || fallbackResponse.status === 404) {
        return;
      }
      techDebtLogger.error(`[Delete Event] Fallback en primary tambien fallo: ${fallbackResponse.status}`);
      return;
    }

    if (response.status === 404) {
      return;
    }

    techDebtLogger.error(`Error eliminando evento de Google Calendar (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}
