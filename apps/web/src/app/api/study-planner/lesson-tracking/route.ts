/**
 * API Endpoint: Lesson Tracking Active & Reconcile
 * 
 * GET /api/study-planner/lesson-tracking
 *    Obtiene el tracking activo del usuario
 * 
 * POST /api/study-planner/lesson-tracking (reconcile)
 *    Ejecuta reconciliación de trackings vencidos (fallback del cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase/types';

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

/**
 * GET: Obtener tracking activo del usuario
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        tracking: null
      }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Obtener tracking activo más reciente
    const { data: tracking, error } = await supabase
      .from('lesson_tracking')
      .select(`
        id,
        lesson_id,
        session_id,
        status,
        started_at,
        start_trigger,
        video_ended_at,
        lia_first_message_at,
        lia_last_message_at,
        last_activity_at,
        t_lesson_minutes,
        t_video_minutes,
        t_restante_minutes
      `)
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error obteniendo tracking activo:', error);
    }

    return NextResponse.json({
      tracking: tracking || null,
      hasActiveTracking: !!tracking
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/study-planner/lesson-tracking:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: message,
      tracking: null
    }, { status: 500 });
  }
}

/**
 * POST: Reconciliación de trackings vencidos (fallback del cron)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        success: false
      }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const inactivityThresholdMs = 5 * 60 * 1000; // 5 minutos

    // Buscar trackings vencidos del usuario
    const { data: expiredTrackings, error } = await supabase
      .from('lesson_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .lte('next_analysis_at', now.toISOString());

    if (error) {
      console.error('Error buscando trackings vencidos:', error);
      return NextResponse.json({ 
        error: error.message,
        success: false
      }, { status: 500 });
    }

    if (!expiredTrackings || expiredTrackings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay trackings pendientes de reconciliar',
        processed: 0
      });
    }

    let completedCount = 0;

    for (const tracking of expiredTrackings) {
      let shouldComplete = false;
      let endTrigger = '';
      let completedAt = now;

      // Flujo B: Verificar inactividad LIA
      if (tracking.lia_first_message_at && tracking.lia_last_message_at) {
        const lastLiaMessage = new Date(tracking.lia_last_message_at);
        const timeSinceLastMessage = now.getTime() - lastLiaMessage.getTime();
        
        if (timeSinceLastMessage >= inactivityThresholdMs) {
          shouldComplete = true;
          endTrigger = 'lia_inactivity_5m';
          completedAt = new Date(lastLiaMessage.getTime() + inactivityThresholdMs);
        }
      }
      
      // Flujo C: Verificar inactividad general
      if (!shouldComplete && tracking.last_activity_at) {
        const lastActivity = new Date(tracking.last_activity_at);
        const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
        
        if (timeSinceLastActivity >= inactivityThresholdMs) {
          shouldComplete = true;
          endTrigger = 'activity_inactivity_5m';
          completedAt = new Date(lastActivity.getTime() + inactivityThresholdMs);
        }
      }

      if (shouldComplete) {
        await supabase
          .from('lesson_tracking')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString(),
            end_trigger: endTrigger,
            next_analysis_at: null,
            updated_at: now.toISOString()
          })
          .eq('id', tracking.id);

        completedCount++;

        // Verificar si cerrar sesión
        if (tracking.session_id) {
          const { data: pending } = await supabase
            .from('lesson_tracking')
            .select('id')
            .eq('session_id', tracking.session_id)
            .eq('status', 'in_progress');

          if (!pending || pending.length === 0) {
            await supabase
              .from('study_sessions')
              .update({
                status: 'completed',
                completed_at: now.toISOString(),
                completion_method: endTrigger.includes('lia') ? 'lia_inactivity' : 'activity_inactivity',
                updated_at: now.toISOString()
              })
              .eq('id', tracking.session_id)
              .eq('status', 'in_progress');
          }
        }
      } else {
        // Reprogramar siguiente análisis
        const nextAnalysis = new Date(now.getTime() + 5 * 60 * 1000);
        await supabase
          .from('lesson_tracking')
          .update({
            next_analysis_at: nextAnalysis.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', tracking.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reconciliación completada`,
      processed: expiredTrackings.length,
      completed: completedCount
    });

  } catch (error: unknown) {
    console.error('Error en POST /api/study-planner/lesson-tracking:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: message,
      success: false
    }, { status: 500 });
  }
}
