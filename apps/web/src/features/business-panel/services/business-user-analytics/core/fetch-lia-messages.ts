import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { chunkArray } from './chunk-array'
import { LiaMessageRecord } from './lia-message-record'
import { logQueryError } from './log-query-error'

export async function fetchLiaMessages(
  supabase: BusinessUserAnalyticsSupabaseClient,
  conversationIds: string[],
) {
  if (conversationIds.length === 0) return []

  const rows: LiaMessageRecord[] = []
  for (const chunk of chunkArray(conversationIds, 200)) {
    const { data, error } = await supabase
      .from('lia_messages')
      .select('message_id, conversation_id, role, content, message_sequence, created_at, contains_question, response_time_ms, is_off_topic, lia_redirected, lia_provided_example, sentiment_score, tokens_used')
      .in('conversation_id', chunk)
      .order('created_at', { ascending: true })
      .returns<LiaMessageRecord[]>()

    logQueryError('business user SofLIA messages', error)
    rows.push(...(data || []))
  }

  return rows
}
