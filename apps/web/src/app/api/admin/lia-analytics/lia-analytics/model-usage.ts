import type { MessageMetricsRow } from './types'

const UNKNOWN_MODEL_FALLBACK = 'gpt-4o-mini'

export function getModelUsage(assistantMessages: MessageMetricsRow[]) {
  const counts = new Map<string, { tokens: number; cost: number; count: number }>()
  assistantMessages.forEach((message) => {
    const model = message.model_used || UNKNOWN_MODEL_FALLBACK
    const current = counts.get(model) ?? { tokens: 0, cost: 0, count: 0 }
    counts.set(model, {
      tokens: current.tokens + (message.tokens_used || 0),
      cost: current.cost + (message.cost_usd || 0),
      count: current.count + 1,
    })
  })

  const totalTokens = Array.from(counts.values()).reduce((sum, row) => sum + row.tokens, 0)
  return Array.from(counts.entries()).map(([model, row]) => ({
    model,
    tokens: row.tokens,
    cost: Number(row.cost.toFixed(6)),
    count: row.count,
    percentage: totalTokens > 0 ? Number(((row.tokens / totalTokens) * 100).toFixed(1)) : 0,
  }))
}
