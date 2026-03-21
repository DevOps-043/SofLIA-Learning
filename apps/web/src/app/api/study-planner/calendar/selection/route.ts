import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import type { CalendarIntegrationMetadata } from '../../../../../features/study-planner/types/user-context.types';

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
 * GET /api/study-planner/calendar/selection
 * Retorna los IDs de calendarios seleccionados actualmente
 */
export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const selectedIds = await CalendarIntegrationService.getSelectedCalendarIds(user.id);

    return NextResponse.json({
      success: true,
      data: {
        selectedCalendarIds: selectedIds || [],
      }
    });

  } catch (error) {
    console.error('[Calendar Selection] Error GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/study-planner/calendar/selection
 * Guarda los IDs de calendarios seleccionados
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { selectedCalendarIds } = body;

    // Validación: debe ser un array con al menos un elemento
    if (!Array.isArray(selectedCalendarIds) || selectedCalendarIds.length === 0) {
      return NextResponse.json({
        error: 'Debes seleccionar al menos un calendario'
      }, { status: 400 });
    }

    // Validación: todos los elementos deben ser strings
    if (!selectedCalendarIds.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json({
        error: 'Los IDs de calendario deben ser strings'
      }, { status: 400 });
    }

    await CalendarIntegrationService.saveSelectedCalendarIds(user.id, selectedCalendarIds);

    return NextResponse.json({
      success: true,
      data: {
        selectedCalendarIds,
      }
    });

  } catch (error) {
    console.error('[Calendar Selection] Error POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
