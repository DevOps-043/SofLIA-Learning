import { buildCurrentPageCapabilitiesSection } from '@/lib/lia-context/services/page-capabilities.service'
import { buildInteractiveActivitySection } from './activity-focus'
import { buildLessonContextSection } from './lesson-context'
import { buildSystemEventsSection } from './system-events'
import { buildTeamDetailSection } from './team-detail'
import type { PlatformContext } from './types'
import { buildUniversalUserRoleSection } from './user-role'
import { buildVisiblePageContentSection } from './visible-page-content'

export function buildPageInstructionsSection(context: PlatformContext): string {
  let section = ''

  if (context.currentLessonContext || context.currentActivityContext) {
    section += buildUniversalUserRoleSection(context, context.currentLessonContext)
  }

  // Lo que el usuario está viendo AHORA (incluye modales/paneles como las
  // estadísticas). Va primero y con prioridad alta para que SofLIA explique los
  // datos reales en pantalla en lugar de inferir solo desde la ruta.
  section += buildVisiblePageContentSection(context)

  // Que puede hacer el usuario EN ESTA pagina (resuelto desde la ruta actual).
  // Da prioridad a la pagina activa para que "que puedes hacer" se responda de
  // forma especifica en lugar de generica.
  section += buildCurrentPageCapabilitiesSection(context.currentPage)

  section += buildTeamDetailSection(context)
  section += buildInteractiveActivitySection(context)
  section += buildLessonContextSection(context)
  section += buildSystemEventsSection()

  return section
}
