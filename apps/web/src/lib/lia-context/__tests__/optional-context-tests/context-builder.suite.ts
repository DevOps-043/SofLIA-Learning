import { logger as techDebtLogger } from '@/lib/utils/logger'
import { ContextBuilderService } from '../../services/context-builder.service'
import { check } from './assertions'
import { createResult } from './types'

export async function testContextBuilderWithNewProviders() {
  techDebtLogger.log('\nTEST: CONTEXT BUILDER CON NUEVOS PROVIDERS\n')
  const result = createResult()
  const builder = new ContextBuilderService({ enableMetrics: false })
  const stats = builder.getStats()

  check(result, stats.registeredProviders >= 5, stats.registeredProviders + ' providers registrados', 'Providers insuficientes')
  check(result, stats.providerNames.includes('user'), 'UserContextProvider registrado', 'UserContextProvider no registrado')
  check(result, stats.providerNames.includes('platform'), 'PlatformContextProvider registrado', 'PlatformContextProvider no registrado')

  const context = await builder.buildContext({
    contextType: 'general',
    userId: 'test-user',
    currentPage: '/dashboard',
    enrichedMetadata: { viewport: { width: 1200, height: 800 }, platform: { browser: 'Firefox', os: 'Linux' } },
  })
  check(result, context.length > 100, 'Contexto general generado', 'Contexto general muy corto o vacio')
  check(result, context.includes('SOFLIA'), 'Contexto incluye SOFLIA', 'Contexto no incluye SOFLIA')
  return result
}
