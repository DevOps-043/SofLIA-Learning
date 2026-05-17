import { PlatformContextProvider } from '../../providers/platform/PlatformContextProvider'
import { createCounter } from './test-runner'

export async function testPlatformContextProvider() {
  console.log('\nTEST: PLATFORM CONTEXT PROVIDER\n')
  const counter = createCounter()
  const provider = new PlatformContextProvider()

  counter.check(provider.name === 'platform', 'Provider name es platform', `Provider name es ${provider.name}`)
  counter.check(provider.priority === 10, 'Prioridad es 10', `Prioridad es ${provider.priority}`)
  counter.check(provider.shouldInclude('general'), 'Se incluye en contexto general', 'No se incluye en general')
  counter.check(!provider.shouldInclude('bug-report'), 'No se incluye en bug-report', 'No deberia incluirse en bug-report')

  const generalContext = await provider.getContext({ contextType: 'general' })
  counter.check(Boolean(generalContext?.content), 'Genera contexto general', 'Deberia generar contexto general')
  const generalContent = generalContext?.content || ''
  counter.check(generalContent.includes('SOFLIA'), 'Contexto menciona SOFLIA', 'Contexto no menciona SOFLIA')
  counter.check(generalContent.includes('Modulos Principales') || generalContent.includes('MÃ³dulos Principales'), 'Contexto incluye modulos', 'Contexto no incluye modulos')

  const courseContext = await provider.getContext({ contextType: 'general', currentPage: '/courses/react-basics/learn' })
  counter.check(Boolean(courseContext?.content.includes('Cursos')), 'Contexto de curso incluye modulo Cursos', 'Contexto de curso deberia incluir Cursos')
  const helpContext = await provider.getContext({ contextType: 'help' })
  counter.check(Boolean(helpContext?.content.includes('Roles de Usuario')), 'Contexto de ayuda incluye roles', 'Contexto de ayuda deberia incluir roles')
  return counter.result()
}
