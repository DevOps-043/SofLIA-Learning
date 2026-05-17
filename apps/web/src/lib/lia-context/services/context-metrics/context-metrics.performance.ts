import type { ContextUsageMetric } from './context-metrics.types'

interface ProviderStats {
  totalTokens: number
  count: number
}

export function getProviderPerformanceFromMetrics(
  metrics: ContextUsageMetric[],
): Record<string, { avgTokens: number; usagePercent: number }> {
  const providerStats: Record<string, ProviderStats> = {}
  const totalRequests = metrics.length

  metrics.forEach((metric) => {
    const tokensPerProvider = metric.totalTokens / (metric.providersUsed.length || 1)
    metric.providersUsed.forEach((provider) => {
      providerStats[provider] = providerStats[provider] || { totalTokens: 0, count: 0 }
      providerStats[provider].totalTokens += tokensPerProvider
      providerStats[provider].count += 1
    })
  })

  return Object.entries(providerStats).reduce<Record<string, { avgTokens: number; usagePercent: number }>>(
    (result, [provider, stats]) => {
      result[provider] = {
        avgTokens: Math.round(stats.totalTokens / stats.count),
        usagePercent: totalRequests > 0 ? (stats.count / totalRequests) * 100 : 0,
      }
      return result
    },
    {},
  )
}
