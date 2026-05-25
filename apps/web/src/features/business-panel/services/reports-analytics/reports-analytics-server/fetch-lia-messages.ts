import { chunkArray } from './chunk-array'
import { fetchPagedRows } from './fetch-paged-rows'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export async function fetchLiaMessages(
  supabase: ReportsAnalyticsSupabaseClient,
  conversations: LiaConversationRecord[],
): Promise<LiaMessageRecord[]> {
  const conversationIds = Array.from(
    new Set(conversations.map((conversation) => conversation.conversation_id).filter(Boolean)),
  )

  if (conversationIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(conversationIds, 400).map((chunk) =>
      fetchPagedRows<LiaMessageRecord>('lia messages', (from, to) =>
        supabase
        .from('lia_messages')
        .select(`
          message_id,
          conversation_id,
          role,
          content,
          created_at,
          contains_question,
          response_time_ms,
          is_off_topic,
          lia_redirected,
          lia_provided_example,
          sentiment_score,
          user_sentiment,
          tokens_used
        `)
          .in('conversation_id', chunk)
          .range(from, to),
      ),
    ),
  )

  return chunkResults.flat()
}
