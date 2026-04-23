import type { PlatformContext } from '../platform-context.service'

export function buildTeamDetailSection(context: PlatformContext): string {
  if (context.pageType !== 'business_team_detail') return ''

  let section = '\n### ESTAS VIENDO: DETALLE DE EQUIPO (Business Panel)\n'
  section += `Equipo: "${context.teamName}"\n`
  if (context.description) section += `Descripcion: ${context.description}\n`
  section += `Lider: ${context.leaderName || 'Sin asignar'}\n`
  section += `Miembros: ${context.memberCount} (${context.activeMemberCount || 0} activos)\n`
  section += `Cursos asignados: ${context.coursesCount || 0}\n`
  section += `Pestana actual: ${context.currentTab || 'Resumen'}\n`
  section += '\nACCIONES DISPONIBLES EN ESTA PAGINA:\n'
  section += '- Editar informacion del equipo\n'
  section += `- Gestionar la pestana actual (${context.currentTab || 'General'})\n`
  section += '- Asignar nuevos cursos al equipo\n'
  section += '- Ver reporte de progreso detallado\n'
  section += `\nINSTRUCCION: Responde especificamente sobre este equipo. Si te preguntan "que puedo hacer", sugiere acciones de gestion sobre el equipo "${context.teamName}".\n`
  return section
}
