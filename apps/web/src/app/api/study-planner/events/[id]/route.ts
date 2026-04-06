/**
 * API Endpoint: Manage Individual Calendar Events
 *
 * PUT /api/study-planner/events/[id] - Editar evento
 * DELETE /api/study-planner/events/[id] - Eliminar evento
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import {
  createAdminClient,
  refreshAccessToken,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './event-update.service';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
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

    const { data: existingEvent, error: fetchError } = await supabase
      .from('user_calendar_events')
      .select('id, user_id, provider, google_event_id')
      .eq('user_id', user.id)
      .or(`id.eq.${id},google_event_id.eq.${id}`)
      .single();

    if (fetchError || !existingEvent) {
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, provider, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration?.access_token) {
        try {
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          await updateGoogleCalendarEvent(
            integration.access_token,
            id,
            { title, description, start, end, location, isAllDay },
            secondaryCalendarId
          );

          const { data: existingByGoogleId } = await supabase
            .from('user_calendar_events')
            .select('id')
            .eq('user_id', user.id)
            .eq('google_event_id', id)
            .single();

          if (existingByGoogleId) {
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

            return NextResponse.json({ success: true, event: updatedEvent });
          } else {
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

            return NextResponse.json({ success: true, event: newEvent });
          }
        } catch (error) {
          console.error('Error actualizando evento de Google Calendar:', error);
          return NextResponse.json(
            { error: 'Error al actualizar el evento en Google Calendar' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration?.access_token) {
        try {
          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          await updateGoogleCalendarEvent(
            integration.access_token,
            existingEvent.google_event_id,
            { title, description, start, end, location, isAllDay },
            secondaryCalendarId
          );
        } catch (error) {
          console.error('Error actualizando en Google Calendar:', error);
        }
      }
    }

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

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: unknown) {
    console.error('Error en PUT /api/study-planner/events/[id]:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
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

    const { data: existingEvent, error: fetchError } = await supabase
      .from('user_calendar_events')
      .select('id, user_id, provider, google_event_id')
      .eq('user_id', user.id)
      .or(`id.eq.${id},google_event_id.eq.${id}`)
      .single();

    if (fetchError || !existingEvent) {
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, expires_at, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration) {
        try {
          let accessToken = integration.access_token;
          const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

          if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
            const refreshResult = await refreshAccessToken(integration);
            if (refreshResult.success && refreshResult.accessToken) {
              accessToken = refreshResult.accessToken;
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

          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          try {
            await deleteGoogleCalendarEvent(accessToken, id, secondaryCalendarId);
          } catch (error: unknown) {
            const secondaryCalendarError = getErrorMessage(error);
            console.warn(`[Delete Event] Falló eliminación en calendario secundario (${secondaryCalendarId}): ${secondaryCalendarError}`);

            if (secondaryCalendarError.includes('404') || secondaryCalendarError.includes('410') || secondaryCalendarError.includes('Not Found') || secondaryCalendarError.includes('Deleted')) {
              try {
                await deleteGoogleCalendarEvent(accessToken, id, 'primary');
              } catch (primaryError: unknown) {
                console.error('[Delete Event] Falló también en calendario principal:', primaryError);
                throw primaryError;
              }
            } else {
              throw error;
            }
          }

          return NextResponse.json({ success: true, message: 'Evento eliminado exitosamente' });
        } catch (error: unknown) {
          console.error('Error eliminando evento de Google Calendar:', error);
          const errorMessage = getErrorMessage(error);
          return NextResponse.json({ error: errorMessage }, { status: 500 });
        }
      }

      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('access_token, refresh_token, provider, expires_at, metadata')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integration) {
        try {
          let accessToken = integration.access_token;
          const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;

          if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
            const refreshResult = await refreshAccessToken(integration);
            if (refreshResult.success && refreshResult.accessToken) {
              accessToken = refreshResult.accessToken;
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

          const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
          const secondaryCalendarId = metadata?.secondary_calendar_id || null;

          await deleteGoogleCalendarEvent(
            accessToken,
            existingEvent.google_event_id,
            secondaryCalendarId
          );
        } catch (error: unknown) {
          console.error('Error eliminando de Google Calendar:', error);
        }
      }
    }

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

    return NextResponse.json({ success: true, message: 'Evento eliminado exitosamente' });
  } catch (error: unknown) {
    console.error('Error en DELETE /api/study-planner/events/[id]:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
