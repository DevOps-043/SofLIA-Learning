/**
 * API Endpoint: Manage Calendar Events
 * 
 * GET /api/study-planner/events - Obtener eventos personalizados
 * POST /api/study-planner/events - Crear evento personalizado
 * PUT /api/study-planner/events/[id] - Editar evento
 * DELETE /api/study-planner/events/[id] - Eliminar evento
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../features/study-planner/services/calendar-integration.service';

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

/**
 * GET /api/study-planner/events
 * Obtiene eventos personalizados del usuario y sincroniza con calendarios externos
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Faltan parámetros startDate y endDate' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Obtener eventos locales
    const { data: events, error } = await supabase
      .from('user_calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startDateParam)
      .lte('end_time', endDateParam)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error obteniendo eventos:', error);
      
      // Si el error es que la tabla no existe o no está en el caché de PostgREST
      // Retornar array vacío para que la aplicación siga funcionando
      // mientras PostgREST actualiza su caché
      if (error.code === 'PGRST205' || 
          error.message?.includes('Could not find the table') ||
          error.message?.includes('schema cache')) {
        console.warn('⚠️ Tabla user_calendar_events no disponible en PostgREST. Retornando array vacío. Esto es normal después de crear la tabla - espera 1-2 minutos.');
        
        // Retornar array vacío en lugar de error para que la app siga funcionando
        return NextResponse.json({
          events: [],
          warning: 'La tabla user_calendar_events aún no está disponible en PostgREST. Si acabas de ejecutar la migración, espera 1-2 minutos y recarga la página. Si el problema persiste, reinicia tu proyecto de Supabase.'
        });
      }
      
      return NextResponse.json(
        { error: 'Error al obtener eventos', details: error.message },
        { status: 500 }
      );
    }

    // Sincronizar: eliminar eventos locales que fueron eliminados en Google/Microsoft Calendar
    if (events && events.length > 0) {
      await syncDeletedEvents(supabase, user.id, events, startDateParam, endDateParam);
      
      // ✅ LIMPIAR EVENTOS HUÉRFANOS: Eliminar eventos en user_calendar_events que corresponden a sesiones eliminadas
      await cleanupOrphanedPlanEvents(supabase, user.id);
      
      // Obtener eventos actualizados después de la sincronización
      const { data: updatedEvents } = await supabase
        .from('user_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDateParam)
        .lte('end_time', endDateParam)
        .order('start_time', { ascending: true });
      
      return NextResponse.json({
        events: updatedEvents || [],
      });
    }

    // ✅ LIMPIAR EVENTOS HUÉRFANOS incluso si no hay eventos en el rango
    await cleanupOrphanedPlanEvents(supabase, user.id);

    return NextResponse.json({
      events: events || [],
    });
  } catch (error: any) {
    console.error('Error en GET /api/study-planner/events:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Sincroniza eventos eliminados: elimina eventos locales que fueron eliminados en Google/Microsoft Calendar
 */
async function syncDeletedEvents(
  supabase: any,
  userId: string,
  localEvents: any[],
  startDate: string,
  endDate: string
) {
  try {
    // Obtener integración de calendario
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('access_token, provider, refresh_token, expires_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) {
      return; // No hay calendario conectado
    }

    // Verificar si el token ha expirado
    let accessToken = integration.access_token;
    const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
    
    if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
      // Refrescar token si es necesario
      const refreshResult = await refreshAccessToken(integration);
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken;
      } else {
        return; // No se pudo refrescar el token
      }
    }

    // Obtener eventos actuales del calendario externo
    let externalEvents: any[] = [];
    
    if (integration.provider === 'google') {
      externalEvents = await getGoogleCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
    } else if (integration.provider === 'microsoft') {
      externalEvents = await getMicrosoftCalendarEvents(accessToken, new Date(startDate), new Date(endDate));
    }

    // Crear un Set con los IDs de eventos externos que existen
    const externalEventIds = new Set(
      externalEvents.map((e: any) => e.id)
    );

    // Encontrar eventos locales que tienen google_event_id pero ya no existen en el calendario externo
    const eventsToDelete = localEvents.filter((localEvent: any) => {
      const googleEventId = localEvent.google_event_id;
      const microsoftEventId = localEvent.microsoft_event_id;
      
      if (!googleEventId && !microsoftEventId) {
        return false; // Evento local sin sincronización externa
      }

      // Si el evento tiene un ID externo pero no está en la lista de eventos externos, fue eliminado
      if (googleEventId && !externalEventIds.has(googleEventId)) {
        return true;
      }
      if (microsoftEventId && !externalEventIds.has(microsoftEventId)) {
        return true;
      }

      return false;
    });

    // Eliminar eventos que fueron eliminados en el calendario externo
    if (eventsToDelete.length > 0) {

      const eventIdsToDelete = eventsToDelete.map((e: any) => e.id);
      
      const { error: deleteError } = await supabase
        .from('user_calendar_events')
        .delete()
        .in('id', eventIdsToDelete)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error eliminando eventos sincronizados:', deleteError);
      } else {

      }
    }
  } catch (error) {
    console.error('Error en syncDeletedEvents:', error);
    // No lanzar error para que la carga de eventos continúe
  }
}

/**
 * Limpia eventos huérfanos en user_calendar_events que corresponden a sesiones eliminadas
 */
