import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createAdminClient, getLatestCalendarIntegration, getSyncedStudySessions, getUserPlanIds } from './check-changes-db.service';
import { detectCalendarChanges } from './check-changes-diff.service';
import { resolveCalendarAccessToken } from './check-changes-token.service';
import type { CheckChangesResponse } from './check-changes.types';

function emptyChangesResponse(): NextResponse<CheckChangesResponse> {
  return NextResponse.json({
    success: true,
    data: {
      changes: [],
      deletedSessions: 0,
      modifiedSessions: 0,
    },
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CheckChangesResponse>> {
  void request;

  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();
    const { planIds, error: plansError } = await getUserPlanIds(supabase, user.id);

    if (plansError || planIds.length === 0) {
      return emptyChangesResponse();
    }

    const { sessions, error: sessionsError } = await getSyncedStudySessions(
      supabase,
      user.id,
      planIds,
    );

    if (sessionsError) {
      techDebtLogger.error('Error obteniendo sesiones:', sessionsError);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo sesiones' },
        { status: 500 },
      );
    }

    if (sessions.length === 0) {
      return emptyChangesResponse();
    }

    const integration = await getLatestCalendarIntegration(supabase, user.id);
    if (!integration) {
      return emptyChangesResponse();
    }

    const accessToken = await resolveCalendarAccessToken(integration);
    const changes = await detectCalendarChanges({
      accessToken,
      integration,
      sessions,
    });

    return NextResponse.json({
      success: true,
      data: {
        changes,
        deletedSessions: changes.filter((change) => change.type === 'deleted_event').length,
        modifiedSessions: changes.filter((change) => change.type === 'modified_event').length,
      },
    });
  } catch (error: unknown) {
    techDebtLogger.error('Error verificando cambios en calendario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
