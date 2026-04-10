/**
 * API Endpoint: Study Plan Management
 * 
 * DELETE /api/study-planner/plan
 * 
 * Elimina el plan de estudio actual del usuario y todas sus sesiones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../features/auth/services/session.service';
import {
  deleteGoogleCalendarEvent as deleteCanonicalGoogleCalendarEvent,
  resolveSessionCalendarSync,
} from '@/app/api/study-planner/dashboard/chat/calendar.service';

interface CalendarIntegrationData {
  id: string;
  provider: 'google' | 'microsoft';
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  metadata?: { secondary_calendar_id?: string } | null;
}

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface DeletePlanResponse {
  success: boolean;
  message?: string;
  error?: string;
  deletedPlanId?: string;
  deletedSessionsCount?: number;
  deletedCalendarEventsCount?: number;
  calendarDeletionErrors?: number;
  calendarEventsNotFound?: number;
}

export async function DELETE(request: NextRequest): Promise<NextResponse<DeletePlanResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const requestedPlanId =
      request.nextUrl.searchParams.get('planId')
      || (await request.json().catch(() => ({})) as { planId?: string }).planId
      || null;

    if (!requestedPlanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'planId es requerido para eliminar un plan',
        },
        { status: 400 }
      );
    }

    // Usar cliente admin para bypass de RLS
    const supabase = createAdminClient();
    
    // Obtener el plan solicitado del usuario
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', requestedPlanId)
      .eq('user_id', user.id)
      .single();
    
    if (planError || !plan) {
      // Si no hay plan, retornar éxito (no hay nada que eliminar)
      return NextResponse.json({
        success: false,
        error: 'Plan no encontrado o no autorizado',
      }, { status: 404 });
    }
    
    const planId = plan.id;
    
    // Obtener todas las sesiones del plan para resolver el vinculo de calendario
    const { data: sessions, error: sessionsFetchError } = await supabase
      .from('study_sessions')
      .select('id, external_event_id, calendar_provider, metrics')
      .eq('plan_id', planId);
    
    if (sessionsFetchError) {
      console.error('Error obteniendo sesiones:', sessionsFetchError);
      // Continuar con la eliminación aunque falle esto
    }
    
    // Eliminar eventos del calendario externo (Google/Microsoft) si existen
    let deletedCalendarEventsCount = 0;
    let calendarDeletionErrors = 0;
    let calendarEventsNotFound = 0;
    if (sessions && sessions.length > 0) {
      // Obtener integración de calendario del usuario (incluyendo metadata con secondary_calendar_id)
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('id, access_token, refresh_token, provider, expires_at, metadata')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (integration?.access_token) {
        // Verificar si el token ha expirado y refrescarlo si es necesario
        let accessToken = integration.access_token;
        const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

        // Refrescar si: no hay fecha de expiración, o el token está expirado
        const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();

        if (needsRefresh && integration.refresh_token) {
          const refreshResult = await refreshAccessToken(integration);
          if (refreshResult.success && refreshResult.accessToken) {
            accessToken = refreshResult.accessToken;
          }
        }

        // Obtener el ID del calendario secundario de Google (donde se crean los eventos)
        const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
        const secondaryCalendarId = metadata?.secondary_calendar_id || null;

        // Eliminar eventos del calendario externo
        for (const session of sessions) {
          const calendarSync = resolveSessionCalendarSync({
            externalEventId: session.external_event_id,
            calendarProvider: session.calendar_provider,
            metrics: session.metrics,
          });
          const externalEventId = calendarSync?.externalEventId || session.external_event_id;

          if (externalEventId) {
            try {
              if ((calendarSync?.provider || session.calendar_provider) === 'microsoft') {
                await deleteMicrosoftCalendarEvent(accessToken, externalEventId);
                deletedCalendarEventsCount++;
              } else {
                const deleted = await deleteCanonicalGoogleCalendarEvent(
                  accessToken,
                  externalEventId,
                  calendarSync?.calendarId || secondaryCalendarId,
                  session.id,
                );
                if (deleted) {
                  deletedCalendarEventsCount++;
                } else {
                  calendarDeletionErrors++;
                }
              }
            } catch (error) {
              console.error(`Error eliminando evento ${session.external_event_id} de ${session.calendar_provider}:`, error);
              if (error instanceof Error && error.message.includes('404')) {
                calendarEventsNotFound++;
              } else {
                calendarDeletionErrors++;
              }
              // Continuar eliminando otros eventos aunque uno falle
            }
          }
        }
      }
    }
    
    // Limpiar historiales y tracking que evitan el borrado del plan por falta de ON DELETE CASCADE
    await supabase.from('calendar_sync_history').delete().eq('plan_id', planId);
    await supabase.from('lesson_tracking').delete().eq('plan_id', planId);
    
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      await supabase.from('lesson_tracking').delete().in('session_id', sessionIds);
    }

    // Eliminar todas las sesiones asociadas al plan
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from('study_sessions')
      .delete({ count: 'exact' })
      .eq('plan_id', planId);
    
    if (sessionsError) {
      console.error('Error eliminando sesiones:', sessionsError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al eliminar las sesiones: ${sessionsError.message}` 
        },
        { status: 500 }
      );
    }
    
    // Eliminar el plan
    const { error: deleteError } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId);
    
    if (deleteError) {
      console.error('Error eliminando plan:', deleteError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al eliminar el plan: ${deleteError.message}` 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: calendarDeletionErrors === 0,
      message: calendarDeletionErrors === 0
        ? 'Plan de estudio eliminado exitosamente'
        : 'El plan se eliminó de la base de datos, pero hubo errores eliminando algunos eventos del calendario.',
      deletedPlanId: planId,
      deletedSessionsCount: sessionsCount || 0,
      deletedCalendarEventsCount: deletedCalendarEventsCount,
      calendarDeletionErrors,
      calendarEventsNotFound,
    });
    
  } catch (error) {
    console.error('Error eliminando plan de estudio:', error);
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
async function refreshAccessToken(integration: CalendarIntegrationData): Promise<{ success: boolean; accessToken?: string }> {
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
 * Elimina un evento de Google Calendar
 * @param accessToken - Token de acceso de Google
 * @param googleEventId - ID del evento a eliminar
 * @param calendarId - ID del calendario (si no se proporciona, usa 'primary')
 */