async function cleanupOrphanedPlanEvents(supabase: any, userId: string): Promise<void> {
  try {
    // Obtener todos los external_event_id de las sesiones activas
    const { data: activeSessions } = await supabase
      .from('study_sessions')
      .select('external_event_id, calendar_provider')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null);

    // Crear un Set con los IDs de eventos activos (limpiando formato de recurrencia)
    const activeEventIds = new Set(
      (activeSessions || []).map(s => {
        const eventId = s.external_event_id;
        return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
      })
    );

    // Obtener eventos en user_calendar_events que tienen google_event_id o microsoft_event_id
    const { data: calendarEvents } = await supabase
      .from('user_calendar_events')
      .select('id, google_event_id, microsoft_event_id')
      .eq('user_id', userId)
      .or('google_event_id.not.is.null,microsoft_event_id.not.is.null');

    if (!calendarEvents || calendarEvents.length === 0) {
      return; // No hay eventos para limpiar
    }

    // Encontrar eventos huérfanos (tienen external_event_id pero no están en sesiones activas)
    const orphanedEventIds: string[] = [];

    for (const event of calendarEvents) {
      const googleEventId = event.google_event_id ? String(event.google_event_id).split('_')[0] : null;
      const microsoftEventId = event.microsoft_event_id ? String(event.microsoft_event_id).split('_')[0] : null;

      // Si el evento tiene un external_event_id pero NO está en la lista de sesiones activas, es huérfano
      if (googleEventId && !activeEventIds.has(googleEventId)) {
        orphanedEventIds.push(event.id);
      } else if (microsoftEventId && !activeEventIds.has(microsoftEventId)) {
        orphanedEventIds.push(event.id);
      }
    }

    // Eliminar eventos huérfanos
    if (orphanedEventIds.length > 0) {
      
      const { error: deleteError } = await supabase
        .from('user_calendar_events')
        .delete()
        .in('id', orphanedEventIds)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ [Cleanup] Error eliminando eventos huérfanos:', deleteError);
      } else {
      }
    }
  } catch (error) {
    console.error('❌ [Cleanup] Error en cleanupOrphanedPlanEvents:', error);
    // No lanzar error para que la carga de eventos continúe
  }
}

/**
 * Obtiene eventos de Google Calendar
 * IMPORTANTE: Consulta TODOS los calendarios del usuario para detectar conflictos de horarios
 */
async function getGoogleCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    // Usar el servicio centralizado que consulta todos los calendarios
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(accessToken, startDate, endDate);

    // Transformar al formato esperado por el resto del código
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
async function getMicrosoftCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
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

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error obteniendo eventos de Microsoft Calendar:', error);
    return [];
  }
}

/**
 * Refresca el access token
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
        return { success: false };
      }

      const tokens = await response.json();
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
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
        return { success: false };
      }

      const tokens = await response.json();
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
 * POST /api/study-planner/events
 * Crea un evento personalizado
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, start, end, location, isAllDay, color } = body;

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: title, start, end' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar si el usuario tiene Google Calendar conectado y sincronizar
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('access_token, provider, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    let googleEventId: string | null = null;
    let provider = 'local';

    // Si hay integración de Google, crear el evento en el calendario secundario de la plataforma
    if (integration?.access_token) {
      try {
        // Obtener el calendarId del calendario secundario
        const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
        let secondaryCalendarId = metadata?.secondary_calendar_id || null;

        // Si no hay calendario secundario guardado, intentar crearlo
        if (!secondaryCalendarId) {
          secondaryCalendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(integration.access_token);
          if (secondaryCalendarId) {
            // Guardar para futuras operaciones
            await supabase
              .from('calendar_integrations')
              .update({ metadata: { secondary_calendar_id: secondaryCalendarId } })
              .eq('user_id', user.id)
              .eq('provider', 'google');
          }
        }

        const googleEvent = await createGoogleCalendarEvent(
          integration.access_token,
          { title, description, start, end, location, isAllDay },
          secondaryCalendarId
        );
        googleEventId = googleEvent.id;
        provider = 'google';
      } catch (error) {
        console.error('Error creando evento en Google Calendar:', error);
        // Continuar con la creación local aunque falle en Google
      }
    }

    // Crear evento personalizado en la base de datos
    const { data: event, error } = await supabase
      .from('user_calendar_events')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        start_time: start,
        end_time: end,
        location: location || null,
        is_all_day: isAllDay || false,
        provider,
        source: provider === 'google' ? 'calendar_sync' : 'user_created',
        google_event_id: googleEventId,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando evento:', error);
      
      // Si el error es que la tabla no existe o no está en el caché de PostgREST
      if (error.code === 'PGRST205' || 
          error.message?.includes('Could not find the table') ||
          error.message?.includes('schema cache')) {
        return NextResponse.json(
          { 
            error: 'La tabla user_calendar_events no está disponible en PostgREST.',
            hint: 'Si acabas de ejecutar la migración, espera 1-2 minutos y vuelve a intentar. Si el problema persiste, reinicia tu proyecto de Supabase desde Settings > Restart Project.'
          },
          { status: 503 } // 503 Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear el evento', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error: any) {
    console.error('Error en POST /api/study-planner/events:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Crea un evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
async function createGoogleCalendarEvent(
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
) {
  // Usar el calendario secundario de la plataforma si está disponible
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

  return await response.json();
}
