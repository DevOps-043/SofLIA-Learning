import { applyProviderFilter } from './provider-filter'
import type { MessageMetricsRow, SupabaseServerClient } from './types'

export async function getSummaryMetrics(
  supabase: SupabaseServerClient,
  startIso: string,
  endIso: string,
  provider: string,
) {
  let messagesQuery = supabase
    .from('lia_messages')
    .select('tokens_used, cost_usd, response_time_ms, model_used, role')
    .gte('created_at', startIso)
    .lte('created_at', endIso)

  messagesQuery = applyProviderFilter(messagesQuery, provider)
  const [
    { count: totalConversations },
    { data: messagesData },
    { count: completedActivities },
  ] = await Promise.all([
    supabase
      .from('lia_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', startIso)
      .lte('started_at', endIso),
    messagesQuery,
    supabase
      .from('lia_activity_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startIso)
      .lte('completed_at', endIso),
  ])

  const allMessages = (messagesData ?? []) as MessageMetricsRow[]
  const assistantMessages = allMessages.filter((message) => message.role === 'assistant')
  const responseTimes = assistantMessages
    .filter((message) => message.response_time_ms)
    .map((message) => message.response_time_ms as number)

  return {
    totalConversations: totalConversations || 0,
    totalMessages: allMessages.length,
    totalTokens: allMessages.reduce((sum, message) => sum + (message.tokens_used || 0), 0),
    totalCostUsd: allMessages.reduce((sum, message) => sum + (message.cost_usd || 0), 0),
    avgResponseTimeMs: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : 0,
    completedActivities: completedActivities || 0,
    assistantMessages,
  }
}
