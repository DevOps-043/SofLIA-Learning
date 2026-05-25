import { logger as techDebtLogger } from '@/lib/utils/logger'
import { UserContextProvider } from '../../providers/user/UserContextProvider'
import { check } from './assertions'
import { createResult } from './types'

export async function testUserContextProvider() {
  techDebtLogger.log('\nTEST: USER CONTEXT PROVIDER\n')
  const result = createResult()
  const provider = new UserContextProvider()

  check(result, provider.name === 'user', 'Provider name es user', 'Provider name es ' + provider.name)
  check(result, provider.priority === 30, 'Prioridad es 30', 'Prioridad es ' + provider.priority)
  check(result, provider.shouldInclude('general'), 'Se incluye en contexto general', 'No se incluye en contexto general')
  check(result, provider.shouldInclude('bug-report'), 'Se incluye en bug-report', 'No se incluye en bug-report')
  check(result, await provider.getContext({ contextType: 'general' }) === null, 'Sin userId retorna null', 'Sin userId deberia retornar null')

  const context = await provider.getContext({
    contextType: 'general',
    userId: 'test-user-123',
    enrichedMetadata: { sessionDuration: 300000, viewport: { width: 1920, height: 1080 }, platform: { browser: 'Chrome', os: 'Windows' }, timezone: 'America/Mexico_City', language: 'es-MX' },
  })
  check(result, Boolean(context?.content), 'Con userId retorna contexto', 'Con userId deberia retornar contexto')
  check(result, Boolean(context?.content.includes('CONTEXTO DEL USUARIO')), 'Incluye header correcto', 'No incluye header esperado')
  check(result, Boolean(context?.content.includes('5 minutos')), 'Incluye duracion de sesion', 'No incluye duracion de sesion')
  check(result, Boolean(context?.content.includes('Desktop')), 'Detecta tipo de dispositivo', 'No detecta tipo de dispositivo')
  return result
}