async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  calendarId?: string | null
): Promise<void> {
  // Limpiar el ID del evento (puede venir con formato de recurrencia)
  const cleanEventId = googleEventId.split('_')[0];
  // Usar el calendario secundario si se proporciona, si no usar 'primary'
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

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Error eliminando evento de Google Calendar';

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;

      // Detectar error de permisos insuficientes
      if (errorJson.error?.message?.includes('insufficient authentication scopes') ||
          errorJson.error?.message?.includes('Insufficient Permission') ||
          response.status === 403) {
        console.warn('[Delete Event] Permisos insuficientes para eliminar evento de Google Calendar.');
        return;
      }
    } catch {
      if (errorText.includes('insufficient authentication scopes') ||
          errorText.includes('Insufficient Permission')) {
        console.warn('[Delete Event] Permisos insuficientes para eliminar evento de Google Calendar.');
        return;
      }
    }

    // Si es 404 y estábamos usando un calendario secundario, intentar en primary como fallback
    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallbackResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // Si el fallback da 404 también, el evento realmente ya no existe
      if (fallbackResponse.ok || fallbackResponse.status === 404) {
        return;
      }
      // Otro error en el fallback: loguear pero no interrumpir
      console.error(`[Delete Event] Fallback en primary también falló: ${fallbackResponse.status}`);
      return;
    }

    // Si es 404 en primary, el evento ya no existe
    if (response.status === 404) {
      return;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Elimina un evento de Microsoft Calendar
 */
async function deleteMicrosoftCalendarEvent(accessToken: string, microsoftEventId: string): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendar/events/${encodeURIComponent(microsoftEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    // Si es un error 404, el evento ya no existe, así que está bien
    if (response.status === 404) {
      return;
    }
    
    const errorText = await response.text();
    throw new Error(`Error eliminando evento de Microsoft Calendar: ${errorText}`);
  }
}
