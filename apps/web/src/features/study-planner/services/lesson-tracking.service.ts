import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Lesson Tracking Service
 * 
 * Servicio para lógica de tracking de lecciones.
 * Usado por el frontend y los endpoints de API.
 */

import { createClient } from '@/lib/supabase/server';

// Tipos
export interface LessonTimeEstimates {
  lessonId: string;
  t_lesson_minutes: number;
  t_video_minutes: number;
  t_materials_minutes: number;
  t_restante_minutes: number;
}

export interface TrackingStatus {
  hasActiveTracking: boolean;
  trackingId: string | null;
  lessonId: string | null;
  status: string | null;
  startedAt: string | null;
}

/**
 * Obtiene los tiempos estimados para una lección
 */
export async function getLessonTimeEstimates(
  lessonId: string
): Promise<LessonTimeEstimates | null> {
  try {
    const supabase = await createClient();

    // Intentar obtener de lesson_time_estimates
    const { data: estimates } = await supabase
      .from('lesson_time_estimates')
      .select(`
        video_duration_seconds,
        video_minutes,
        activities_time_minutes,
        reading_time_minutes,
        quiz_time_minutes,
        total_time_minutes
      `)
      .eq('lesson_id', lessonId)
      .single();

    if (estimates) {
      const t_video = estimates.video_minutes || 0;
      const t_materials = (
        (estimates.reading_time_minutes || 0) +
        (estimates.quiz_time_minutes || 0) +
        (estimates.activities_time_minutes || 0)
      );
      const t_lesson = estimates.total_time_minutes || 0;
      const t_restante = Math.max(0, t_lesson - t_video - t_materials);

      return {
        lessonId,
        t_lesson_minutes: Number(t_lesson),
        t_video_minutes: Number(t_video),
        t_materials_minutes: Number(t_materials),
        t_restante_minutes: Number(t_restante)
      };
    }

    // Fallback: calcular desde la lección y materiales
    const { data: lesson } = await supabase
      .from('course_lessons')
      .select('duration_seconds, total_duration_minutes')
      .eq('lesson_id', lessonId)
      .single();

    if (lesson) {
      const t_video = lesson.duration_seconds ? lesson.duration_seconds / 60 : 0;
      const t_lesson = lesson.total_duration_minutes || t_video + 10; // +10 min buffer
      const t_materials = Math.max(0, t_lesson - t_video);
      const t_restante = 5; // Mínimo 5 minutos

      return {
        lessonId,
        t_lesson_minutes: Number(t_lesson),
        t_video_minutes: Number(t_video),
        t_materials_minutes: Number(t_materials),
        t_restante_minutes: t_restante
      };
    }

    return null;
  } catch (error) {
    techDebtLogger.error('Error obteniendo tiempos de lección:', error);
    return null;
  }
}

/**
 * Verifica si una lección tiene quiz
 */
export async function lessonHasQuiz(lessonId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Verificar en lesson_materials
    const { data: materials } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('lesson_id', lessonId)
      .eq('material_type', 'quiz')
      .limit(1);

    if (materials && materials.length > 0) return true;

    // Verificar en lesson_activities
    const { data: activities } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'quiz')
      .limit(1);

    return activities && activities.length > 0;
  } catch (error) {
    techDebtLogger.error('Error verificando quiz:', error);
    return false;
  }
}

/**
 * Verifica si una lección tiene actividades de LIA
 */
export async function lessonHasLiaActivity(lessonId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: activities } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'ai_chat')
      .limit(1);

    return activities && activities.length > 0;
  } catch (error) {
    techDebtLogger.error('Error verificando actividad LIA:', error);
    return false;
  }
}

/**
 * Determina el flujo de completado para una lección
 * - Flujo A: Tiene quiz
 * - Flujo B: Tiene actividad LIA (sin quiz)
 * - Flujo C: Sin quiz ni LIA
 */
export async function determineLessonFlow(
  lessonId: string
): Promise<'A' | 'B' | 'C'> {
  const hasQuiz = await lessonHasQuiz(lessonId);
  if (hasQuiz) return 'A';

  const hasLia = await lessonHasLiaActivity(lessonId);
  if (hasLia) return 'B';

  return 'C';
}

/**
 * Calcula el tiempo para el primer análisis de inactividad
 */
export function calculateFirstAnalysisDelay(
  t_restante_minutes: number
): number {
  // Mínimo 5 minutos
  return Math.max(5, t_restante_minutes);
}

export const LessonTrackingService = {
  getLessonTimeEstimates,
  lessonHasQuiz,
  lessonHasLiaActivity,
  determineLessonFlow,
  calculateFirstAnalysisDelay,
  updateVideoProgress
};

/**
 * Actualiza el progreso de video de una lección
 */
export async function updateVideoProgress(
  lessonId: string,
  checkpoint: number,
  maxReached: number,
  totalDuration: number,
  playbackRate: number
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Buscar tracking activo
    const { data: tracking } = await supabase
      .from('lesson_tracking')
      .select('id, video_max_seconds')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('status', 'in_progress')
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .single();

    if (!tracking) return false;

    // Calcular nuevo máximo
    const currentMax = tracking.video_max_seconds || 0;
    const newMax = Math.max(currentMax, maxReached);

    // Actualizar
    const { error } = await supabase
      .from('lesson_tracking')
      .update({
        video_checkpoint_seconds: checkpoint,
        video_max_seconds: newMax,
        video_total_duration_seconds: totalDuration,
        video_playback_rate: playbackRate,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', tracking.id);

    return !error;
  } catch (error) {
    techDebtLogger.error('Error actualizando progreso de video:', error);
    return false;
  }
}

export default LessonTrackingService;
