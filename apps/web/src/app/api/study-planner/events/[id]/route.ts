/**
 * API Endpoint: Manage Individual Calendar Events
 * 
 * PUT /api/study-planner/events/[id] - Editar evento
 * DELETE /api/study-planner/events/[id] - Eliminar evento
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';

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
 * PUT /api/study-planner/events/[id]
 * Edita un evento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, start, end, location, isAllDay, color } = body;

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: title, start, end' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar si el evento existe en la base de datos local (por ID o por google_event_id)
    const { data: existingEvent, error: fetchError } = await supabase
      .from('user_calendar_events')
      .select('id, user_id, provider, google_event_id')
      .eq('user_id', user.id)
      .or(`id.eq.${id},google_event_id.eq.${id}`)
      .single();

    // Si no existe en la BD local, puede ser un evento de Google Calendar
    // En ese caso, crear una entrada local y sincronizar con Google
    if (fetchError || !existingEvent) {
      // Verificar si es un evento de Google Calendar (el ID puede ser el google_event_id)
      // Intentar actualizarlo directamente en Google Calendar
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, provider, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration?.access_token) {
        try {
          // Obtener el ID del calendario secundario donde se crean los eventos
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          // Actualizar en Google Calendar usando el calendario secundario
          await updateGoogleCalendarEvent(
            integration.access_token,
            id, // Usar el ID como google_event_id
            { title, description, start, end, location, isAllDay },
            secondaryCalendarId
          );

          // Crear o actualizar entrada local para sincronización futura
          const { data: existingByGoogleId } = await supabase
            .from('user_calendar_events')
            .select('id')
            .eq('user_id', user.id)
            .eq('google_event_id', id)
            .single();

          if (existingByGoogleId) {
            // Actualizar entrada existente
            const { data: updatedEvent } = await supabase
              .from('user_calendar_events')
              .update({
                title,
                description: description || null,
                start_time: start,
                end_time: end,
                location: location || null,
                is_all_day: isAllDay || false,
                color: color || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingByGoogleId.id)
              .select()
              .single();

            return NextResponse.json({
              success: true,
              event: updatedEvent,
            });
          } else {
            // Crear nueva entrada
            const { data: newEvent } = await supabase
              .from('user_calendar_events')
              .insert({
                user_id: user.id,
                title,
                description: description || null,
                start_time: start,
                end_time: end,
                location: location || null,
                is_all_day: isAllDay || false,
                provider: 'google',
                source: 'calendar_sync',
                google_event_id: id,
                color: color || null,
              })
              .select()
              .single();

            return NextResponse.json({
              success: true,
              event: newEvent,
            });
          }
        } catch (error) {
          console.error('Error actualizando evento de Google Calendar:', error);
          return NextResponse.json(
            { error: 'Error al actualizar el evento en Google Calendar' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Si es un evento de Google Calendar, intentar actualizarlo también
    if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
      // Obtener integración de Google
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration?.access_token) {
        try {
          // Obtener el ID del calendario secundario donde se crean los eventos
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          // Actualizar en Google Calendar usando el calendario secundario
          await updateGoogleCalendarEvent(
            integration.access_token,
            existingEvent.google_event_id,
            { title, description, start, end, location, isAllDay },
            secondaryCalendarId
          );
        } catch (error) {
          console.error('Error actualizando en Google Calendar:', error);
          // Continuar con la actualización local aunque falle en Google
        }
      }
    }

    // Actualizar en la base de datos
    const { data: updatedEvent, error: updateError } = await supabase
      .from('user_calendar_events')
      .update({
        title,
        description: description || null,
        start_time: start,
        end_time: end,
        location: location || null,
        is_all_day: isAllDay || false,
        color: color || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando evento:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/study-planner/events/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/study-planner/events/[id]
 * Elimina un evento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Verificar si el evento existe en la base de datos local (por ID o por google_event_id)
    const { data: existingEvent, error: fetchError } = await supabase
      .from('user_calendar_events')
      .select('id, user_id, provider, google_event_id')
      .eq('user_id', user.id)
      .or(`id.eq.${id},google_event_id.eq.${id}`)
      .single();

    // Si no existe en la BD local, puede ser un evento de Google Calendar
    if (fetchError || !existingEvent) {
      // Intentar eliminarlo directamente de Google Calendar
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, expires_at, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration) {
        try {
          // Verificar si el token está expirado y refrescarlo si es necesario
          let accessToken = integration.access_token;
          const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

          if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {

            const refreshResult = await refreshAccessToken(integration);
            if (refreshResult.success && refreshResult.accessToken) {
              accessToken = refreshResult.accessToken;
              // Actualizar la integración con el nuevo token
              const { data: updatedIntegration } = await supabase
                .from('calendar_integrations')
                .select('access_token')
                .eq('id', integration.id)
                .single();
              if (updatedIntegration?.access_token) {
                accessToken = updatedIntegration.access_token;
              }
            }
          }

          // Obtener el ID del calendario secundario donde se crean los eventos
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          // Eliminar de Google Calendar
          // Estrategia: Intentar primero en el calendario secundario (donde deberían estar los eventos de la plataforma)
          // Si falla (ej. 404), intentar en el calendario principal (por si el usuario lo movió o se creó ahí)
          try {
            await deleteGoogleCalendarEvent(accessToken, id, secondaryCalendarId);
          } catch (error: any) {
            console.warn(`[Delete Event] Falló eliminación en calendario secundario (${secondaryCalendarId}): ${error.message}`);

            // Si el error indica que no se encontró, intentar en el primario
            // Google devuelve 404 Not Found o 410 Gone
            if (error.message?.includes('404') || error.message?.includes('410') || error.message?.includes('Not Found') || error.message?.includes('Deleted')) {
              try {
                await deleteGoogleCalendarEvent(accessToken, id, 'primary');
              } catch (primaryError: any) {
                console.error('[Delete Event] Falló también en calendario principal:', primaryError);
                throw primaryError; // Re-lanzar el error original o el nuevo
              }
            } else {
              throw error; // Re-lanzar si es otro tipo de error (ej. permisos)
            }
          }

          return NextResponse.json({
            success: true,
            message: 'Evento eliminado exitosamente',
          });
        } catch (error: any) {
          console.error('Error eliminando evento de Google Calendar:', error);
          const errorMessage = error?.message || 'Error al eliminar el evento de Google Calendar';
          return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Si es un evento de Google Calendar, intentar eliminarlo también
    if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, expires_at, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration) {
        try {
          // Verificar si el token está expirado y refrescarlo si es necesario
          let accessToken = integration.access_token;
          const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

          if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {

            const refreshResult = await refreshAccessToken(integration);
            if (refreshResult.success && refreshResult.accessToken) {
              accessToken = refreshResult.accessToken;
              // Actualizar la integración con el nuevo token
              const { data: updatedIntegration } = await supabase
                .from('calendar_integrations')
                .select('access_token')
                .eq('id', integration.id)
                .single();
              if (updatedIntegration?.access_token) {
                accessToken = updatedIntegration.access_token;
              }
            }
          }

          // Obtener el ID del calendario secundario donde se crean los eventos
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          // Eliminar de Google Calendar usando el calendario secundario
          await deleteGoogleCalendarEvent(
            accessToken,
            existingEvent.google_event_id,
            secondaryCalendarId
          );
        } catch (error: any) {
          console.error('Error eliminando de Google Calendar:', error);
          // Continuar con la eliminación local aunque falle en Google
        }
      }
    }

    // Eliminar de la base de datos (usar el ID local, no el google_event_id)
    const { error: deleteError } = await supabase
      .from('user_calendar_events')
      .delete()
      .eq('id', existingEvent.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error eliminando evento:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/study-planner/events/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Actualiza un evento en Google Calendar
 * @param accessToken - Token de acceso de Google
 * @param eventId - ID del evento a actualizar
 * @param eventData - Datos del evento a actualizar
 * @param calendarId - ID del calendario (si no se proporciona, usa 'primary')
 */
