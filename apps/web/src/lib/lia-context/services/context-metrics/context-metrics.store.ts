import type { ContextUsageMetric } from './context-metrics.types'

const MAX_METRICS = 1000

export const metricsStore: ContextUsageMetric[] = []

export function addContextMetric(metric: ContextUsageMetric): void {
  metricsStore.push(metric)

  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift()
  }
}

export function cleanupMetrics(olderThanMs: number): number {
  const cutoff = Date.now() - olderThanMs
  const initialLength = metricsStore.length
  const filtered = metricsStore.filter((metric) => metric.timestamp.getTime() > cutoff)

  metricsStore.length = 0
  metricsStore.push(...filtered)

  return initialLength - metricsStore.length
}

export function exportStoredMetrics(): ContextUsageMetric[] {
  return [...metricsStore]
}
