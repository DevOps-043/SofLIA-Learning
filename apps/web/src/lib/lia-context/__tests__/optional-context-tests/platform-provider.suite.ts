import { logger as techDebtLogger } from '@/lib/utils/logger'
import { PlatformContextProvider } from '../../providers/platform/PlatformContextProvider'
import { check } from './assertions'
import { createResult } from './types'

export async function testPlatformContextProvider() {
  techDebtLogger.log('\nTEST: PLATFORM CONTEXT PROVIDER\n')
  const result = createResult()
  const provider = new PlatformContextProvider()

  check(result, provider.name === 'platform', 'Provider name es platform', 'Provider name es ' + provider.name)
  check(result, provider.priority === 10, 'Prioridad es 10', 'Prioridad es ' + provider.priority)
  check(result, provider.shouldInclude('general'), 'Se incluye en general', 'No se incluye en general')
  check(result, !provider.shouldInclude('bug-report'), 'No se incluye en bug-report', 'No deberia incluirse en bug-report')

  const generalContext = await provider.getContext({ contextType: 'general' })
  check(result, Boolean(generalContext?.content), 'Genera contexto general', 'Deberia generar contexto general')
  check(result, Boolean(generalContext?.content.includes('SOFLIA')), 'Contexto menciona SOFLIA', 'Contexto no menciona SOFLIA')
  check(result, Boolean(generalContext?.content.includes('Módulos Principales')), 'Contexto incluye modulos', 'Contexto no incluye modulos')

  const courseContext = await provider.getContext({ contextType: 'general', currentPage: '/courses/react-basics/learn' })
  const helpContext = await provider.getContext({ contextType: 'help' })
  check(result, Boolean(courseContext?.content.includes('Cursos')), 'Contexto de curso incluye Cursos', 'Contexto de curso deberia incluir Cursos')
  check(result, Boolean(helpContext?.content.includes('Roles de Usuario')), 'Contexto de ayuda incluye roles', 'Contexto de ayuda deberia incluir roles')
  return result
}
