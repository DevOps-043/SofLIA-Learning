import { deleteOptionalByEq, deleteOptionalByIn } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

const COURSE_ID_TABLES = [
  ['course_question_responses', 'las respuestas del foro del taller'],
  ['course_questions', 'las preguntas del foro del taller'],
  ['course_reviews', 'las resenas del taller'],
  ['course_skills', 'las habilidades del taller'],
  ['organization_course_assignments', 'las asignaciones organizacionales del taller'],
  ['organization_course_purchases', 'las compras organizacionales del taller'],
  ['lia_conversations', 'las conversaciones IA del taller'],
  ['scorm_packages', 'los paquetes SCORM del taller'],
  ['subscriptions', 'las suscripciones del taller'],
  ['transactions', 'las transacciones del taller'],
  ['user_activity_log', 'la bitacora de actividad del taller'],
  ['user_course_certificates', 'los certificados emitidos del taller'],
  ['user_course_enrollments', 'las inscripciones del taller'],
] as const

export async function deleteCourseRelatedData(
  supabase: SupabaseClient,
  workshopId: string,
  hierarchy: Pick<CourseHierarchyIds, 'questionIds' | 'responseIds'>,
) {
  await deleteOptionalByIn(
    supabase,
    'course_question_reactions',
    'response_id',
    hierarchy.responseIds,
    { label: 'las reacciones de respuestas del foro del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'course_question_reactions',
    'question_id',
    hierarchy.questionIds,
    { label: 'las reacciones de preguntas del foro del taller' },
  )
  await deleteOptionalByEq(supabase, 'hierarchy_course_assignments', 'course_id', workshopId, {
    label: 'las asignaciones jerarquicas del taller',
    ignoreMissingRelation: true,
  })

  for (const [tableName, label] of COURSE_ID_TABLES) {
    await deleteOptionalByEq(supabase, tableName, 'course_id', workshopId, { label })
  }
}
