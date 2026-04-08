/**
 * API Endpoint: Check Calendar Changes
 * 
 * POST /api/study-planner/calendar/check-changes
 * 
 * Detecta cambios entre las sesiones guardadas en la BD y los eventos en el calendario:
 * - Eventos eliminados del calendario (pero aún en BD)
 * - Eventos modificados en el calendario
 * - Nuevos eventos en el calendario que podrían afectar sesiones
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';

type AdminCalendarClient = ReturnType<typeof createAdminClient>;

interface CalendarIntegrationRow {
  id: string;
  provider: 'google' | 'microsoft' | string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

interface StudySessionRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  external_event_id: string | null;
}

interface ExternalCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

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

interface CalendarChange {
  type: 'deleted_event' | 'modified_event' | 'conflict';
  sessionId: string;
  sessionTitle: string;
  eventTime: string;
  externalEventId: string;
  suggestedAction?: string;
}

interface CheckChangesResponse {
  success: boolean;
  data?: {
    changes: CalendarChange[];
    deletedSessions: number;
    modifiedSessions: number;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckChangesResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const supabase = createAdminClient();
    
    const requestedPlanId = request.nextUrl.searchParams.get('planId') || undefined;

    // 1. Obtener el plan seleccionado del usuario o el mÃ¡s reciente
    let planQuery = supabase
      .from('study_plans')
      .select('id, timezone')
      .eq('user_id', user.id);

    if (requestedPlanId) {
      planQuery = planQuery.eq('id', requestedPlanId);
    } else {
      planQuery = planQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: activePlan, error: planError } = await planQuery.single();
    
    if (planError || !activePlan) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          deletedSessions: 0,
          modifiedSessions: 0,
        }
      });
    }
    
    // 2. Obtener todas las sesiones del plan que tienen external_event_id (sincronizadas con calendario)
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id, title, start_time, end_time, external_event_id, calendar_provider, status')
      .eq('plan_id', activePlan.id)
      .eq('user_id', user.id)
      .not('external_event_id', 'is', null);
    
    if (sessionsError) {
      console.error('Error obteniendo sesiones:', sessionsError);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo sesiones' },
        { status: 500 }
      );
    }
    
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          deletedSessions: 0,
          modifiedSessions: 0,
        }
      });
    }
    
    // 3. Obtener integración de calendario
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          deletedSessions: 0,
          modifiedSessions: 0,
        }
      });
    }
    
    const integration = (integrations as CalendarIntegrationRow[])[0];
    
    // 4. Refrescar token si es necesario
    let accessToken = integration.access_token;
    const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
    const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();
    
    if (needsRefresh && integration.refresh_token) {
      const refreshResult = await refreshAccessToken(integration);
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken;
      }
    }
    
    // 5. Verificar cada evento en el calendario
    const changes: CalendarChange[] = [];
    const deletedSessionIds: string[] = [];
    
    const dateNow = new Date();
    const dateInFuture = new Date();
    dateInFuture.setDate(dateInFuture.getDate() + 60); // Verificar próximos 60 días
    
    if (integration.provider === 'google') {
      // Obtener eventos del calendario
      const calendarEvents = await getGoogleCalendarEvents(
        accessToken,
        dateNow,
        dateInFuture
      );
      
      // Crear mapa de eventos por ID
      const eventMap = new Map(calendarEvents.map(e => [e.id, e]));
      
      // Verificar cada sesión
      for (const session of sessions as StudySessionRow[]) {
        const eventId = session.external_event_id;
        if (!eventId) continue;
        
        const calendarEvent = eventMap.get(eventId);
        
        if (!calendarEvent) {
          // Evento eliminado del calendario
          changes.push({
            type: 'deleted_event',
            sessionId: session.id,
            sessionTitle: session.title,
            eventTime: new Date(session.start_time).toLocaleString('es-ES', {
              dateStyle: 'short',
              timeStyle: 'short'
            }),
            externalEventId: eventId,
            suggestedAction: 'La sesión fue eliminada del calendario. ¿Quieres eliminarla también del plan?'
          });
          deletedSessionIds.push(session.id);
        } else {
          // Verificar si el evento fue modificado (cambió hora de inicio/fin)
          const sessionStart = new Date(session.start_time);
          const eventStart = new Date(calendarEvent.start);
          
          // Tolerancia de 5 minutos para diferencias menores
          const timeDiff = Math.abs(sessionStart.getTime() - eventStart.getTime());
          if (timeDiff > 5 * 60 * 1000) {
            changes.push({
              type: 'modified_event',
              sessionId: session.id,
              sessionTitle: session.title,
              eventTime: eventStart.toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short'
              }),
              externalEventId: eventId,
              suggestedAction: `El evento fue modificado en el calendario. Nueva hora: ${eventStart.toLocaleString('es-ES')}`
            });
          }
        }
      }
    } else if (integration.provider === 'microsoft') {
      // Similar para Microsoft Calendar
      const calendarEvents = await getMicrosoftCalendarEvents(
        accessToken,
        dateNow,
        dateInFuture
      );
      
      const eventMap = new Map(calendarEvents.map(e => [e.id, e]));
      
      for (const session of sessions as StudySessionRow[]) {
        const eventId = session.external_event_id;
        if (!eventId) continue;
        
        const calendarEvent = eventMap.get(eventId);
        
        if (!calendarEvent) {
          changes.push({
            type: 'deleted_event',
            sessionId: session.id,
            sessionTitle: session.title,
            eventTime: new Date(session.start_time).toLocaleString('es-ES', {
              dateStyle: 'short',
              timeStyle: 'short'
            }),
            externalEventId: eventId,
            suggestedAction: 'La sesión fue eliminada del calendario. ¿Quieres eliminarla también del plan?'
          });
          deletedSessionIds.push(session.id);
        } else {
          const sessionStart = new Date(session.start_time);
          const eventStart = new Date(calendarEvent.start);
          const timeDiff = Math.abs(sessionStart.getTime() - eventStart.getTime());
          
          if (timeDiff > 5 * 60 * 1000) {
            changes.push({
              type: 'modified_event',
              sessionId: session.id,
              sessionTitle: session.title,
              eventTime: eventStart.toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short'
              }),
              externalEventId: eventId,
              suggestedAction: `El evento fue modificado en el calendario. Nueva hora: ${eventStart.toLocaleString('es-ES')}`
            });
          }
        }
      }
    }
    
    // 6. Actualizar estado de sesiones eliminadas en la BD
    if (deletedSessionIds.length > 0) {
      await supabase
        .from('study_sessions')
        .update({
          external_event_id: null,
          calendar_provider: null,
          status: 'missed',
          updated_at: new Date().toISOString()
        })
        .in('id', deletedSessionIds);

    }
    
    const deletedCount = changes.filter(c => c.type === 'deleted_event').length;
    const modifiedCount = changes.filter(c => c.type === 'modified_event').length;
    
    return NextResponse.json({
      success: true,
      data: {
        changes,
        deletedSessions: deletedCount,
        modifiedSessions: modifiedCount,
      }
    });
    
  } catch (error: unknown) {
    console.error('Error verificando cambios en calendario:', error);
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
 * Refresca el access token
 */
