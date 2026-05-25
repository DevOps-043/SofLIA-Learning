import {
  addContextMetric,
  cleanupMetrics,
  exportStoredMetrics,
  metricsStore,
} from './context-metrics/context-metrics.store'
import {
  calculateStatsFromMetrics,
  emptyStats,
} from './context-metrics/context-metrics.stats'
import {
  getBugReportStatsFromMetrics,
  getTopPagesFromMetrics,
} from './context-metrics/context-metrics.pages'
import { getProviderPerformanceFromMetrics } from './context-metrics/context-metrics.performance'
import type { ContextStats, ContextUsageMetric } from './context-metrics/context-metrics.types'

export class ContextMetricsService {
  private static instance: ContextMetricsService
  private sessionStart: Date
  private sessionMetrics: ContextUsageMetric[] = []

  constructor() {
    this.sessionStart = new Date()
  }

  static getInstance(): ContextMetricsService {
    if (!ContextMetricsService.instance) {
      ContextMetricsService.instance = new ContextMetricsService()
    }
    return ContextMetricsService.instance
  }

  recordUsage(metric: Omit<ContextUsageMetric, 'timestamp'>): void {
    const fullMetric: ContextUsageMetric = { ...metric, timestamp: new Date() }
    addContextMetric(fullMetric)
    this.sessionMetrics.push(fullMetric)
  }

  getStats(): ContextStats {
    return metricsStore.length === 0 ? emptyStats() : calculateStatsFromMetrics(metricsStore)
  }

  getSessionStats(): ContextStats & { sessionDuration: number } {
    return {
      ...calculateStatsFromMetrics(this.sessionMetrics),
      sessionDuration: Date.now() - this.sessionStart.getTime(),
    }
  }

  getTopPages(limit: number = 10): Array<{ page: string; count: number }> {
    return getTopPagesFromMetrics(metricsStore, limit)
  }

  getProviderPerformance(): Record<string, { avgTokens: number; usagePercent: number }> {
    return getProviderPerformanceFromMetrics(metricsStore)
  }

  getBugReportStats(): {
    total: number
    avgTokens: number
    topPages: Array<{ page: string; count: number }>
  } {
    return getBugReportStatsFromMetrics(metricsStore)
  }

  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    return cleanupMetrics(olderThanMs)
  }

  resetSession(): void {
    this.sessionMetrics = []
    this.sessionStart = new Date()
  }

  exportMetrics(): ContextUsageMetric[] {
    return exportStoredMetrics()
  }
}

export function recordContextUsage(
  metric: Omit<ContextUsageMetric, 'timestamp'>,
): void {
  ContextMetricsService.getInstance().recordUsage(metric)
}

export function getContextStats(): ContextStats {
  return ContextMetricsService.getInstance().getStats()
}

export function getProviderPerformance(): Record<string, { avgTokens: number; usagePercent: number }> {
  return ContextMetricsService.getInstance().getProviderPerformance()
}
