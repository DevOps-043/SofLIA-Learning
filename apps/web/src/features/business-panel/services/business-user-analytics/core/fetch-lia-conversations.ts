import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LiaConversationRecord } from './lia-conversation-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Devuelve TODAS las conversaciones de SofLIA del usuario.
 *
 * Este reporte es por-usuario (ya está acotado por `user_id`), por lo que la
 * adopción de SofLIA debe reflejar el uso real de esa persona. Anteriormente se
 * filtraba por `organization_id` / curso, pero `lia_conversations.organization_id`
 * se popula de forma inconsistente (queda `null` en la mayoría de las conversaciones,
 * ya que `startLiaConversation` no lo asigna) y, para usuarios que pertenecen a varias
 * empresas, descartaba conversaciones legítimas etiquetadas a otra organización ->
 * subconteo y, en el peor caso, 0% de adopción aunque el usuario sí use SofLIA.
 *
 * Los parámetros `_organizationId` y `_scope` se conservan por compatibilidad de firma
 * con `fetchQueryData` y posibles necesidades futuras de aislamiento por organización.
 */
export async function fetchLiaConversations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  _organizationId: string,
  _scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('lia_conversations')
    .select('conversation_id, course_id, organization_id, context_type, conversation_completed, started_at, ended_at, created_at, updated_at, total_messages, total_lia_messages, total_user_messages')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<LiaConversationRecord[]>()

  logQueryError('business user SofLIA conversations', error)
  return data || []
}