async function refreshAccessToken(integration: CalendarIntegrationRow): Promise<{ success: boolean; accessToken?: string }> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || 
                           process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
                           process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
                               process.env.GOOGLE_CLIENT_SECRET || '';
  const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.MICROSOFT_CLIENT_ID || '';
  const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
                                  process.env.MICROSOFT_CLIENT_SECRET || '';

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

      if (!response.ok) return { success: false };
      const tokens = await response.json() as TokenRefreshResponse;
      if (!tokens.access_token) return { success: false };
      
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

      if (!response.ok) return { success: false };
      const tokens = await response.json() as TokenRefreshResponse;
      if (!tokens.access_token) return { success: false };
      
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
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
async function getGoogleCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
  try {
    const response = await fetch(
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

    if (!response.ok) {
      console.error('Error obteniendo eventos de Google:', await response.text());
      return [];
    }

    const data = await response.json() as { items?: Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }> };
    return (data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || 'Sin título',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
    }));
  } catch (error) {
    console.error('Error en getGoogleCalendarEvents:', error);
    return [];
  }
}

/**
 * Obtiene eventos de Microsoft Calendar
 */
async function getMicrosoftCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
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
      console.error('Error obteniendo eventos de Microsoft:', await response.text());
      return [];
    }

    const data = await response.json() as { value?: Array<{ id: string; subject?: string; start?: { dateTime?: string }; end?: { dateTime?: string } }> };
    return (data.value || []).map((event) => ({
      id: event.id,
      title: event.subject || 'Sin título',
      start: event.start?.dateTime,
      end: event.end?.dateTime,
    }));
  } catch (error) {
    console.error('Error en getMicrosoftCalendarEvents:', error);
    return [];
  }
}
