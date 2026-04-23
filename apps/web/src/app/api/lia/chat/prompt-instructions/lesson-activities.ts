import type { LessonContext } from './types'

export function buildLessonActivitiesSection(lessonContext: LessonContext): string {
  if (!lessonContext.activities) return ''

  let section = '\nACTIVIDADES DE ESTA LECCION:\n'
  section += `- Total: ${lessonContext.activities.totalActivities} | Requeridas: ${lessonContext.activities.requiredActivities} | Completadas: ${lessonContext.activities.completedActivities}\n`

  if (lessonContext.activities.pendingRequiredTitles) {
    section += `- Actividades requeridas pendientes: ${lessonContext.activities.pendingRequiredTitles}\n`
  }

  lessonContext.activities.items?.slice(0, 8).forEach((activity, index) => {
    section += `${index + 1}. ${activity.title} [${activity.type}]${activity.isRequired ? ' requerida' : ' opcional'}${activity.isCompleted ? ' - completada' : ' - pendiente'}\n`
    if (activity.description) section += `   Descripcion: ${activity.description}\n`
  })

  const focus = lessonContext.activities.currentActivityFocus
  if (!focus) return section

  section += `\nACTIVIDAD EN FOCO: "${focus.title}"\n`
  section += `- Tipo: ${focus.type}\n`
  section += `- Descripcion: ${focus.description}\n`
  if (focus.prompts?.length) {
    section += `- Prompts sugeridos: ${focus.prompts.join(' | ')}\n`
  }

  return section
}
