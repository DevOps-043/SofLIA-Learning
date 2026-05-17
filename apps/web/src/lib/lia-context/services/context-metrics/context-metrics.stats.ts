import type { ContextStats, ContextUsageMetric } from './context-metrics.types'

function countProviders(metrics: ContextUsageMetric[]): Record<string, number> {
  const providerUsageCount: Record<string, number> = {}
  metrics.forEach((metric) => {
    metric.providersUsed.forEach((provider) => {
      providerUsageCount[provider] = (providerUsageCount[provider] || 0) + 1
    })
  })
  return providerUsageCount
}

function countByOptionalField(
  metrics: ContextUsageMetric[],
  field: 'pageType',
): Record<string, number> {
  const counts: Record<string, number> = {}
  metrics.forEach((metric) => {
    const value = metric[field]
    if (value) counts[value] = (counts[value] || 0) + 1
  })
  return counts
}

function countByField(
  metrics: ContextUsageMetric[],
  field: 'contextType',
): Record<string, number> {
  return metrics.reduce<Record<string, number>>((counts, metric) => {
    const value = metric[field]
    counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})
}

export function calculateStatsFromMetrics(metrics: ContextUsageMetric[]): ContextStats {
  if (metrics.length === 0) return emptyStats()

  const totalRequests = metrics.length
  const totalTokens = metrics.reduce((sum, metric) => sum + metric.totalTokens, 0)
  const totalBuildTime = metrics.reduce((sum, metric) => sum + metric.buildTimeMs, 0)
  const cachedCount = metrics.filter((metric) => metric.cached).length
  const bugReportCount = metrics.filter((metric) => metric.isBugReport).length

  return {
    totalRequests,
    averageTokens: Math.round(totalTokens / totalRequests),
    averageBuildTime: Math.round(totalBuildTime / totalRequests),
    cacheHitRate: (cachedCount / totalRequests) * 100,
    providerUsageCount: countProviders(metrics),
    contextTypeCount: countByField(metrics, 'contextType'),
    pageTypeCount: countByOptionalField(metrics, 'pageType'),
    bugReportCount,
    lastUpdated: new Date(),
  }
}

export function emptyStats(): ContextStats {
  return {
    totalRequests: 0,
    averageTokens: 0,
    averageBuildTime: 0,
    cacheHitRate: 0,
    providerUsageCount: {},
    contextTypeCount: {},
    pageTypeCount: {},
    bugReportCount: 0,
    lastUpdated: new Date(),
  }
}
