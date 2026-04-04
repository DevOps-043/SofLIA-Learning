/**
 * API Endpoint: Lesson Tracking Complete
 * 
 * POST /api/study-planner/lesson-tracking/complete
 * 
 * Marca una lección como completada (por quiz, cambio de contexto, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';

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

type EndTrigger = 'quiz_submitted' | 'context_changed' | 'manual';

interface CompleteRequest {
  trackingId?: string;
  lessonId?: string;
  endTrigger: EndTrigger;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        success: false
      }, { status: 401 });
    }

    const body: CompleteRequest = await request.json();
    const { trackingId, lessonId, endTrigger } = body;

    if (!endTrigger) {
      return NextResponse.json({ 
        error: 'endTrigger es requerido',
        success: false
      }, { status: 400 });
    }

    if (!trackingId && !lessonId) {
      return NextResponse.json({ 
        error: 'trackingId o lessonId es requerido',
        success: false
      }, { status: 400 });
    }

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
      console.error('Error completando lesson tracking:', updateError);
      return NextResponse.json({ 
        error: `Error al completar: ${updateError.message}`,
        success: false
      }, { status: 500 });
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
    console.error('Error en POST /api/study-planner/lesson-tracking/complete:', error);
    return NextResponse.json({ 
      error: getErrorMessage(error, 'Error interno del servidor'),
      success: false
    }, { status: 500 });
  }
}
