import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { startActivitySchema, type StartActivityBody } from '../_schemas';

interface ActivityCompletionInsert {
  conversation_id: string | null
  user_id: string
  activity_id: string
  status: 'started'
  total_steps: number
  current_step: number
  completed_steps: number
  lia_had_to_redirect: number
  started_at: string
}

interface ActivityCompletionIdRow {
  completion_id: string
}

/**
 * POST /api/lia/start-activity
 * 
 * Inicia el tracking de una actividad interactiva con LIA
 */
async function handlePost(
  _request: NextRequest,
  body: StartActivityBody,
  _context: unknown,
) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    // Obtener datos del body
    const {
      conversationId,
      activityId,
      activityType,
      totalSteps = 1,
    } = body;

    const supabase = await createClient();

    // Crear registro de actividad directamente
    const insertData: ActivityCompletionInsert = {
      conversation_id: conversationId || null,
      user_id: user.id,
      activity_id: activityId || activityType,
      status: 'started',
      total_steps: totalSteps,
      current_step: 1,
      completed_steps: 0,
      lia_had_to_redirect: 0,
      started_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('lia_activity_completions')
      .insert(insertData)
      .select('completion_id')
      .single<ActivityCompletionIdRow>();

    if (error) {
      techDebtLogger.error('Error starting activity:', error);
      return apiError(
        'ACTIVITY_START_FAILED',
        'Error al iniciar actividad',
        500,
      );
    }

    return NextResponse.json({
      success: true,
      completionId: data?.completion_id,
      activityId: activityId || activityType,
      totalSteps,
    });
  } catch (error) {
    techDebtLogger.error('Error starting activity:', error);
    return apiError(
      'ACTIVITY_START_FAILED',
      'Error al iniciar actividad',
      500,
    );
  }
}

export const POST = withZodBody(startActivitySchema, handlePost);
