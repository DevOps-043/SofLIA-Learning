import type { PlatformContext } from './types'

export function buildBusinessRoutesSection(
  context: PlatformContext,
  basePrompt: string,
): string {
  if (!isBusinessPageContext(context)) {
    return basePrompt
  }

  const orgPrefix = context.organizationSlug ? `/${context.organizationSlug}` : ''
  const businessRoutes =
    '## Rutas del Panel de Negocios\n' +
    `- [Dashboard de Negocios](${orgPrefix}/business-panel/dashboard)\n` +
    `- [Jerarquia](${orgPrefix}/business-panel/hierarchy)\n` +
    `- [Catalogo de Cursos](${orgPrefix}/business-panel/courses)\n` +
    `- [Reportes y Analytics](${orgPrefix}/business-panel/reports)\n` +
    `- [Configuracion](${orgPrefix}/business-panel/settings)`

  return basePrompt.replace(
    /## Rutas Principales de SofLIA[\s\S]*?Talleres disponibles/g,
    businessRoutes,
  )
}

function isBusinessPageContext(context: PlatformContext): boolean {
  return Boolean(
    context.pageType?.startsWith('business_') ||
      context.currentPage?.includes('/business-panel') ||
      context.currentPage?.includes('/business-user'),
  )
}
