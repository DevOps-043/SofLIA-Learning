import { logger as techDebtLogger } from '@/lib/utils/logger'
import { PAGE_METADATA, getRegisteredRoutes, hasPageMetadata } from '../../config/page-metadata'
import { check } from './assertions'
import { createResult } from './types'

export function testNewPageMetadata() {
  techDebtLogger.log('\nTEST: METADATA DE PAGINAS ADICIONALES\n')
  const result = createResult()
  const routes = getRegisteredRoutes()
  const counts = {
    auth: routes.filter((route) => route.includes('/auth')).length,
    admin: routes.filter((route) => route.startsWith('/admin')).length,
    instructor: routes.filter((route) => route.includes('/instructor')).length,
    studyPlanner: routes.filter((route) => route.includes('/study-planner')).length,
  }

  check(result, routes.length >= 30, 'Hay ' + routes.length + ' paginas registradas', 'Solo hay ' + routes.length + ' paginas')
  check(result, counts.auth >= 5, counts.auth + ' paginas de Auth registradas', 'Solo ' + counts.auth + ' paginas de Auth')
  check(result, counts.admin >= 10, counts.admin + ' paginas de Admin registradas', 'Solo ' + counts.admin + ' paginas de Admin')
  check(result, counts.instructor >= 3, counts.instructor + ' paginas de Instructor registradas', 'Solo ' + counts.instructor + ' paginas de Instructor')
  check(result, counts.studyPlanner >= 3, counts.studyPlanner + ' paginas de Study Planner', 'Solo ' + counts.studyPlanner + ' paginas de Study Planner')

  ;['/profile', '/certificates', '/communities/[slug]', '/dashboard', '/admin/workshops', '/admin/skills', '/admin/apps', '/admin/reels', '/auth/forgot-password']
    .forEach((page) => check(result, hasPageMetadata(page), page + ' tiene metadata', page + ' no tiene metadata'))

  check(result, Boolean(PAGE_METADATA['/auth']?.userFlows?.length), '/auth tiene flujos de usuario', '/auth no tiene flujos de usuario')
  logDistribution(routes)
  return result
}

function logDistribution(routes: string[]) {
  const categories = {
    admin: routes.filter((route) => route.startsWith('/admin')).length,
    business: routes.filter((route) => route.includes('business-panel') || route.includes('business-user')).length,
    auth: routes.filter((route) => route.includes('/auth')).length,
    courses: routes.filter((route) => route.includes('/courses') || route.includes('/course')).length,
    instructor: routes.filter((route) => route.includes('/instructor')).length,
  }
  const other = routes.length - Object.values(categories).reduce((sum, value) => sum + value, 0)
  techDebtLogger.log('Distribucion: ' + JSON.stringify({ ...categories, other }))
}
