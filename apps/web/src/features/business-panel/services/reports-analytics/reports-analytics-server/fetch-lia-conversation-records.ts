import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchLiaConversationRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
  dateRange: { from: string; to: string },
): Promise<LiaConversationRecord[]> {
  return fetchUserScopedRows<LiaConversationRecord>('lia conversations', userIds, (chunk, from, to) =>
    supabase
      .from('lia_conversations')
      .select(`
        conversation_id,
        user_id,
        course_id,
        context_type,
        conversation_completed,
        started_at,
        ended_at,
        created_at,
        updated_at,
        total_messages,
        total_lia_messages,
        total_user_messages,
        courses (
          id,
          title
        )
      `)
      .in('user_id', chunk)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .range(from, to),
  )
}
