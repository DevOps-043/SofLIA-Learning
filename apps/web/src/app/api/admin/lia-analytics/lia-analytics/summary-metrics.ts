import { applyProviderFilter } from './provider-filter'
import type {
  LiaAnalyticsSupabaseClient,
  LiaMessageMetricRow,
} from './types'

export async function getSummaryMetrics(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; provider: string; startDate: Date }
) {
  const { count: totalConversations } = await supabase
    .from('lia_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', input.startDate.toISOString())
    .lte('started_at', input.nowISO)

  let messagesQuery = supabase
    .from('lia_messages')
    .select('tokens_used, cost_usd, response_time_ms, model_used, role')
    .gte('created_at', input.startDate.toISOString())
    .lte('created_at', input.nowISO)

  messagesQuery = applyProviderFilter(messagesQuery, input.provider)
  const { data: messagesData } = await messagesQuery
  const messages = (messagesData || []) as LiaMessageMetricRow[]
  const assistantMessages = messages.filter((message) => message.role === 'assistant')

  const totalMessages = messages.length
  const totalTokens = messages.reduce((sum, message) => sum + (message.tokens_used || 0), 0)
  const totalCostUsd = messages.reduce((sum, message) => sum + (message.cost_usd || 0), 0)

  const { count: completedActivities } = await supabase
    .from('lia_activity_completions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', input.startDate.toISOString())
    .lte('completed_at', input.nowISO)

  return {
    assistantMessages,
    efficiency: {
      avgCostPerMessage:
        totalMessages > 0 ? Number((totalCostUsd / totalMessages).toFixed(6)) : 0,
      avgMessagesPerConversation:
        totalConversations && totalConversations > 0
          ? Number((totalMessages / totalConversations).toFixed(1))
          : 0,
    },
    summary: {
      avgResponseTimeMs: getAverageResponseTime(assistantMessages),
      completedActivities: completedActivities || 0,
      totalConversations: totalConversations || 0,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalMessages,
      totalTokens,
    },
  }
}

function getAverageResponseTime(messages: LiaMessageMetricRow[]): number {
  const responseTimes = messages
    .filter((message) => message.response_time_ms)
    .map((message) => message.response_time_ms as number)

  return responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0
}
