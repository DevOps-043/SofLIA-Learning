import { runDeleteInPlans } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteWorkshopLessonRecords(
  supabase: SupabaseClient,
  ids: CourseHierarchyIds,
) {
  await runDeleteInPlans(supabase, [
    { tableName: 'user_quiz_submissions', column: 'lesson_id', values: ids.lessonIds, label: 'los intentos de quiz asociados a lecciones del taller' },
    { tableName: 'study_sessions', column: 'lesson_id', values: ids.lessonIds, label: 'las sesiones de estudio del taller' },
    { tableName: 'user_lesson_notes', column: 'lesson_id', values: ids.lessonIds, label: 'las notas de lecciones del taller' },
    { tableName: 'user_lesson_progress', column: 'lesson_id', values: ids.lessonIds, label: 'el progreso de lecciones del taller' },
    { tableName: 'lesson_feedback', column: 'lesson_id', values: ids.lessonIds, label: 'la retroalimentacion de lecciones del taller' },
    { tableName: 'lesson_tracking', column: 'lesson_id', values: ids.lessonIds, label: 'el tracking de lecciones del taller' },
    { tableName: 'lesson_time_estimates', column: 'lesson_id', values: ids.lessonIds, label: 'las estimaciones de tiempo de lecciones del taller' },
    { tableName: 'lesson_checkpoints', column: 'lesson_id', values: ids.lessonIds, label: 'los checkpoints de lecciones del taller' },
    { tableName: 'lia_common_questions', column: 'lesson_id', values: ids.lessonIds, label: 'las preguntas frecuentes IA asociadas a lecciones del taller' },
    { tableName: 'lia_conversations', column: 'lesson_id', values: ids.lessonIds, label: 'las conversaciones IA asociadas a lecciones del taller' },
    { tableName: 'user_activity_log', column: 'lesson_id', values: ids.lessonIds, label: 'la bitacora de actividad de lecciones del taller' },
    { tableName: 'lesson_materials', column: 'lesson_id', values: ids.lessonIds, label: 'los materiales de las lecciones del taller', required: true },
    { tableName: 'lesson_activities', column: 'lesson_id', values: ids.lessonIds, label: 'las actividades de las lecciones del taller', required: true },
    { tableName: 'course_lessons', column: 'lesson_id', values: ids.lessonIds, label: 'las lecciones del taller', required: true },
  ])
}
