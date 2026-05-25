import { logger as techDebtLogger } from '@/lib/utils/logger'
import { PAGE_METADATA, getRegisteredRoutes, hasPageMetadata } from '../../config/page-metadata'
import { createCounter } from './test-runner'

export function testNewPageMetadata(options: { includeSpecificPages?: boolean } = {}) {
  techDebtLogger.log('\nTEST: METADATA DE PAGINAS ADICIONALES\n')
  const counter = createCounter()
  const routes = getRegisteredRoutes()

  counter.check(routes.length >= 30, `Hay ${routes.length} paginas registradas`, `Solo hay ${routes.length} paginas`)
  counter.check(routes.filter((route) => route.includes('/auth')).length >= 5, 'Paginas de Auth registradas', 'Faltan paginas de Auth')
  counter.check(routes.filter((route) => route.startsWith('/admin')).length >= 10, 'Paginas de Admin registradas', 'Faltan paginas de Admin')
  counter.check(hasPageMetadata('/profile'), 'Pagina /profile tiene metadata', 'Pagina /profile no tiene metadata')
  counter.check(hasPageMetadata('/certificates'), 'Pagina /certificates tiene metadata', 'Pagina /certificates no tiene metadata')
  counter.check(hasPageMetadata('/communities/[slug]'), 'Pagina /communities/[slug] tiene metadata', 'Pagina /communities/[slug] no tiene metadata')
  counter.check(routes.filter((route) => route.includes('/instructor')).length >= 3, 'Paginas de Instructor registradas', 'Faltan paginas de Instructor')
  counter.check(routes.filter((route) => route.includes('/study-planner')).length >= 3, 'Paginas de Study Planner registradas', 'Faltan paginas de Study Planner')
  counter.check(Boolean(PAGE_METADATA['/auth']?.userFlows?.length), '/auth tiene flujos de usuario', '/auth no tiene flujos de usuario')
  counter.check(hasPageMetadata('/dashboard'), 'Pagina /dashboard tiene metadata', 'Pagina /dashboard no tiene metadata')
  logRouteDistribution(routes)

  if (options.includeSpecificPages) {
    ['/admin/workshops', '/admin/skills', '/admin/apps', '/admin/reels', '/auth/forgot-password']
      .forEach((page) => counter.check(hasPageMetadata(page), `${page} tiene metadata`, `${page} no tiene metadata`))
  }

  return counter.result()
}

function logRouteDistribution(routes: string[]) {
  const categories = {
    admin: routes.filter((route) => route.startsWith('/admin')).length,
    business: routes.filter((route) => route.includes('business-panel') || route.includes('business-user')).length,
    auth: routes.filter((route) => route.includes('/auth')).length,
    courses: routes.filter((route) => route.includes('/courses') || route.includes('/course')).length,
    instructor: routes.filter((route) => route.includes('/instructor')).length,
  }
  const other = routes.length - Object.values(categories).reduce((total, count) => total + count, 0)
  techDebtLogger.log('\nDistribucion de paginas:')
  Object.entries({ ...categories, other }).forEach(([name, count]) => techDebtLogger.log(`   ${name}: ${count}`))
}
