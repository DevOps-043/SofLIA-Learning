import { deleteByIn, deleteOptionalByIn } from './delete-helpers'
import type { SupabaseClient } from './types'

const OPTIONAL_LESSON_TABLES = [
  ['user_quiz_submissions', 'los intentos de quiz asociados a lecciones del taller'],
  ['study_sessions', 'las sesiones de estudio del taller'],
  ['user_lesson_notes', 'las notas de lecciones del taller'],
  ['user_lesson_progress', 'el progreso de lecciones del taller'],
  ['lesson_feedback', 'la retroalimentacion de lecciones del taller'],
  ['lesson_tracking', 'el tracking de lecciones del taller'],
  ['lesson_time_estimates', 'las estimaciones de tiempo de lecciones del taller'],
  ['lesson_checkpoints', 'los checkpoints de lecciones del taller'],
  ['lia_common_questions', 'las preguntas frecuentes IA asociadas a lecciones del taller'],
  ['lia_conversations', 'las conversaciones IA asociadas a lecciones del taller'],
  ['user_activity_log', 'la bitacora de actividad de lecciones del taller'],
  ['user_activity_submissions', 'las entregas de actividades de lecciones del taller'],
  ['lesson_chat_suggestions', 'las sugerencias de chat de lecciones del taller'],
] as const

export async function deleteLessonData(supabase: SupabaseClient, lessonIds: string[]) {
  for (const [tableName, label] of OPTIONAL_LESSON_TABLES) {
    await deleteOptionalByIn(supabase, tableName, 'lesson_id', lessonIds, { label })
  }

  await deleteByIn(supabase, 'lesson_materials', 'lesson_id', lessonIds, {
    label: 'los materiales de las lecciones del taller',
  })
  await deleteByIn(supabase, 'lesson_activities', 'lesson_id', lessonIds, {
    label: 'las actividades de las lecciones del taller',
  })
  await deleteByIn(supabase, 'course_lessons', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller',
  })
  await deleteOptionalByIn(supabase, 'course_lessons_en', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller (en)',
  })
  await deleteOptionalByIn(supabase, 'course_lessons_pt', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller (pt)',
  })
}