async function updateGoogleCalendarEvent(
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
  // Usar el calendario secundario si se proporciona, si no usar 'primary'
  const targetCalendarId = calendarId || 'primary';

  const response = await fetch(
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

      // Detectar error de permisos insuficientes
      if (errorJson.error?.message?.includes('insufficient authentication scopes') ||
        errorJson.error?.message?.includes('Insufficient Permission') ||
        response.status === 403) {
        errorMessage = 'Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
      }
    } catch {
      // Si no se puede parsear, verificar el texto del error
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
        const errorText = await response.text();
        console.error('Error refrescando token de Google:', errorText);
        return { success: false };
      }

      const tokens = await response.json();

      // Actualizar en base de datos
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
) {
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
        errorMessage = 'Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
        throw new Error(errorMessage);
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes('insufficient authentication scopes')) {
        throw parseError;
      }
      // Si no se puede parsear, verificar el texto del error
      if (errorText.includes('insufficient authentication scopes') ||
        errorText.includes('Insufficient Permission')) {
        throw new Error('Request had insufficient authentication scopes. Por favor, reconecta tu calendario de Google con permisos de escritura.');
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
      if (fallbackResponse.ok || fallbackResponse.status === 404) {
        return;
      }
      console.error(`[Delete Event] Fallback en primary tambien fallo: ${fallbackResponse.status}`);
      return;
    }

    // Si es 404 en primary, el evento ya no existe
    if (response.status === 404) {
      return;
    }

    console.error(`Error eliminando evento de Google Calendar (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

