import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import {
  validateSessionTimesForUser,
  type ValidateSessionTimesRequest,
  type ValidateSessionTimesResponse,
} from './validate-session-times.service';

export async function POST(request: NextRequest): Promise<NextResponse<ValidateSessionTimesResponse>> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const body: ValidateSessionTimesRequest = await request.json();
    const userContext = await UserContextService.getFullUserContext(user.id);
    const data = await validateSessionTimesForUser(user.id, userContext, body);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error validando tiempos de sesiÃ³n:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
