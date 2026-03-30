/**
 * API Endpoint: Get Study Sessions
 * 
 * GET /api/study-planner/sessions
 * 
 * Obtiene las sesiones de estudio del usuario en un rango de fechas
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';

// Crear cliente admin para bypass de RLS
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        sessions: []
      }, { status: 401 });
    }

    // Obtener parámetros de fecha
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ 
        error: 'Faltan parámetros startDate y endDate',
        sessions: []
      }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Obtener sesiones de estudio del usuario en el rango de fechas
    const supabase = createAdminClient();
    
    // Primero verificar si el usuario tiene un plan activo
    const { data: activePlan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Si no hay plan activo, retornar array vacío
    if (planError || !activePlan) {
      return NextResponse.json({ 
        sessions: [],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalSessions: 0,
        hasActivePlan: false
      });
    }
    
    // ✅ SINCRONIZAR: Verificar si eventos eliminados manualmente en Google Calendar
    await syncDeletedStudySessions(supabase, user.id, startDate, endDate);

    // Solo obtener sesiones que pertenezcan al plan activo
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        course_id,
        lesson_id,
        is_ai_generated,
        session_type,
        external_event_id,
        calendar_provider
      `)
      .eq('user_id', user.id)
      .eq('plan_id', activePlan.id)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error obteniendo sesiones de estudio:', error);
      return NextResponse.json({ 
        error: 'Error al obtener sesiones',
        sessions: []
      }, { status: 500 });
    }

    return NextResponse.json({ 
      sessions: sessions || [],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSessions: sessions?.length || 0
    });

  } catch (error: any) {
    console.error('Error en GET /api/study-planner/sessions:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor',
      sessions: []
    }, { status: 500 });
  }
}

/**
 * Sincroniza sesiones de estudio: limpia external_event_id de sesiones cuyos eventos fueron eliminados manualmente en Google Calendar
 */
async function syncDeletedStudySessions(
  supabase: any,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  try {
    // Obtener integración de calendario (incluir metadata para secondaryCalendarId e id para refresh)
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('id, access_token, provider, refresh_token, expires_at, metadata')
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
    const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();

    if (needsRefresh && integration.refresh_token) {
      // Refrescar token si es necesario
      const refreshResult = await refreshAccessToken(integration);
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken;
      } else {
        return; // No se pudo refrescar el token
      }
    }

    // Obtener todas las sesiones con external_event_id en el rango de fechas
    const { data: sessionsWithEvents } = await supabase
      .from('study_sessions')
      .select('id, external_event_id, calendar_provider')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null)
      .eq('calendar_provider', integration.provider)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());

    if (!sessionsWithEvents || sessionsWithEvents.length === 0) {
      return; // No hay sesiones con eventos externos
    }

    // Obtener el secondaryCalendarId para buscar en AMBOS calendarios (primary + SOFLIA)
    const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
    const secondaryCalendarId = metadata?.secondary_calendar_id || null;

    // Obtener eventos actuales del calendario externo
    let externalEvents: any[] = [];

    if (integration.provider === 'google') {
      externalEvents = await getGoogleCalendarEvents(accessToken, startDate, endDate, secondaryCalendarId);
    } else if (integration.provider === 'microsoft') {
      externalEvents = await getMicrosoftCalendarEvents(accessToken, startDate, endDate);
    }

    // Crear un Set con los IDs de eventos externos que existen (limpiando formato de recurrencia)
    const externalEventIds = new Set(
      externalEvents.map((e: any) => {
        const eventId = e.id;
        return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
      })
    );

    // Encontrar sesiones cuyos eventos fueron eliminados en el calendario externo
    const sessionsToClean: string[] = [];

    for (const session of sessionsWithEvents) {
      if (!session.external_event_id) continue;
      
      // Limpiar el ID del evento (puede venir con formato de recurrencia)
      const cleanEventId = typeof session.external_event_id === 'string' 
        ? session.external_event_id.split('_')[0] 
        : String(session.external_event_id).split('_')[0];

      // Si el evento no está en la lista de eventos externos, fue eliminado
      if (!externalEventIds.has(cleanEventId)) {
        sessionsToClean.push(session.id);
      }
    }

    // Limpiar external_event_id y calendar_provider de sesiones cuyos eventos fueron eliminados
    if (sessionsToClean.length > 0) {
      
      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          external_event_id: null,
          calendar_provider: null,
          updated_at: new Date().toISOString()
        })
        .in('id', sessionsToClean)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [Sync Study Sessions] Error limpiando sesiones:', updateError);
      } else {
      }
    }
  } catch (error) {
    console.error('❌ [Sync Study Sessions] Error en syncDeletedStudySessions:', error);
    // No lanzar error para que la carga de sesiones continúe
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
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return { success: false };
      }
      
      if (!integration.refresh_token) {
        return { success: false };
      }
      
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
      
      if (!tokens.access_token) {
        return { success: false };
      }
      
      const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;
      
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
      
    } else if (integration.provider === 'microsoft') {
      if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
        return { success: false };
      }
      
      if (!integration.refresh_token) {
        return { success: false };
      }
      
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
          scope: 'offline_access Calendars.Read User.Read',
        }),
      });

      if (!response.ok) {
        return { success: false };
      }

      const tokens = await response.json();
      
      if (!tokens.access_token) {
        return { success: false };
      }
      
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
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
 * Obtiene eventos de Google Calendar
 */
async function getGoogleCalendarEvents(accessToken: string, startDate: Date, endDate: Date, secondaryCalendarId?: string | null): Promise<any[]> {
  try {
    // Buscar en el calendario primary
    const allEvents: any[] = [];

    const primaryResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startDate.toISOString()}&` +
      `timeMax=${endDate.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=250`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (primaryResponse.ok) {
      const data = await primaryResponse.json();
      allEvents.push(...(data.items || []));
    }

    // Buscar en el calendario secundario SOFLIA si existe
    if (secondaryCalendarId && secondaryCalendarId !== 'primary') {
      const secondaryResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(secondaryCalendarId)}/events?` +
        `timeMin=${startDate.toISOString()}&` +
        `timeMax=${endDate.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=250`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (secondaryResponse.ok) {
        const data = await secondaryResponse.json();
        allEvents.push(...(data.items || []));
      }
    }

    return allEvents;
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

