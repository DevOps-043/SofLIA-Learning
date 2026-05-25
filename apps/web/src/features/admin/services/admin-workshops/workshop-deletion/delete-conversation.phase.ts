import { deleteByInBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopConversationData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  await deleteByInBatch(supabase, [
    { table: 'certificate_ledger', column: 'cert_id', values: context.certificateIds, label: 'el historial de certificados del taller', ignoreMissingRelation: true },
    { table: 'lia_user_feedback', column: 'conversation_id', values: context.conversationIds, label: 'el feedback de conversaciones IA del taller', optional: true },
    { table: 'lia_messages', column: 'conversation_id', values: context.conversationIds, label: 'los mensajes de conversaciones IA del taller', optional: true },
    { table: 'lia_activity_completions', column: 'conversation_id', values: context.conversationIds, label: 'las completaciones de actividades IA del taller', optional: true },
    { table: 'user_quiz_submissions', column: 'material_id', values: context.materialIds, label: 'los intentos de quiz asociados a materiales del taller', optional: true },
    { table: 'user_quiz_submissions', column: 'activity_id', values: context.activityIds, label: 'los intentos de quiz asociados a actividades del taller', optional: true },
    { table: 'lia_conversations', column: 'activity_id', values: context.activityIds, label: 'las conversaciones IA asociadas a actividades del taller', optional: true },
    { table: 'lia_common_questions', column: 'activity_id', values: context.activityIds, label: 'las preguntas frecuentes IA asociadas a actividades del taller', optional: true },
  ])
}
