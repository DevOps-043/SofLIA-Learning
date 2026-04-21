import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

type CalendarProvider = 'google' | 'microsoft';

/**
 * GET /api/study-planner/calendar/selection
 * Retorna los IDs de calendarios seleccionados actualmente
 */
function parseProvider(value: string | null): CalendarProvider | undefined {
  return value === 'google' || value === 'microsoft' ? value : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const provider = parseProvider(request.nextUrl.searchParams.get('provider'));
    const selectedIds = await CalendarIntegrationService.getSelectedCalendarIds(user.id, provider);

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
    const { selectedCalendarIds, provider } = body as {
      selectedCalendarIds?: unknown;
      provider?: CalendarProvider;
    };

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

    if (provider && !['google', 'microsoft'].includes(provider)) {
      return NextResponse.json({
        error: 'Proveedor de calendario invalido'
      }, { status: 400 });
    }

    await CalendarIntegrationService.saveSelectedCalendarIds(user.id, selectedCalendarIds, provider);

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
