/**
 * CalendarMicrosoftService
 *
 * Microsoft Graph API operations for calendar integration:
 * - Calendar list
 * - Events CRUD (create, delete)
 * - User email retrieval
 */

import type { CalendarEvent } from '../types/user-context.types';

interface MicrosoftUserProfile {
  mail?: string | null;
  userPrincipalName?: string | null;
}

interface MicrosoftCalendarSummary {
  id: string;
  name?: string | null;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
  hexColor?: string;
}

interface MicrosoftCalendarsResponse {
  value?: MicrosoftCalendarSummary[];
}

interface MicrosoftEventDateTime {
  dateTime?: string;
}

interface MicrosoftEventLocation {
  displayName?: string;
}

interface MicrosoftCalendarEventRow {
  id: string;
  subject?: string | null;
  bodyPreview?: string | null;
  start?: MicrosoftEventDateTime | null;
  end?: MicrosoftEventDateTime | null;
  isAllDay?: boolean;
  seriesMasterId?: string | null;
  location?: MicrosoftEventLocation | null;
  showAs?: string | null;
}

interface MicrosoftCalendarEventsResponse {
  value?: MicrosoftCalendarEventRow[];
}

interface MicrosoftCreatedEventResponse {
  id: string;
}

export class CalendarMicrosoftService {
  /**
   * Obtiene el email del usuario de Microsoft usando el access token
   */
  static async getMicrosoftUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo info de usuario de Microsoft:', await response.text());
        return null;
      }

      const data: MicrosoftUserProfile = await response.json();
      return data.mail || data.userPrincipalName || null;
    } catch (error) {
      console.error('Error obteniendo email de Microsoft:', error);
      return null;
    }
  }

  /**
   * Obtiene la lista de todos los calendarios del usuario de Microsoft
   */
  static async getMicrosoftCalendarList(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    isDefaultCalendar: boolean;
    canEdit: boolean;
    color?: string;
  }>> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/calendars',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo lista de calendarios de Microsoft:', await response.text());
        return [];
      }

      const data: MicrosoftCalendarsResponse = await response.json();
      return (data.value || []).map((cal) => ({
        id: cal.id,
        name: cal.name || 'Sin nombre',
        isDefaultCalendar: cal.isDefaultCalendar || false,
        canEdit: cal.canEdit || false,
        color: cal.hexColor,
      }));
    } catch (error) {
      console.error('[Calendar] Error obteniendo lista de calendarios de Microsoft:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos del calendario de Microsoft
   */
  static async getMicrosoftCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      const mapMicrosoftEvent = (event: MicrosoftCalendarEventRow, calId?: string): CalendarEvent => ({
        id: event.id,
        title: event.subject || 'Sin título',
        description: event.bodyPreview,
        startTime: event.start?.dateTime,
        endTime: event.end?.dateTime,
        isAllDay: event.isAllDay,
        isRecurring: !!event.seriesMasterId,
        location: event.location?.displayName,
        status: event.showAs === 'busy' ? 'confirmed' :
          event.showAs === 'tentative' ? 'tentative' : 'cancelled',
        calendarId: calId,
      });

      // Si hay calendarios seleccionados, obtener eventos por calendario individual
      if (selectedCalendarIds && selectedCalendarIds.length > 0) {
        const allEvents: CalendarEvent[] = [];
        for (const calId of selectedCalendarIds) {
          const params = new URLSearchParams({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
            $orderby: 'start/dateTime',
            $top: '100',
          });

          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calId)}/calendarView?${params}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            console.error(`[Calendar] Error obteniendo eventos de Microsoft calendario ${calId}:`, await response.text());
            continue;
          }

          const data: MicrosoftCalendarEventsResponse = await response.json();
          allEvents.push(...(data.value || []).map((event) => mapMicrosoftEvent(event, calId)));
        }
        return allEvents;
      }

      // Sin selección: usar endpoint por defecto (todos los calendarios)
      const params = new URLSearchParams({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $orderby: 'start/dateTime',
        $top: '100',
      });

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Error obteniendo eventos de Microsoft:', await response.text());
        return [];
      }

      const data: MicrosoftCalendarEventsResponse = await response.json();
      return (data.value || []).map((event) => mapMicrosoftEvent(event));

    } catch (error) {
      console.error('Error obteniendo eventos de Microsoft:', error);
      return [];
    }
  }

  /**
   * Crea un evento en Microsoft Calendar
   */
  static async createMicrosoftEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    }
  ): Promise<{ id: string } | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: event.title,
          body: {
            contentType: 'HTML',
            content: event.description || '',
          },
          start: {
            dateTime: event.startTime,
            timeZone: event.timezone,
          },
          end: {
            dateTime: event.endTime,
            timeZone: event.timezone,
          },
          location: event.location ? { displayName: event.location } : undefined,
          reminderMinutesBeforeStart: 15,
          isReminderOn: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Calendar] Error creando evento en Microsoft:', errorText);
        return null;
      }

      const data: MicrosoftCreatedEventResponse = await response.json();
      return { id: data.id };
    } catch (error) {
      console.error('[Calendar] Error creando evento en Microsoft:', error);
      return null;
    }
  }

  /**
   * Elimina un evento de Microsoft Calendar
   */
  static async deleteMicrosoftEvent(
    accessToken: string,
    eventId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('[Calendar] Error eliminando evento de Microsoft:', errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Calendar] Error eliminando evento de Microsoft:', error);
      return false;
    }
  }
}
