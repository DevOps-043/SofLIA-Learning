import { UserContextProvider } from '../../providers/user/UserContextProvider'
import { createCounter } from './test-runner'

export async function testUserContextProvider() {
  console.log('\nTEST: USER CONTEXT PROVIDER\n')
  const counter = createCounter()
  const provider = new UserContextProvider()

  counter.check(provider.name === 'user', 'Provider name es user', `Provider name es ${provider.name}`)
  counter.check(provider.priority === 30, 'Prioridad es 30', `Prioridad es ${provider.priority}`)
  counter.check(provider.shouldInclude('general'), 'Se incluye en contexto general', 'No se incluye en general')
  counter.check(provider.shouldInclude('bug-report'), 'Se incluye en contexto bug-report', 'No se incluye en bug-report')

  const noUserContext = await provider.getContext({ contextType: 'general' })
  counter.check(noUserContext === null, 'Sin userId retorna null', 'Sin userId deberia retornar null')

  const withUserContext = await provider.getContext({
    contextType: 'general',
    userId: 'test-user-123',
    enrichedMetadata: {
      sessionDuration: 300000,
      viewport: { width: 1920, height: 1080 },
      platform: { browser: 'Chrome', os: 'Windows' },
      timezone: 'America/Mexico_City',
      language: 'es-MX',
    },
  })

  counter.check(Boolean(withUserContext?.content), 'Con userId retorna contexto', 'Con userId deberia retornar contexto')
  const content = withUserContext?.content || ''
  counter.check(content.includes('CONTEXTO DEL USUARIO'), 'Contexto incluye header correcto', 'Contexto no incluye header')
  counter.check(content.includes('5 minutos'), 'Contexto incluye duracion de sesion', 'No incluye duracion de sesion')
  counter.check(content.includes('Desktop'), 'Contexto detecta tipo de dispositivo', 'No detecta tipo de dispositivo')
  return counter.result()
}
