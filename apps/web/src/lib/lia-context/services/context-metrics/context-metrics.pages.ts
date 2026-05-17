import type { ContextUsageMetric } from './context-metrics.types'

function countPages(metrics: ContextUsageMetric[]): Record<string, number> {
  const pageCounts: Record<string, number> = {}

  metrics.forEach((metric) => {
    if (metric.currentPage) {
      pageCounts[metric.currentPage] = (pageCounts[metric.currentPage] || 0) + 1
    }
  })

  return pageCounts
}

function toTopPages(pageCounts: Record<string, number>, limit: number) {
  return Object.entries(pageCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getTopPagesFromMetrics(
  metrics: ContextUsageMetric[],
  limit: number = 10,
): Array<{ page: string; count: number }> {
  return toTopPages(countPages(metrics), limit)
}

export function getBugReportStatsFromMetrics(metrics: ContextUsageMetric[]): {
  total: number
  avgTokens: number
  topPages: Array<{ page: string; count: number }>
} {
  const bugMetrics = metrics.filter((metric) => metric.isBugReport)
  if (bugMetrics.length === 0) return { total: 0, avgTokens: 0, topPages: [] }

  const totalTokens = bugMetrics.reduce((sum, metric) => sum + metric.totalTokens, 0)

  return {
    total: bugMetrics.length,
    avgTokens: Math.round(totalTokens / bugMetrics.length),
    topPages: getTopPagesFromMetrics(bugMetrics, 5),
  }
}
