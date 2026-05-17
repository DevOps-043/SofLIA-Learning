import { deleteByEq } from './delete-helpers'
import { deleteByEqBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopCourseData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  const id = context.workshopId
  await deleteByEqBatch(supabase, [
    { table: 'course_reviews', column: 'course_id', value: id, label: 'las resenas del taller', optional: true },
    { table: 'course_skills', column: 'course_id', value: id, label: 'las habilidades del taller', optional: true },
    { table: 'hierarchy_course_assignments', column: 'course_id', value: id, label: 'las asignaciones jerarquicas del taller', optional: true, ignoreMissingRelation: true },
    { table: 'organization_course_assignments', column: 'course_id', value: id, label: 'las asignaciones organizacionales del taller', optional: true },
    { table: 'organization_course_purchases', column: 'course_id', value: id, label: 'las compras organizacionales del taller', optional: true },
    { table: 'lia_conversations', column: 'course_id', value: id, label: 'las conversaciones IA del taller', optional: true },
    { table: 'scorm_packages', column: 'course_id', value: id, label: 'los paquetes SCORM del taller', optional: true },
    { table: 'subscriptions', column: 'course_id', value: id, label: 'las suscripciones del taller', optional: true },
    { table: 'transactions', column: 'course_id', value: id, label: 'las transacciones del taller', optional: true },
    { table: 'user_activity_log', column: 'course_id', value: id, label: 'la bitacora de actividad del taller', optional: true },
    { table: 'user_course_certificates', column: 'course_id', value: id, label: 'los certificados emitidos del taller', optional: true },
    { table: 'user_course_enrollments', column: 'course_id', value: id, label: 'las inscripciones del taller', optional: true },
  ])
  await deleteByEq(supabase, 'courses', 'id', id, { label: 'el taller' })
}
