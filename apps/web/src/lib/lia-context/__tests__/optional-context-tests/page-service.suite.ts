import { PageContextService } from '../../services/page-context.service'
import { check } from './assertions'
import { createResult } from './types'

export function testPageContextServiceNewPages() {
  console.log('
TEST: PAGE CONTEXT SERVICE
')
  const result = createResult()
  const cases = [
    { path: '/auth', expected: ['auth_login', 'Login'] },
    { path: '/profile', expected: ['user_profile', 'Perfil'] },
    { path: '/dashboard', expected: ['main_dashboard', 'Dashboard'] },
    { path: '/certificates', expected: ['certificates_list', 'Certificados'] },
    { path: '/communities/test-community', expected: ['community_home', 'Comunidad'] },
    { path: '/instructor/dashboard', expected: ['instructor_dashboard', 'Instructor'] },
  ]

  cases.forEach((item) => {
    const context = PageContextService.buildPageContext(item.path)
    check(result, item.expected.some((text) => context.includes(text)), item.path + ' genera contexto', item.path + ' no genera contexto esperado')
  })

  const authBugContext = PageContextService.buildBugReportContext('/auth')
  check(result, authBugContext.includes('OAuth') || authBugContext.includes('Login'), '/auth genera bug context', '/auth no genera bug context esperado')
  return result
}
