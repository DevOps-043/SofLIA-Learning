/**
 * Calendar Sync Service
 *
 * Servicio centralizado para sincronización de eventos de calendario.
 * Asegura que siempre se use el calendario secundario correcto para
 * operaciones de CRUD en Google/Microsoft Calendar.
 *
 * IMPORTANTE: Este servicio es el punto único de entrada para operaciones
 * de calendario, garantizando consistencia en el uso del calendario secundario.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CalendarIntegrationService } from './calendar-integration.service';

function createAdminClient() {
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

export interface CalendarContext {
  accessToken: string;
  provider: 'google' | 'microsoft';
  calendarId: string | null;
  userId: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  eventId?: string;
}

export class CalendarSyncService {
  /**
   * Obtiene el contexto de calendario del usuario (access token, provider, calendarId)
   * Incluye refresh de token si está expirado y creación de calendario secundario si no existe
   */
  static async getCalendarContext(userId: string): Promise<CalendarContext | null> {
    const supabase = createAdminClient();

    // Obtener integración de calendario
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('id, access_token, refresh_token, provider, expires_at, metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) {
      return null;
    }

    // Obtener el calendarId del calendario secundario
    const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
    let calendarId = metadata?.secondary_calendar_id || null;

    // Verificar si el token ha expirado
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    let accessToken = integration.access_token;

    if (expiresAt && expiresAt <= new Date() && integration.refresh_token) {
      // Refrescar token
      const refreshedToken = await CalendarIntegrationService.refreshTokenIfNeeded(userId);
      if (refreshedToken) {
        accessToken = refreshedToken;
      } else {
        console.error('[CalendarSync] Error refrescando token');
        return null;
      }
    }

    // Si no hay calendario secundario para Google, intentar crearlo
    if (!calendarId && integration.provider === 'google' && accessToken) {
      calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);

      if (calendarId) {
        // Guardar el calendarId para futuras operaciones
        await supabase
          .from('calendar_integrations')
          .update({
            metadata: { secondary_calendar_id: calendarId },
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);
      }
    }

    return {
      accessToken,
      provider: integration.provider as 'google' | 'microsoft',
      calendarId,
      userId,
    };
  }

  /**
   * Elimina un evento de Google Calendar usando el calendario secundario correcto
   */
  static async deleteGoogleEvent(
    accessToken: string,
    eventId: string,
    calendarId: string | null
  ): Promise<SyncResult> {
    try {
      // Limpiar el ID del evento (puede venir con formato de recurrencia)
      const cleanEventId = eventId.split('_')[0];
      // Usar el calendario secundario si existe, si no usar 'primary'
      const targetCalendarId = calendarId || 'primary';


      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 404 significa que el evento ya no existe, lo cual es OK
      if (response.ok || response.status === 404) {
        return { success: true };
      }

      const errorText = await response.text();
      console.error('[CalendarSync] Error eliminando evento:', errorText);

      // Verificar si es error de permisos
      if (response.status === 403) {
        return {
          success: false,
          error: 'Permisos insuficientes para eliminar el evento. Por favor, reconecta tu calendario.',
        };
      }

      return {
        success: false,
        error: `Error ${response.status}: ${errorText}`,
      };
    } catch (error) {
      console.error('[CalendarSync] Error en deleteGoogleEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Elimina un evento de Microsoft Calendar
   */
  static async deleteMicrosoftEvent(accessToken: string, eventId: string): Promise<SyncResult> {
    try {

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 404 significa que el evento ya no existe, lo cual es OK
      if (response.ok || response.status === 404) {
        return { success: true };
      }

      const errorText = await response.text();
      console.error('[CalendarSync] Error eliminando evento de Microsoft:', errorText);

      return {
        success: false,
        error: `Error ${response.status}: ${errorText}`,
      };
    } catch (error) {
      console.error('[CalendarSync] Error en deleteMicrosoftEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Elimina una sesión de estudio y su evento de calendario asociado
   * @param sessionId - ID de la sesión a eliminar
   * @returns Resultado de la sincronización
   */
  static async deleteSessionWithCalendarSync(sessionId: string): Promise<SyncResult> {
    const supabase = createAdminClient();

    // Obtener la sesión con su external_event_id
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('id, user_id, external_event_id, calendar_provider')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Sesión no encontrada',
      };
    }

    // Si tiene evento externo, eliminarlo primero
    if (session.external_event_id && session.calendar_provider) {
      const context = await this.getCalendarContext(session.user_id);

      if (context) {
        if (session.calendar_provider === 'google') {
          const result = await this.deleteGoogleEvent(
            context.accessToken,
            session.external_event_id,
            context.calendarId
          );

          if (!result.success) {
            console.warn('[CalendarSync] No se pudo eliminar el evento externo:', result.error);
            // Continuar con la eliminación de la sesión aunque falle la eliminación del evento
          }
        } else if (session.calendar_provider === 'microsoft') {
          const result = await this.deleteMicrosoftEvent(context.accessToken, session.external_event_id);

          if (!result.success) {
            console.warn('[CalendarSync] No se pudo eliminar el evento de Microsoft:', result.error);
          }
        }
      }
    }

    // Eliminar la sesión de la base de datos
    const { error: deleteError } = await supabase.from('study_sessions').delete().eq('id', sessionId);

    if (deleteError) {
      return {
        success: false,
        error: `Error eliminando sesión: ${deleteError.message}`,
      };
    }

    return { success: true };
  }

  /**
   * Elimina múltiples sesiones de estudio y sus eventos de calendario
   * @param sessionIds - IDs de las sesiones a eliminar
   * @returns Resultados de la sincronización
   */
  static async bulkDeleteSessionsWithCalendarSync(
    sessionIds: string[]
  ): Promise<{ success: boolean; deleted: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;
    let failed = 0;

    for (const sessionId of sessionIds) {
      const result = await this.deleteSessionWithCalendarSync(sessionId);
      if (result.success) {
        deleted++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`${sessionId}: ${result.error}`);
        }
      }
    }

    return {
      success: failed === 0,
      deleted,
      failed,
      errors,
    };
  }

  /**
   * Crea un evento en Google Calendar usando el calendario secundario
   */
  static async createGoogleEvent(
    accessToken: string,
    eventData: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
    },
    calendarId: string | null
  ): Promise<SyncResult> {
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
            summary: eventData.title,
            description: eventData.description || '',
            start: {
              dateTime: eventData.startTime,
              timeZone: eventData.timezone,
            },
            end: {
              dateTime: eventData.endTime,
              timeZone: eventData.timezone,
            },
            reminders: {
              useDefault: false,
              overrides: [{ method: 'popup', minutes: 15 }],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CalendarSync] Error creando evento:', errorText);
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        };
      }

      const createdEvent = await response.json();

      return {
        success: true,
        eventId: createdEvent.id,
      };
    } catch (error) {
      console.error('[CalendarSync] Error en createGoogleEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Crea un evento en Microsoft Calendar
   */
  static async createMicrosoftEvent(
    accessToken: string,
    eventData: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
    }
  ): Promise<SyncResult> {
    try {

      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: eventData.title,
          body: {
            contentType: 'HTML',
            content: eventData.description || '',
          },
          start: {
            dateTime: eventData.startTime,
            timeZone: eventData.timezone,
          },
          end: {
            dateTime: eventData.endTime,
            timeZone: eventData.timezone,
          },
          reminderMinutesBeforeStart: 15,
          isReminderOn: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CalendarSync] Error creando evento en Microsoft:', errorText);
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        };
      }

      const createdEvent = await response.json();

      return {
        success: true,
        eventId: createdEvent.id,
      };
    } catch (error) {
      console.error('[CalendarSync] Error en createMicrosoftEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Actualiza un evento en Google Calendar usando el calendario secundario
   */
  static async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    eventData: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
    },
    calendarId: string | null
  ): Promise<SyncResult> {
    try {
      const cleanEventId = eventId.split('_')[0];
      const targetCalendarId = calendarId || 'primary';


      const updateBody: Record<string, unknown> = {};

      if (eventData.title) updateBody.summary = eventData.title;
      if (eventData.description !== undefined) updateBody.description = eventData.description;

      if (eventData.startTime && eventData.timezone) {
        updateBody.start = {
          dateTime: eventData.startTime,
          timeZone: eventData.timezone,
        };
      }

      if (eventData.endTime && eventData.timezone) {
        updateBody.end = {
          dateTime: eventData.endTime,
          timeZone: eventData.timezone,
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CalendarSync] Error actualizando evento:', errorText);
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[CalendarSync] Error en updateGoogleEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
