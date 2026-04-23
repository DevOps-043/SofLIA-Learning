import { deleteByIn, runDeleteInPlans } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteWorkshopLiaRecords(
  supabase: SupabaseClient,
  ids: CourseHierarchyIds,
) {
  await deleteByIn(supabase, 'certificate_ledger', 'cert_id', ids.certificateIds, {
    label: 'el historial de certificados del taller',
    ignoreMissingRelation: true,
  })

  await runDeleteInPlans(supabase, [
    { tableName: 'lia_user_feedback', column: 'conversation_id', values: ids.conversationIds, label: 'el feedback de conversaciones IA del taller' },
    { tableName: 'lia_messages', column: 'conversation_id', values: ids.conversationIds, label: 'los mensajes de conversaciones IA del taller' },
    { tableName: 'lia_activity_completions', column: 'conversation_id', values: ids.conversationIds, label: 'las completaciones de actividades IA del taller' },
    { tableName: 'user_quiz_submissions', column: 'material_id', values: ids.materialIds, label: 'los intentos de quiz asociados a materiales del taller' },
    { tableName: 'user_quiz_submissions', column: 'activity_id', values: ids.activityIds, label: 'los intentos de quiz asociados a actividades del taller' },
    { tableName: 'lia_conversations', column: 'activity_id', values: ids.activityIds, label: 'las conversaciones IA asociadas a actividades del taller' },
    { tableName: 'lia_common_questions', column: 'activity_id', values: ids.activityIds, label: 'las preguntas frecuentes IA asociadas a actividades del taller' },
  ])
}
