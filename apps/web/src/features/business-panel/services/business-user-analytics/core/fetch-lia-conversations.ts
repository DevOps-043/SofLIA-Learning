import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LiaConversationRecord } from './lia-conversation-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Conversaciones de SofLIA del usuario, acotadas por enrollment para separar el uso
 * por organización (cada `enrollment_id` = usuario + curso + organización). Requiere
 * la migración que añade `enrollment_id` a `lia_conversations` (20260611130000).
 *
 * Las conversaciones sin `enrollment_id` resuelto (chat general no atado a un curso)
 * quedan fuera del scope por-organización a propósito: no pueden atribuirse a una org.
 */
export async function fetchLiaConversations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  _organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('lia_conversations')
    .select('conversation_id, enrollment_id, course_id, organization_id, context_type, conversation_completed, started_at, ended_at, created_at, updated_at, total_messages, total_lia_messages, total_user_messages')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<LiaConversationRecord[]>()

  logQueryError('business user SofLIA conversations', error)
  return data || []
}
