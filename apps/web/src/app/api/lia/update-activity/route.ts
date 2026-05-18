import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';

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
export async function POST(request: NextRequest) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const { completionId, currentStep, completedSteps, status, generatedOutput } = await request.json();

    if (!completionId) {
      return NextResponse.json(
        { error: 'completionId es requerido' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Error al actualizar progreso de actividad' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completionId,
      updated: true
    });
  } catch (error) {
    techDebtLogger.error('Error updating activity progress:', error);
    return NextResponse.json(
      { error: 'Error al actualizar progreso de actividad' },
      { status: 500 }
    );
  }
}
