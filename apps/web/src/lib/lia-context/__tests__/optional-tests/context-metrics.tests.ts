import { logger as techDebtLogger } from '@/lib/utils/logger'
import { ContextMetricsService, getContextStats, recordContextUsage } from '../../services/context-metrics.service'
import { createCounter } from './test-runner'

export function testContextMetricsService() {
  techDebtLogger.log('\nTEST: CONTEXT METRICS SERVICE\n')
  const counter = createCounter()
  const instance = ContextMetricsService.getInstance()

  counter.check(instance === ContextMetricsService.getInstance(), 'ContextMetricsService es singleton', 'No es singleton')
  recordContextUsage({
    contextType: 'general',
    currentPage: '/test/page',
    providersUsed: ['page', 'user'],
    totalTokens: 500,
    buildTimeMs: 50,
    isBugReport: false,
    userId: 'test-user',
    cached: false,
    fragmentCount: 2,
  })
  recordContextUsage({
    contextType: 'bug-report',
    currentPage: '/test/page',
    providersUsed: ['page', 'bug-report'],
    totalTokens: 800,
    buildTimeMs: 100,
    isBugReport: true,
    userId: 'test-user',
    cached: false,
    fragmentCount: 3,
  })

  const stats = getContextStats()
  counter.check(stats.totalRequests >= 2, `${stats.totalRequests} requests registrados`, 'Requests insuficientes')
  counter.check(stats.averageTokens > 0, `Average tokens: ${stats.averageTokens}`, 'Average tokens es 0')
  counter.check(stats.providerUsageCount.page >= 2, 'Provider page registrado', 'Provider page no registrado')
  counter.check(stats.bugReportCount >= 1, 'Bug reports registrados', 'Bug reports no registrados')
  counter.check(Object.keys(instance.getProviderPerformance()).length > 0, 'Performance disponible', 'Performance vacia')
  counter.check(instance.getBugReportStats().total >= 1, 'Bug report stats disponibles', 'Bug report stats vacias')
  counter.check(instance.getSessionStats().sessionDuration > 0, 'Session stats disponibles', 'Session stats no disponibles')
  counter.check(instance.getTopPages(5).length > 0, 'Top pages disponibles', 'Top pages vacio')
  return counter.result()
}
