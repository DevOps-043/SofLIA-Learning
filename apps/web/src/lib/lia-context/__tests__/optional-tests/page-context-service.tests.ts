import { logger as techDebtLogger } from '@/lib/utils/logger'
import { PageContextService } from '../../services/page-context.service'
import { createCounter } from './test-runner'

export function testPageContextServiceNewPages() {
  techDebtLogger.log('\nTEST: PAGE CONTEXT SERVICE - NUEVAS PAGINAS\n')
  const counter = createCounter()

  const pageCases = [
    { path: '/auth', tokens: ['auth_login', 'Login'] },
    { path: '/profile', tokens: ['user_profile', 'Perfil'] },
    { path: '/dashboard', tokens: ['main_dashboard', 'Dashboard'] },
    { path: '/certificates', tokens: ['certificates_list', 'Certificados'] },
    { path: '/communities/test-community', tokens: ['community_home', 'Comunidad'] },
    { path: '/instructor/dashboard', tokens: ['instructor_dashboard', 'Instructor'] },
  ]

  pageCases.forEach(({ path, tokens }) => {
    const context = PageContextService.buildPageContext(path)
    counter.check(tokens.some((token) => context.includes(token)), `${path} genera contexto`, `${path} no genera contexto esperado`)
  })

  const authBugContext = PageContextService.buildBugReportContext('/auth')
  counter.check(authBugContext.includes('OAuth') || authBugContext.includes('Login'), '/auth genera contexto de bug', '/auth no genera contexto de bug')
  return counter.result()
}
