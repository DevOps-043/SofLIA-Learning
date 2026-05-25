import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { updateActivitySchema, type UpdateActivityBody } from '../_schemas';

interface LiaActivityUpdatePayload {
  updated_at: string
  current_step?: number
  completed_steps?: number
  status?: string
  completed_at?: string
  generated_output?: unknown
}

/**
 * POST /api/lia/update-activity
 * 
 * Actualiza el progreso de una actividad interactiva
 */
async function handlePost(
  _request: NextRequest,
  body: UpdateActivityBody,
  _context: unknown,
) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    // Obtener datos del body
    const { completionId, currentStep, completedSteps, status, generatedOutput } = body;

    const supabase = await createClient();

    const updateData: LiaActivityUpdatePayload = {
      updated_at: new Date().toISOString()
    };

    if (currentStep !== undefined) {
      updateData.current_step = currentStep;
    }
    if (completedSteps !== undefined) {
      updateData.completed_steps = completedSteps;
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (generatedOutput !== undefined) {
      updateData.generated_output = generatedOutput;
    }

    const { error } = await supabase
      .from('lia_activity_completions')
      .update(updateData)
      .eq('completion_id', completionId)
      .eq('user_id', user.id);

    if (error) {
      techDebtLogger.error('Error updating activity progress:', error);
      return apiError(
        'ACTIVITY_UPDATE_FAILED',
        'Error al actualizar progreso de actividad',
        500,
      );
    }

    return NextResponse.json({
      success: true,
      completionId,
      updated: true
    });
  } catch (error) {
    techDebtLogger.error('Error updating activity progress:', error);
    return apiError(
      'ACTIVITY_UPDATE_FAILED',
      'Error al actualizar progreso de actividad',
      500,
    );
  }
}

export const POST = withZodBody(updateActivitySchema, handlePost);
