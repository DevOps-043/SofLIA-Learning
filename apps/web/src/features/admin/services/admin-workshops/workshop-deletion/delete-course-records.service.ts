import { deleteByEq, runDeleteEqPlans } from './delete-helpers'
import type { SupabaseClient } from './types'

export async function deleteWorkshopCourseRecords(
  supabase: SupabaseClient,
  workshopId: string,
) {
  await runDeleteEqPlans(supabase, [
    { tableName: 'hierarchy_course_assignments', column: 'course_id', value: workshopId, label: 'las asignaciones jerarquicas del taller' },
    { tableName: 'organization_course_assignments', column: 'course_id', value: workshopId, label: 'las asignaciones organizacionales del taller' },
    { tableName: 'organization_course_purchases', column: 'course_id', value: workshopId, label: 'las compras organizacionales del taller' },
    { tableName: 'lia_conversations', column: 'course_id', value: workshopId, label: 'las conversaciones IA del taller' },
    { tableName: 'scorm_packages', column: 'course_id', value: workshopId, label: 'los paquetes SCORM del taller' },
    { tableName: 'subscriptions', column: 'course_id', value: workshopId, label: 'las suscripciones del taller' },
    { tableName: 'transactions', column: 'course_id', value: workshopId, label: 'las transacciones del taller' },
    { tableName: 'user_activity_log', column: 'course_id', value: workshopId, label: 'la bitacora de actividad del taller' },
    { tableName: 'user_course_certificates', column: 'course_id', value: workshopId, label: 'los certificados emitidos del taller' },
    { tableName: 'user_course_enrollments', column: 'course_id', value: workshopId, label: 'las inscripciones del taller' },
  ])

  await deleteByEq(supabase, 'courses', 'id', workshopId, {
    label: 'el taller',
  })
}
