import type { LiaMessageMetricRow } from './types'

export function getModelUsage(assistantMessages: LiaMessageMetricRow[]) {
  const modelCounts = new Map<
    string,
    { cost: number; count: number; tokens: number }
  >()

  assistantMessages.forEach((message) => {
    const model = message.model_used || 'gpt-4o-mini'
    const existing = modelCounts.get(model) || { cost: 0, count: 0, tokens: 0 }
    modelCounts.set(model, {
      cost: existing.cost + (message.cost_usd || 0),
      count: existing.count + 1,
      tokens: existing.tokens + (message.tokens_used || 0),
    })
  })

  const totalModelTokens = Array.from(modelCounts.values()).reduce(
    (sum, model) => sum + model.tokens,
    0
  )

  return Array.from(modelCounts.entries()).map(([model, item]) => ({
    cost: Number(item.cost.toFixed(6)),
    count: item.count,
    model,
    percentage:
      totalModelTokens > 0
        ? Number(((item.tokens / totalModelTokens) * 100).toFixed(1))
        : 0,
    tokens: item.tokens,
  }))
}
