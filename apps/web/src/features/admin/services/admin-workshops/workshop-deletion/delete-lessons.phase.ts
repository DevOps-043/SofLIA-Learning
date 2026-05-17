import { deleteByInBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopLessonData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  const lessonIds = context.lessonIds
  await deleteByInBatch(supabase, [
    { table: 'user_quiz_submissions', column: 'lesson_id', values: lessonIds, label: 'los intentos de quiz asociados a lecciones del taller', optional: true },
    { table: 'study_sessions', column: 'lesson_id', values: lessonIds, label: 'las sesiones de estudio del taller', optional: true },
    { table: 'user_lesson_notes', column: 'lesson_id', values: lessonIds, label: 'las notas de lecciones del taller', optional: true },
    { table: 'user_lesson_progress', column: 'lesson_id', values: lessonIds, label: 'el progreso de lecciones del taller', optional: true },
    { table: 'lesson_feedback', column: 'lesson_id', values: lessonIds, label: 'la retroalimentacion de lecciones del taller', optional: true },
    { table: 'lesson_tracking', column: 'lesson_id', values: lessonIds, label: 'el tracking de lecciones del taller', optional: true },
    { table: 'lesson_time_estimates', column: 'lesson_id', values: lessonIds, label: 'las estimaciones de tiempo de lecciones del taller', optional: true },
    { table: 'lesson_checkpoints', column: 'lesson_id', values: lessonIds, label: 'los checkpoints de lecciones del taller', optional: true },
    { table: 'lia_common_questions', column: 'lesson_id', values: lessonIds, label: 'las preguntas frecuentes IA asociadas a lecciones del taller', optional: true },
    { table: 'lia_conversations', column: 'lesson_id', values: lessonIds, label: 'las conversaciones IA asociadas a lecciones del taller', optional: true },
    { table: 'user_activity_log', column: 'lesson_id', values: lessonIds, label: 'la bitacora de actividad de lecciones del taller', optional: true },
    { table: 'user_activity_submissions', column: 'lesson_id', values: lessonIds, label: 'las entregas de actividades de lecciones del taller', optional: true },
    { table: 'lesson_chat_suggestions', column: 'lesson_id', values: lessonIds, label: 'las sugerencias de chat de lecciones del taller', optional: true },
    { table: 'lesson_materials', column: 'lesson_id', values: lessonIds, label: 'los materiales de las lecciones del taller' },
    { table: 'lesson_activities', column: 'lesson_id', values: lessonIds, label: 'las actividades de las lecciones del taller' },
    { table: 'course_lessons', column: 'lesson_id', values: lessonIds, label: 'las lecciones del taller' },
    { table: 'course_lessons_en', column: 'lesson_id', values: lessonIds, label: 'las lecciones del taller (en)', optional: true },
    { table: 'course_lessons_pt', column: 'lesson_id', values: lessonIds, label: 'las lecciones del taller (pt)', optional: true },
  ])
}
