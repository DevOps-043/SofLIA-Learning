import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { logger } from '../../../../../../lib/utils/logger';
import {
  checkCalendarChangesForUser,
  type CheckCalendarResponse,
} from './calendar-change-check.service';

export async function POST(
  _request: NextRequest,
): Promise<NextResponse<CheckCalendarResponse>> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    return NextResponse.json(await checkCalendarChangesForUser(user.id));
  } catch (error) {
    logger.error('Error verificando cambios de calendario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
