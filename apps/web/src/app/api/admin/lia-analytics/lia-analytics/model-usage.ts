import type { LiaMessageMetricRow } from './types'
import { normalizeLiaMessageMetrics } from './message-metrics'

export function getModelUsage(assistantMessages: LiaMessageMetricRow[]) {
  const modelCounts = new Map<
    string,
    { cost: number; count: number; tokens: number }
  >()

  assistantMessages.forEach((message) => {
    const metrics = normalizeLiaMessageMetrics(message)
    const model = metrics.model
    const existing = modelCounts.get(model) || { cost: 0, count: 0, tokens: 0 }
    modelCounts.set(model, {
      cost: existing.cost + metrics.cost,
      count: existing.count + 1,
      tokens: existing.tokens + metrics.tokens,
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
