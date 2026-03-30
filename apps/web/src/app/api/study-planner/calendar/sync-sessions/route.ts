/**
 * API Endpoint: Sync Study Sessions to Calendar
 *
 * POST /api/study-planner/calendar/sync-sessions
 *
 * Sincroniza las sesiones de estudio con el calendario del usuario
 * (Google Calendar o Microsoft Calendar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

// Crear cliente admin para bypass de RLS
function createAdminClient() {
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

interface SyncSessionsRequest {
  sessionIds: string[];
}

interface SyncSessionsResponse {
  success: boolean;
  data?: {
    syncedCount: number;
    failedCount: number;
    errors?: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncSessionsResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: SyncSessionsRequest = await request.json();

    if (!body.sessionIds || !Array.isArray(body.sessionIds) || body.sessionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sessionIds es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .in('id', body.sessionIds)
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error obteniendo sesiones:', sessionsError);
      return NextResponse.json(
        { success: false, error: `Error obteniendo sesiones: ${sessionsError.message}` },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.error('No se encontraron sesiones para sincronizar');
      return NextResponse.json(
        { success: false, error: 'No se encontraron sesiones para sincronizar' },
        { status: 404 }
      );
    }

    // Obtener la zona horaria del plan directamente
    let planTimezone = 'UTC';
    const firstSession = sessions[0];
    const planId = (firstSession as any).plan_id;

    if (!planId) {
      console.warn('[Sync Sessions] La sesion no tiene plan_id, usando UTC como zona horaria por defecto');
    } else {
      const { data: planData, error: planError } = await supabase
        .from('study_plans')
        .select('timezone')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single();

      if (planError) {
        console.error('[Sync Sessions] Error obteniendo plan:', planError);
        console.warn('[Sync Sessions] Usando UTC como zona horaria por defecto');
      } else if (planData && planData.timezone) {
        planTimezone = planData.timezone;
      } else {
        console.warn('[Sync Sessions] El plan no tiene zona horaria configurada, usando UTC');
      }
    }

    // Obtener integración de calendario del usuario
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay calendario conectado' },
        { status: 404 }
      );
    }

    const integration = integrations[0];

    // Obtener el calendarId del calendario secundario de la plataforma (solo para Google)
    let secondaryCalendarId: string | null = null;
    if (integration.provider === 'google') {
      // Primero intentar obtener de la BD
      secondaryCalendarId = await CalendarIntegrationService.getSecondaryCalendarId(user.id);

      if (!secondaryCalendarId) {
      }
    }

    // Verificar si el token ha expirado y refrescarlo si es necesario
    let accessToken = integration.access_token;
    let tokenExpiry: Date | null = null;

    if (integration.expires_at) {
      try {
        tokenExpiry = new Date(integration.expires_at);
      } catch (e) {
        console.warn('[Sync Sessions] Error parseando expires_at:', e);
        tokenExpiry = null;
      }
    }

    // Si no hay fecha de expiración o el token está expirado, intentar refrescar
    const needsRefresh = !tokenExpiry || !integration.expires_at || tokenExpiry <= new Date();

    if (needsRefresh) {
      // Verificar que haya refresh_token disponible
      if (!integration.refresh_token) {
        console.error('[Sync Sessions] No hay refresh_token disponible');
        return NextResponse.json(
          { success: false, error: 'Token expirado y no hay refresh token disponible. Por favor, reconecta tu calendario.' },
          { status: 401 }
        );
      }

      const refreshResult = await refreshAccessToken(integration);
      if (!refreshResult.success || !refreshResult.accessToken) {
        console.error('[Sync Sessions] No se pudo refrescar el token');
        return NextResponse.json(
          { success: false, error: 'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.' },
          { status: 401 }
        );
      }
      accessToken = refreshResult.accessToken;
    }

    // Si es Google y no tenemos calendario secundario, intentar crearlo/obtenerlo ahora
    if (integration.provider === 'google' && !secondaryCalendarId) {
      secondaryCalendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);

      if (secondaryCalendarId) {
        // Guardar el calendarId en la BD para futuras sincronizaciones
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin
          .from('calendar_integrations')
          .update({
            metadata: { secondary_calendar_id: secondaryCalendarId },
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', 'google');

      } else {
        console.warn('[Sync Sessions] No se pudo crear el calendario secundario, se usara el principal');
      }
    }

    // Sincronizar sesiones según el proveedor
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      try {
        let eventId: string | null = null;

        if (integration.provider === 'google') {
          // Crear eventos en el calendario secundario de la plataforma
          const result = await createGoogleCalendarEvent(accessToken, session, planTimezone, secondaryCalendarId, user.id);
          eventId = result.eventId;
          // Si el calendario secundario cambió (fue recreado), actualizar para las siguientes sesiones
          if (result.newCalendarId && result.newCalendarId !== secondaryCalendarId) {
            secondaryCalendarId = result.newCalendarId;
          }
        } else if (integration.provider === 'microsoft') {
          eventId = await createMicrosoftCalendarEvent(accessToken, session, planTimezone);
        } else {
          console.error(`[Sync Sessions] Proveedor desconocido: ${integration.provider}`);
          failedCount++;
          errors.push(`Proveedor de calendario desconocido: ${integration.provider}`);
          continue;
        }

        if (eventId) {
          // Actualizar la sesión con el ID del evento del calendario
          const { error: updateError } = await supabase
            .from('study_sessions')
            .update({
              external_event_id: eventId,
              calendar_provider: integration.provider,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (updateError) {
            console.error(`[${i + 1}/${sessions.length}] Error actualizando sesion en BD:`, updateError);
          }

          syncedCount++;
        } else {
          failedCount++;
          const errorMsg = `No se pudo crear evento para sesion: ${session.title}`;
          errors.push(errorMsg);
          console.error(`[${i + 1}/${sessions.length}] ${errorMsg}`);
        }
      } catch (error: any) {
        failedCount++;
        const errorMsg = `Error sincronizando sesion ${session.title}: ${error.message || 'Error desconocido'}`;
        errors.push(errorMsg);
        console.error(`[${i + 1}/${sessions.length}] ${errorMsg}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        syncedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('Error sincronizando sesiones con calendario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

/**
 * Refresca el access token usando el refresh token
 */
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
                           process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
                           process.env.GOOGLE_CLIENT_ID ||
                           process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
                               process.env.GOOGLE_CLIENT_SECRET ||
                               process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.MICROSOFT_CLIENT_ID ||
                              process.env.MICROSOFT_OAUTH_CLIENT_ID || '';
  const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
                                  process.env.MICROSOFT_CLIENT_SECRET ||
                                  process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '';

  try {
    if (integration.provider === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
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
        console.error('Error refrescando token de Google:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();

      // Preservar el refresh_token existente si no viene uno nuevo
      const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;

      // Actualizar en base de datos
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };

    } else if (integration.provider === 'microsoft') {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Error refrescando token de Microsoft:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();

      // Actualizar en base de datos
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }

    return { success: false };
  } catch (error) {
    console.error('Error en refreshAccessToken:', error);
    return { success: false };
  }
}

