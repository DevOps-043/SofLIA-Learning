import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Manage Calendar Events
 *
 * GET /api/study-planner/events - Obtener eventos personalizados
 * POST /api/study-planner/events - Crear evento personalizado
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SessionService } from '../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../features/study-planner/services/calendar-integration.service';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import {
  calendarEventMutationSchema,
  type CalendarEventMutationBody,
} from '../_schemas';
import {
  createAdminClient,
  syncDeletedEvents,
  cleanupOrphanedPlanEvents,
  createGoogleCalendarEvent,
  type CalendarIntegrationMetadata,
} from './calendar-event-sync.service';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error interno del servidor';
}

/**
 * GET /api/study-planner/events
 * Obtiene eventos personalizados del usuario y sincroniza con calendarios externos
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
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

    const { data: events, error } = await supabase
      .from('user_calendar_events')
      .select(SELECT_COLUMNS.user_calendar_events)
      .eq('user_id', user.id)
      .gte('start_time', startDateParam)
      .lte('end_time', endDateParam)
      .order('start_time', { ascending: true });

    if (error) {
      techDebtLogger.error('Error obteniendo eventos:', error);

      if (error.code === 'PGRST205' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('schema cache')) {
        techDebtLogger.warn('⚠️ Tabla user_calendar_events no disponible en PostgREST. Retornando array vacío.');
        return NextResponse.json({
          events: [],
          warning: 'La tabla user_calendar_events aún no está disponible en PostgREST. Si acabas de ejecutar la migración, espera 1-2 minutos y recarga la página.'
        });
      }

      return NextResponse.json(
        { error: 'Error al obtener eventos', details: error.message },
        { status: 500 }
      );
    }

    if (events && events.length > 0) {
      await syncDeletedEvents(supabase, user.id, events, startDateParam, endDateParam);
      await cleanupOrphanedPlanEvents(supabase, user.id);

      const { data: updatedEvents } = await supabase
        .from('user_calendar_events')
        .select(SELECT_COLUMNS.user_calendar_events)
        .eq('user_id', user.id)
        .gte('start_time', startDateParam)
        .lte('end_time', endDateParam)
        .order('start_time', { ascending: true });

      return NextResponse.json({ events: updatedEvents || [] });
    }

    await cleanupOrphanedPlanEvents(supabase, user.id);

    return NextResponse.json({ events: events || [] });
  } catch (error: unknown) {
    techDebtLogger.error('Error en GET /api/study-planner/events:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-planner/events
 * Crea un evento personalizado
 */
async function handlePost(
  _request: NextRequest,
  body: CalendarEventMutationBody,
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
    }

    const { title, description, start, end, location, isAllDay, color } = body;

    const supabase = createAdminClient();

    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('access_token, provider, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    let googleEventId: string | null = null;
    let provider: 'local' | 'google' = 'local';

    if (integration?.access_token) {
      try {
        const metadata = integration.metadata as CalendarIntegrationMetadata | null;
        let secondaryCalendarId = metadata?.secondary_calendar_id || null;

        if (!secondaryCalendarId) {
          secondaryCalendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(integration.access_token);
          if (secondaryCalendarId) {
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
        techDebtLogger.error('Error creando evento en Google Calendar:', error);
      }
    }

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
      techDebtLogger.error('Error creando evento:', error);

      if (error.code === 'PGRST205' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('schema cache')) {
        return NextResponse.json(
          {
            error: 'La tabla user_calendar_events no está disponible en PostgREST.',
            hint: 'Si acabas de ejecutar la migración, espera 1-2 minutos y vuelve a intentar.'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear el evento', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    techDebtLogger.error('Error en POST /api/study-planner/events:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export const POST = withZodBody(calendarEventMutationSchema, handlePost);
