import type { LiaAnalyticsSupabaseClient } from './types'
import {
  resolveLiaMessageCost,
  resolveLiaMessageTokens,
} from './message-metrics'
import type { LiaMessageMetricRow } from './types'

const conversationBatchSize = 500

export async function getContextDistribution(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; startDate: Date }
) {
  const { data } = await supabase
    .from('lia_conversation_analytics')
    .select('context_type, total_cost_usd, total_tokens')
    .gte('started_at', input.startDate.toISOString())
    .lte('started_at', input.nowISO)

  const contextCounts = new Map<
    string,
    { cost: number; count: number; tokens: number }
  >()

  data?.forEach((row) => {
    const type = row.context_type || 'general'
    const existing = contextCounts.get(type) || { cost: 0, count: 0, tokens: 0 }
    contextCounts.set(type, {
      cost: existing.cost + (row.total_cost_usd || 0),
      count: existing.count + 1,
      tokens: existing.tokens + (row.total_tokens || 0),
    })
  })

  const hasStoredUsage = Array.from(contextCounts.values()).some(
    (item) => item.cost > 0 || item.tokens > 0
  )

  if (!hasStoredUsage && data && data.length > 0) {
    return getContextDistributionFromMessages(supabase, input)
  }

  const totalContextCount = Array.from(contextCounts.values()).reduce(
    (sum, item) => sum + item.count,
    0
  )

  return Array.from(contextCounts.entries()).map(([contextType, item]) => ({
    contextType,
    cost: Number(item.cost.toFixed(6)),
    count: item.count,
    percentage:
      totalContextCount > 0
        ? Number(((item.count / totalContextCount) * 100).toFixed(1))
        : 0,
    tokens: item.tokens,
  }))
}

async function getContextDistributionFromMessages(
  supabase: LiaAnalyticsSupabaseClient,
  input: { nowISO: string; startDate: Date }
) {
  const { data: conversations } = await supabase
    .from('lia_conversations')
    .select('conversation_id, context_type')
    .gte('started_at', input.startDate.toISOString())
    .lte('started_at', input.nowISO)

  const contextByConversation = new Map<string, string>()
  conversations?.forEach((conversation) => {
    contextByConversation.set(
      conversation.conversation_id,
      conversation.context_type || 'general'
    )
  })

  const contextCounts = new Map<
    string,
    { cost: number; count: number; tokens: number }
  >()

  for (const conversationIds of chunk(Array.from(contextByConversation.keys()), conversationBatchSize)) {
    const { data: messages } = await supabase
      .from('lia_messages')
      .select('conversation_id, content, cost_usd, model_used, role, tokens_used')
      .in('conversation_id', conversationIds)

    ;((messages || []) as LiaMessageMetricRow[]).forEach((message) => {
      const contextType = message.conversation_id
        ? contextByConversation.get(message.conversation_id) || 'general'
        : 'general'
      const existing = contextCounts.get(contextType) || {
        cost: 0,
        count: 0,
        tokens: 0,
      }
      contextCounts.set(contextType, {
        cost: existing.cost + resolveLiaMessageCost(message),
        count: existing.count + 1,
        tokens: existing.tokens + resolveLiaMessageTokens(message),
      })
    })
  }

  const totalContextCount = Array.from(contextCounts.values()).reduce(
    (sum, item) => sum + item.count,
    0
  )

  return Array.from(contextCounts.entries()).map(([contextType, item]) => ({
    contextType,
    cost: Number(item.cost.toFixed(6)),
    count: item.count,
    percentage:
      totalContextCount > 0
        ? Number(((item.count / totalContextCount) * 100).toFixed(1))
        : 0,
    tokens: item.tokens,
  }))
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}
