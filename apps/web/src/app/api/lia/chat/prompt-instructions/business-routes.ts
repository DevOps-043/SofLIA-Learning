import type { PlatformContext } from '../platform-context.service'

export function buildBusinessRoutesSection(
  context: PlatformContext,
  basePrompt: string,
): string {
  if (
    !context.pageType?.startsWith('business_') &&
    !context.currentPage?.includes('/business-panel') &&
    !context.currentPage?.includes('/business-user')
  ) {
    return basePrompt
  }

  const orgPrefix = context.organizationSlug ? `/${context.organizationSlug}` : ''
  const businessRoutes = [
    '## Rutas del Panel de Negocios',
    `- [Dashboard de Negocios](${orgPrefix}/business-panel/dashboard)`,
    `- [Jerarquia](${orgPrefix}/business-panel/hierarchy)`,
    `- [Catalogo de Cursos](${orgPrefix}/business-panel/courses)`,
    `- [Analytics](${orgPrefix}/business-panel/analytics)`,
    `- [Configuracion](${orgPrefix}/business-panel/settings)`,
  ].join('\n')

  return basePrompt.replace(
    new RegExp('## Rutas Principales de SofLIA[\\s\\S]*?Talleres disponibles', 'g'),
    businessRoutes,
  )
}