/**
 * Formatea una fecha en formato ISO 8601 manteniendo la hora local de la zona horaria especificada
 * Esto evita el problema de conversión a UTC que causa desfases de hora
 */
function formatDateTimeInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Crea un evento en Google Calendar
 * Si el calendario secundario no existe (404), intenta recrearlo o usa el primario como fallback
 */
async function createGoogleCalendarEvent(
  accessToken: string,
  session: any,
  timezone: string = 'UTC',
  calendarId: string | null = null,
  userId?: string
): Promise<{ eventId: string | null; newCalendarId?: string }> {
  try {
    // Formatear descripción con todas las lecciones
    let description = '';

    if (session.description) {
      const lines = session.description.split('\n').filter((line: string) => line.trim().length > 0);

      if (lines.length > 1) {
        const formattedLessons = lines.map((line: string) => {
          const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
          return `\u2022 ${cleanLine}`;
        }).join('<br>');

        description = `<strong>Lecciones a estudiar:</strong><br><br>${formattedLessons}`;
      } else if (lines.length === 1) {
        const cleanLine = (lines[0] as string).replace(/^\d+\.\s*/, '').trim();
        description = `<strong>Leccion:</strong><br><br>\u2022 ${cleanLine}`;
      } else {
        description = session.description;
      }
    } else {
      description = `Sesion de estudio${session.course_id ? ` - Curso: ${session.course_id}` : ''}`;
    }

    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Fechas invalidas en sesion:', {
        sessionId: session.id,
        start_time: session.start_time,
        end_time: session.end_time
      });
      return { eventId: null };
    }

    const startDateTime = formatDateTimeInTimezone(startTime, timezone);
    const endDateTime = formatDateTimeInTimezone(endTime, timezone);

    const event = {
      summary: session.title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    // Usar el calendario secundario de la plataforma si está disponible, sino el primario
    const targetCalendarId = calendarId || 'primary';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google Calendar] Error creando evento:', response.status, errorText);

      // Si el calendario secundario no existe (404), intentar recrearlo o usar el primario
      if (response.status === 404 && targetCalendarId !== 'primary') {

        // Intentar crear un nuevo calendario secundario
        const newCalendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);

        if (newCalendarId) {

          // Actualizar en BD para futuras sincronizaciones
          if (userId) {
            const supabaseAdmin = createAdminClient();
            await supabaseAdmin
              .from('calendar_integrations')
              .update({
                metadata: { secondary_calendar_id: newCalendarId },
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
              .eq('provider', 'google');
          }

          // Reintentar con el nuevo calendario
          const retryResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(newCalendarId)}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (retryResponse.ok) {
            const retryEvent = await retryResponse.json();
            return { eventId: retryEvent.id, newCalendarId };
          }

          console.error('[Google Calendar] Fallo crear evento en nuevo calendario secundario');
        }

        // Fallback al calendario primario
        const fallbackResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (fallbackResponse.ok) {
          const fallbackEvent = await fallbackResponse.json();
          return { eventId: fallbackEvent.id };
        }

        console.error('[Google Calendar] Fallback al calendario principal tambien fallo');
      }

      return { eventId: null };
    }

    const createdEvent = await response.json();
    return { eventId: createdEvent.id };
  } catch (error) {
    console.error('Error en createGoogleCalendarEvent:', error);
    return { eventId: null };
  }
}

/**
 * Crea un evento en Microsoft Calendar
 */
async function createMicrosoftCalendarEvent(accessToken: string, session: any, timezone: string = 'UTC'): Promise<string | null> {
  try {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Fechas invalidas en sesion:', {
        sessionId: session.id,
        start_time: session.start_time,
        end_time: session.end_time
      });
      return null;
    }

    const startDateTime = formatDateTimeInTimezone(startTime, timezone);
    const endDateTime = formatDateTimeInTimezone(endTime, timezone);

    const event = {
      subject: session.title,
      body: {
        contentType: 'HTML',
        content: session.description || `Sesion de estudio${session.course_id ? ` - Curso: ${session.course_id}` : ''}`,
      },
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone,
      },
      reminderMinutesBeforeStart: 15,
      isReminderOn: true,
    };

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Microsoft Calendar] Error creando evento:', response.status, errorText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  } catch (error) {
    console.error('Error en createMicrosoftCalendarEvent:', error);
    return null;
  }
}
