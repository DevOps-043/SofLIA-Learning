import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Lesson Tracking Complete
 * 
 * POST /api/study-planner/lesson-tracking/complete
 * 
 * Marca una lección como completada (por quiz, cambio de contexto, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import {
  lessonTrackingCompleteSchema,
  type LessonTrackingCompleteBody,
} from '../../_schemas';

// Crear cliente admin
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function handlePost(
  _request: NextRequest,
  body: LessonTrackingCompleteBody,
): Promise<NextResponse | Response> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
    }

    const { trackingId, lessonId, endTrigger } = body;

    const supabase = createAdminClient();
    const now = new Date();

    // Buscar el tracking activo
    let query = supabase
      .from('lesson_tracking')
      .select('id, session_id, status')
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    if (trackingId) {
      query = query.eq('id', trackingId);
    } else if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data: tracking, error: trackingError } = await query.single();

    if (trackingError || !tracking) {
      // No hay tracking activo, puede ser normal si ya se completó
      return NextResponse.json({
        success: true,
        message: 'No hay tracking activo para completar',
        alreadyCompleted: true
      });
    }

    // Completar el tracking
    const { error: updateError } = await supabase
      .from('lesson_tracking')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        end_trigger: endTrigger,
        next_analysis_at: null, // Limpiar programación de análisis
        updated_at: now.toISOString()
      })
      .eq('id', tracking.id);

    if (updateError) {
      techDebtLogger.error('Error completando lesson tracking:', updateError);
      return apiError(
        'COMPLETE_LESSON_TRACKING_FAILED',
        `Error al completar: ${updateError.message}`,
        500,
      );
    }

    // Si hay session_id, verificar si cerrar la sesión
    let sessionClosed = false;
    if (tracking.session_id) {
      // Verificar si hay más trackings pendientes
      const { data: pendingTrackings } = await supabase
        .from('lesson_tracking')
        .select('id')
        .eq('session_id', tracking.session_id)
        .eq('status', 'in_progress');

      // Si no hay más trackings pendientes, cerrar la sesión
      if (!pendingTrackings || pendingTrackings.length === 0) {
        const completionMethod = endTrigger === 'quiz_submitted' ? 'quiz' : 
                                 endTrigger === 'context_changed' ? 'context_changed' : 'manual';
        
        await supabase
          .from('study_sessions')
          .update({
            status: 'completed',
            completed_at: now.toISOString(),
            completion_method: completionMethod,
            updated_at: now.toISOString()
          })
          .eq('id', tracking.session_id)
          .eq('status', 'in_progress');

        sessionClosed = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lección completada',
      trackingId: tracking.id,
      endTrigger,
      sessionClosed
    });

  } catch (error: unknown) {
    techDebtLogger.error('Error en POST /api/study-planner/lesson-tracking/complete:', error);
    return apiError(
      'COMPLETE_LESSON_TRACKING_FAILED',
      getErrorMessage(error, 'Error interno del servidor'),
      500,
    );
  }
}

export const POST = withZodBody(lessonTrackingCompleteSchema, handlePost);
