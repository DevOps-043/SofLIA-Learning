/**
 * CalendarGoogleService
 *
 * Google Calendar API operations:
 * - Calendar list
 * - Free/busy info
 * - Events CRUD (create, update, delete)
 * - Platform secondary calendar management
 */

import type { CalendarEvent } from '../types/user-context.types';
import { CalendarDbService } from './calendar-db.service';

// Nombre del calendario secundario de la plataforma
export const PLATFORM_CALENDAR_NAME = 'SofLIA - Sesiones de Estudio';

interface GoogleCalendarListItem {
  id: string;
  summary?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
}

interface GoogleEventDate {
  dateTime?: string;
  date?: string;
}

interface GoogleCalendarEventRow {
  id: string;
  summary?: string;
  description?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
  recurringEventId?: string;
  location?: string;
  status?: string;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEventRow[];
}

interface GoogleCreatedEventResponse {
  id: string;
  htmlLink?: string;
}

interface GoogleEventUpdatePayload {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
}

interface GoogleUserInfoResponse {
  email?: string | null;
}

export class CalendarGoogleService {
  /**
   * Obtiene la lista de todos los calendarios del usuario de Google
   */
  static async getGoogleCalendarList(accessToken: string): Promise<Array<{
    id: string;
    summary: string;
    primary: boolean;
    accessRole: string;
    backgroundColor?: string;
  }>> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo lista de calendarios:', await response.text());
        return [];
      }

      const data: GoogleCalendarListResponse = await response.json();
      return (data.items || []).map((cal) => ({
        id: cal.id,
        summary: cal.summary || 'Sin nombre',
        primary: cal.primary || false,
        accessRole: cal.accessRole || 'reader',
        backgroundColor: cal.backgroundColor,
      }));
    } catch (error) {
      console.error('[Calendar] Error obteniendo lista de calendarios:', error);
      return [];
    }
  }

  /**
   * Obtiene información de disponibilidad (free/busy) de todos los calendarios del usuario
   * Usa la API freeBusy para consultar múltiples calendarios en una sola petición
   */
  static async getFreeBusyInfo(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    calendarIds?: string[],
    userId?: string
  ): Promise<{
    calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
    allBusySlots: Array<{ start: Date; end: Date }>;
  }> {
    try {
      // Si no se especifican calendarios, intentar cargar selección del usuario
      let idsToQuery = calendarIds;
      if (!idsToQuery || idsToQuery.length === 0) {
        if (userId) {
          const selectedIds = await CalendarDbService.getSelectedCalendarIds(userId);
          if (selectedIds && selectedIds.length > 0) {
            idsToQuery = selectedIds;
          }
        }
      }
      // Si aún no hay IDs, obtener todos los calendarios accesibles
      if (!idsToQuery || idsToQuery.length === 0) {
        const calendars = await this.getGoogleCalendarList(accessToken);
        idsToQuery = calendars
          .filter(cal => ['owner', 'writer', 'reader'].includes(cal.accessRole))
          .map(cal => cal.id);
      }

      if (idsToQuery.length === 0) {
        return { calendars: {}, allBusySlots: [] };
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: idsToQuery.map(id => ({ id })),
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo free/busy:', await response.text());
        return { calendars: {}, allBusySlots: [] };
      }

      const data = await response.json();
      const calendars: Record<string, { busy: Array<{ start: string; end: string }> }> = {};
      const allBusySlots: Array<{ start: Date; end: Date }> = [];

      // Procesar respuesta
      for (const [calId, calData] of Object.entries(data.calendars || {})) {
        const busyInfo = calData as { busy?: Array<{ start: string; end: string }> };
        calendars[calId] = { busy: busyInfo.busy || [] };

        for (const slot of busyInfo.busy || []) {
          allBusySlots.push({
            start: new Date(slot.start),
            end: new Date(slot.end),
          });
        }
      }

      // Ordenar y fusionar slots superpuestos
      allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
      const mergedSlots: Array<{ start: Date; end: Date }> = [];

      for (const slot of allBusySlots) {
        if (mergedSlots.length === 0) {
          mergedSlots.push({ ...slot });
        } else {
          const last = mergedSlots[mergedSlots.length - 1];
          if (slot.start <= last.end) {
            last.end = new Date(Math.max(last.end.getTime(), slot.end.getTime()));
          } else {
            mergedSlots.push({ ...slot });
          }
        }
      }

      return { calendars, allBusySlots: mergedSlots };
    } catch (error) {
      console.error('[Calendar] Error obteniendo free/busy:', error);
      return { calendars: {}, allBusySlots: [] };
    }
  }

  /**
   * Obtiene eventos del calendario de Google desde TODOS los calendarios del usuario
   */
  static async getGoogleCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!calendarsResponse.ok) {
        console.error('Error obteniendo lista de calendarios:', await calendarsResponse.text());
        return await this.getEventsFromSingleCalendar(accessToken, 'primary', startDate, endDate);
      }

      const calendarsData: GoogleCalendarListResponse = await calendarsResponse.json();
      const calendars = calendarsData.items || [];

      const allEvents: CalendarEvent[] = [];

      for (const calendar of calendars) {
        if (selectedCalendarIds && selectedCalendarIds.length > 0) {
          if (!selectedCalendarIds.includes(calendar.id)) continue;
        } else if (!(['owner', 'writer', 'reader'].includes(calendar.accessRole) || calendar.primary)) {
          continue;
        }

        const events = await this.getEventsFromSingleCalendar(accessToken, calendar.id, startDate, endDate);
        allEvents.push(...events);
      }

      allEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return allEvents;
    } catch (error) {
      console.error('Error obteniendo eventos de Google:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos de un calendario específico de Google
   */
  private static async getEventsFromSingleCalendar(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Error obteniendo eventos del calendario ${calendarId}:`, await response.text());
        return [];
      }

      const data: GoogleCalendarEventsResponse = await response.json();

      return (data.items || []).map((event) => ({
        id: event.id,
        title: event.summary || 'Sin título',
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        isAllDay: !!event.start?.date,
        isRecurring: !!event.recurringEventId,
        location: event.location,
        status: event.status === 'confirmed' ? 'confirmed' :
          event.status === 'tentative' ? 'tentative' : 'cancelled',
        calendarId: calendarId,
      }));

    } catch (error) {
      console.error(`Error obteniendo eventos del calendario ${calendarId}:`, error);
      return [];
    }
  }

  /**
   * Crea un evento en el calendario secundario de Google
   * IMPORTANTE: Los eventos se crean ÚNICAMENTE en el calendario secundario de la plataforma
   */
  static async createGoogleEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<{ id: string; htmlLink?: string } | null> {
    try {
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
            summary: event.title,
            description: event.description || '',
            location: event.location || '',
            start: {
              dateTime: event.startTime,
              timeZone: event.timezone,
            },
            end: {
              dateTime: event.endTime,
              timeZone: event.timezone,
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 15 },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error creando evento:', await response.text());
        return null;
      }

      const data: GoogleCreatedEventResponse = await response.json();
      return { id: data.id, htmlLink: data.htmlLink };
    } catch (error) {
      console.error('[Calendar] Error creando evento:', error);
      return null;
    }
  }

  /**
   * Actualiza un evento en el calendario secundario de Google
   */
  static async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    event: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<boolean> {
    try {
      const targetCalendarId = calendarId || 'primary';

      const updateData: GoogleEventUpdatePayload = {};
      if (event.title) updateData.summary = event.title;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.location !== undefined) updateData.location = event.location;
      if (event.startTime && event.timezone) {
        updateData.start = { dateTime: event.startTime, timeZone: event.timezone };
      }
      if (event.endTime && event.timezone) {
        updateData.end = { dateTime: event.endTime, timeZone: event.timezone };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error actualizando evento:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Calendar] Error actualizando evento:', error);
      return false;
    }
  }

  /**
   * Elimina un evento del calendario secundario de Google
   */
  static async deleteGoogleEvent(
    accessToken: string,
    eventId: string,
    calendarId: string | null
  ): Promise<boolean> {
    try {
      const targetCalendarId = calendarId || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) return true;

      // Si es 404 y estamos usando calendario secundario, intentar en primary como fallback
      if (response.status === 404 && targetCalendarId !== 'primary') {
        const fallbackResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (fallbackResponse.ok || fallbackResponse.status === 404) {
          return true;
        }
        return false;
      }

      // 404 en primary = evento ya no existe
      if (response.status === 404) return true;

      console.error('[Calendar] Error eliminando evento:', await response.text());
      return false;
    } catch (error) {
      console.error('[Calendar] Error eliminando evento:', error);
      return false;
    }
  }

  /**
   * Busca el calendario secundario de la plataforma por nombre
   */
  static async findPlatformCalendar(accessToken: string): Promise<string | null> {
    const calendars = await this.getGoogleCalendarList(accessToken);
    const platformCal = calendars.find(cal => cal.summary === PLATFORM_CALENDAR_NAME);
    return platformCal?.id || null;
  }

  /**
   * Crea un calendario secundario para la plataforma
   */
  static async createPlatformCalendar(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: PLATFORM_CALENDAR_NAME,
            description: 'Calendario de sesiones de estudio creado por SofLIA',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error creando calendario secundario:', await response.text());
        return null;
      }

      const data: GoogleCreatedEventResponse = await response.json();
      return data.id;
    } catch (error) {
      console.error('[Calendar] Error creando calendario secundario:', error);
      return null;
    }
  }

  /**
   * Obtiene o crea el calendario secundario de la plataforma
   * Retorna el calendarId del calendario secundario
   */
  static async getOrCreatePlatformCalendar(accessToken: string): Promise<string | null> {
    let calendarId = await this.findPlatformCalendar(accessToken);

    if (calendarId) {
      return calendarId;
    }

    calendarId = await this.createPlatformCalendar(accessToken);
    return calendarId;
  }

  /**
   * Obtiene el email del usuario de Google usando el access token
   */
  static async getGoogleUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo info de usuario de Google:', await response.text());
        return null;
      }

      const data: GoogleUserInfoResponse = await response.json();
      return data.email || null;
    } catch (error) {
      console.error('Error obteniendo email de Google:', error);
      return null;
    }
  }
}
