import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Lesson Tracking Start
 * 
 * POST /api/study-planner/lesson-tracking/start
 * 
 * Registra el inicio de una lección (trigger: video_play)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import {
  lessonTrackingStartSchema,
  type LessonTrackingStartBody,
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

function isUniqueTrackingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const record = error as { code?: unknown; message?: unknown };
  const text = [record.code, record.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return text.includes('23505') || text.includes('lesson_tracking_unique');
}

async function handlePost(
  _request: NextRequest,
  body: LessonTrackingStartBody,
): Promise<NextResponse | Response> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
    }

    const { lessonId, sessionId, planId, trigger = 'video_play', lessonTimeEstimates } = body;

    const supabase = createAdminClient();
    const now = new Date();

    // Verificar si ya existe un tracking activo para esta lección y sesión
    const { data: existingTracking } = await supabase
      .from('lesson_tracking')
      .select('id, status, video_checkpoint_seconds, video_playback_rate')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('session_id', sessionId || null)
      .maybeSingle();

    if (existingTracking) {
      if (existingTracking.status !== 'in_progress') {
        return NextResponse.json({
          success: true,
          message: 'Tracking ya estaba cerrado; inicio ignorado de forma idempotente',
          trackingId: existingTracking.id,
          isNew: false,
          alreadyCompleted: existingTracking.status === 'completed'
        });
      }

      // Ya hay un tracking activo, solo actualizar last_activity_at
      await supabase
        .from('lesson_tracking')
        .update({
          last_activity_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existingTracking.id);

      return NextResponse.json({
        success: true,
        message: 'Tracking ya activo, actividad actualizada',
        trackingId: existingTracking.id,
        isNew: false,
        initialCheckpoint: existingTracking.video_checkpoint_seconds || 0,
        initialPlaybackRate: existingTracking.video_playback_rate || 1
      });
    }

    // Calcular T_restante para programar primer análisis
    let t_restante_minutes = 0;
    if (lessonTimeEstimates) {
      t_restante_minutes = Math.max(
        0,
        lessonTimeEstimates.t_lesson_minutes -
        lessonTimeEstimates.t_video_minutes -
        lessonTimeEstimates.t_materials_minutes
      );
    }

    // Crear nuevo tracking
    const { data: newTracking, error } = await supabase
      .from('lesson_tracking')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        session_id: sessionId || null,
        plan_id: planId || null,
        status: 'in_progress',
        started_at: now.toISOString(),
        start_trigger: trigger,
        video_started_at: trigger === 'video_play' ? now.toISOString() : null,
        last_activity_at: now.toISOString(),
        t_lesson_minutes: lessonTimeEstimates?.t_lesson_minutes || null,
        t_video_minutes: lessonTimeEstimates?.t_video_minutes || null,
        t_materials_minutes: lessonTimeEstimates?.t_materials_minutes || null,
        t_restante_minutes: t_restante_minutes || null,
      })
      .select('id')
      .single();

    if (error) {
      if (isUniqueTrackingError(error)) {
        const { data: concurrentTracking } = await supabase
          .from('lesson_tracking')
          .select('id, status, video_checkpoint_seconds, video_playback_rate')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .eq('session_id', sessionId || null)
          .maybeSingle();

        if (concurrentTracking) {
          return NextResponse.json({
            success: true,
            message: 'Tracking existente reutilizado tras condicion de carrera',
            trackingId: concurrentTracking.id,
            isNew: false,
            alreadyCompleted: concurrentTracking.status === 'completed',
            initialCheckpoint: concurrentTracking.video_checkpoint_seconds || 0,
            initialPlaybackRate: concurrentTracking.video_playback_rate || 1
          });
        }
      }

      techDebtLogger.error('Error creando lesson tracking:', error);
      return apiError(
        'CREATE_LESSON_TRACKING_FAILED',
        `Error al crear tracking: ${error.message}`,
        500,
      );
    }

    // Si hay sessionId, actualizar study_session con started_at
    if (sessionId) {
      await supabase
        .from('study_sessions')
        .update({
          started_at: now.toISOString(),
          status: 'in_progress',
          updated_at: now.toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .is('started_at', null); // Solo si no se había iniciado
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking de lección iniciado',
      trackingId: newTracking.id,
      isNew: true
    });

  } catch (error: unknown) {
    techDebtLogger.error('Error en POST /api/study-planner/lesson-tracking/start:', error);
    return apiError(
      'CREATE_LESSON_TRACKING_FAILED',
      getErrorMessage(error, 'Error interno del servidor'),
      500,
    );
  }
}

export const POST = withZodBody(lessonTrackingStartSchema, handlePost);
