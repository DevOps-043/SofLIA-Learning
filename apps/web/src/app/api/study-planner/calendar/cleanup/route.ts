/**
 * API Endpoint: Calendar Cleanup
 *
 * POST /api/study-planner/calendar/cleanup
 *
 * Busca y elimina eventos "huérfanos" en el calendario externo.
 * Un evento huérfano es aquel que existe en Google/Microsoft Calendar
 * pero no tiene una sesión de estudio asociada en la base de datos.
 *
 * Esto puede ocurrir cuando:
 * - Se eliminó un plan/sesión de la BD pero el evento externo no se eliminó
 * - Hubo un error durante la sincronización
 * - El usuario modificó el calendario directamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import { CalendarIntegrationService } from '@/features/study-planner/services/calendar-integration.service';
import {
  deleteCleanupCalendarEvent,
  getCleanupCalendarEvents,
} from './cleanup-calendar-events.service';

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

interface CleanupResult {
  success: boolean;
  orphanedEventsFound: number;
  eventsDeleted: number;
  errors: string[];
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CleanupResult>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          orphanedEventsFound: 0,
          eventsDeleted: 0,
          errors: ['No autenticado'],
          message: 'No autenticado',
        },
        { status: 401 }
      );
    }


    const supabase = createAdminClient();

    // 1. Obtener integración de calendario
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('id, access_token, refresh_token, provider, expires_at, metadata')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({
        success: true,
        orphanedEventsFound: 0,
        eventsDeleted: 0,
        errors: [],
        message: 'No hay calendario conectado',
      });
    }

    // 2. Refrescar token si está expirado
    let accessToken = integration.access_token;
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;

    if (expiresAt && expiresAt <= new Date() && integration.refresh_token) {
      const refreshedToken = await CalendarIntegrationService.refreshTokenIfNeeded(user.id);
      if (refreshedToken) {
        accessToken = refreshedToken;
      } else {
        return NextResponse.json(
          {
            success: false,
            orphanedEventsFound: 0,
            eventsDeleted: 0,
            errors: ['Token expirado y no se pudo refrescar'],
            message: 'Token expirado. Por favor, reconecta tu calendario.',
          },
          { status: 401 }
        );
      }
    }

    // 3. Obtener el calendario secundario
    const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
    let calendarId = metadata?.secondary_calendar_id || null;

    if (!calendarId && integration.provider === 'google') {
      calendarId = await CalendarIntegrationService.getSecondaryCalendarId(user.id);
    }

    if (!calendarId) {
      return NextResponse.json({
        success: true,
        orphanedEventsFound: 0,
        eventsDeleted: 0,
        errors: [],
        message: 'No hay calendario secundario configurado',
      });
    }

    // 4. Obtener todos los external_event_id de las sesiones activas
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('external_event_id, calendar_provider')
      .eq('user_id', user.id)
      .not('external_event_id', 'is', null);

    const activeEventIds = new Set(
      (sessions || [])
        .filter((s) => s.external_event_id && s.calendar_provider === integration.provider)
        .map((s) => {
          // Limpiar el ID (puede tener sufijo de recurrencia)
          const eventId = s.external_event_id;
          return typeof eventId === 'string' ? eventId.split('_')[0] : String(eventId).split('_')[0];
        })
    );


    // 5. Obtener eventos del calendario externo
    const now = new Date();
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 días atrás
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 año adelante

    const calendarEvents = await getCleanupCalendarEvents({
      accessToken,
      calendarId,
      endDate,
      provider: integration.provider,
      startDate,
    });


    // 6. Encontrar eventos huérfanos (en calendario pero no en sesiones)
    const orphanedEvents = calendarEvents.filter((event) => {
      const cleanId = event.id.split('_')[0];
      return !activeEventIds.has(cleanId);
    });


    if (orphanedEvents.length === 0) {
      return NextResponse.json({
        success: true,
        orphanedEventsFound: 0,
        eventsDeleted: 0,
        errors: [],
        message: 'No se encontraron eventos huérfanos. ¡Todo está sincronizado!',
      });
    }

    // 7. Eliminar eventos huérfanos
    const errors: string[] = [];
    let eventsDeleted = 0;

    for (const event of orphanedEvents) {
      try {
        const deleteSuccess = await deleteCleanupCalendarEvent({
          accessToken,
          calendarId,
          eventId: event.id,
          provider: integration.provider,
        });

        if (deleteSuccess) {
          eventsDeleted++;
        } else {
          errors.push(`No se pudo eliminar: ${event.id}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Error en ${event.id}: ${errorMsg}`);
        console.error(`❌ [Cleanup] Error eliminando evento ${event.id}:`, error);
      }
    }


    return NextResponse.json({
      success: errors.length === 0,
      orphanedEventsFound: orphanedEvents.length,
      eventsDeleted,
      errors,
      message:
        errors.length === 0
          ? `¡Limpieza completada! Se eliminaron ${eventsDeleted} eventos huérfanos.`
          : `Se eliminaron ${eventsDeleted} de ${orphanedEvents.length} eventos. ${errors.length} errores.`,
    });
  } catch (error) {
    console.error('❌ [Cleanup] Error general:', error);
    return NextResponse.json(
      {
        success: false,
        orphanedEventsFound: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Error interno del servidor'],
        message: 'Error durante la limpieza',
      },
      { status: 500 }
    );
  }
}
