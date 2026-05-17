import { ContextBuilderService } from '../../services/context-builder.service'
import { createCounter } from './test-runner'

export async function testContextBuilderWithNewProviders() {
  console.log('\nTEST: CONTEXT BUILDER CON NUEVOS PROVIDERS\n')
  const counter = createCounter()
  const builder = new ContextBuilderService({ enableMetrics: false })
  const stats = builder.getStats()

  counter.check(stats.registeredProviders >= 5, `${stats.registeredProviders} providers registrados`, 'Providers insuficientes')
  counter.check(stats.providerNames.includes('user'), 'UserContextProvider registrado', 'UserContextProvider no registrado')
  counter.check(stats.providerNames.includes('platform'), 'PlatformContextProvider registrado', 'PlatformContextProvider no registrado')

  const context = await builder.buildContext({
    contextType: 'general',
    userId: 'test-user',
    currentPage: '/dashboard',
    enrichedMetadata: {
      viewport: { width: 1200, height: 800 },
      platform: { browser: 'Firefox', os: 'Linux' },
    },
  })

  counter.check(context.length > 100, `Contexto general generado (${context.length} chars)`, 'Contexto general muy corto')
  counter.check(context.includes('SOFLIA'), 'Contexto incluye info de SOFLIA', 'Contexto no incluye info de SOFLIA')
  return counter.result()
}
