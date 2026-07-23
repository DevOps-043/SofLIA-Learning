import { computeLessonActivityProgress } from './progress-compute'
import type { CourseLessonContext, SupabaseServerClient } from './types'

export async function recalculateLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
) {
  const summary = await computeLessonActivityProgress(supabase, context)
  const now = new Date().toISOString()

  // La lectura se hace por la clave única REAL de la tabla, `(user_id, lesson_id)`,
  // no por `enrollment_id`: buscar por enrollment no encontraba el progreso que el
  // mismo usuario ya tuviera de esa lección bajo OTRO enrollment, se intentaba
  // insertar y se violaba `user_lesson_progress_user_id_lesson_id_key`.
  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('started_at')
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .maybeSingle()

  // La escritura es un upsert sobre esa misma clave: al ser una sola sentencia
  // atómica, dos peticiones concurrentes ya no pueden insertar ambas (el otro
  // camino por el que se producía el duplicate key).
  //
  // `started_at` conserva el valor original si ya existía: marca cuándo empezó
  // la lección y sobrescribirlo en cada recálculo falsearía el dato.
  await supabase.from('user_lesson_progress').upsert(
    {
      activity_progress_percentage: summary.activityProgressPercentage,
      enrollment_id: context.enrollmentId,
      last_accessed_at: now,
      last_activity_submission_at: summary.lastActivitySubmissionAt,
      lesson_id: context.lessonId,
      organization_id: context.organizationId,
      required_activities_completed: summary.requiredActivitiesCompleted,
      required_activities_total: summary.requiredActivitiesTotal,
      started_at: existingProgress?.started_at ?? now,
      updated_at: now,
      user_id: context.userId,
    },
    { onConflict: 'user_id,lesson_id' },
  )

  return summary
}
