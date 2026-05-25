import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LiaConversationRecord } from './lia-conversation-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLiaConversations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('lia_conversations')
    .select('conversation_id, course_id, organization_id, context_type, conversation_completed, started_at, ended_at, created_at, updated_at, total_messages, total_lia_messages, total_user_messages')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<LiaConversationRecord[]>()

  logQueryError('business user SofLIA conversations', error)
  return (data || []).filter((conversation) =>
    conversation.organization_id === organizationId ||
    (conversation.course_id ? scope.courseIds.has(conversation.course_id) : false) ||
    (!conversation.organization_id && !conversation.course_id),
  )
}
