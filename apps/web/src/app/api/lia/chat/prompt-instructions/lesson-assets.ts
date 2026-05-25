import type { LessonContext } from './types'

export function buildLessonActivitiesSection(lessonContext: LessonContext): string {
  if (!lessonContext.activities) return ''

  let section = '\nACTIVIDADES DE ESTA LECCION:\n'
  section += `- Total: ${lessonContext.activities.totalActivities} | Requeridas: ${lessonContext.activities.requiredActivities} | Completadas: ${lessonContext.activities.completedActivities}\n`

  if (lessonContext.activities.pendingRequiredTitles) {
    section += `- Actividades requeridas pendientes: ${lessonContext.activities.pendingRequiredTitles}\n`
  }

  section += (lessonContext.activities.items || []).slice(0, 8).map((activity, index) => {
    let line = `${index + 1}. ${activity.title} [${activity.type}]`
    line += activity.isRequired ? ' requerida' : ' opcional'
    line += activity.isCompleted ? ' - completada' : ' - pendiente'
    return activity.description ? `${line}\n   Descripcion: ${activity.description}` : line
  }).join('\n')

  if (section && !section.endsWith('\n')) section += '\n'
  return section + buildCurrentActivityFocusSection(lessonContext)
}

export function buildLessonMaterialsSection(lessonContext: LessonContext): string {
  if (!lessonContext.materials) return ''

  let section = '\nMATERIALES DISPONIBLES EN ESTA LECCION:\n'
  section += `- Total: ${lessonContext.materials.totalMaterials} | Requeridos: ${lessonContext.materials.requiredMaterials}\n`
  section += (lessonContext.materials.items || []).slice(0, 8).map((material, index) => {
    let line = `${index + 1}. ${material.title} [${material.type}]`
    line += material.isRequired ? ' requerido' : ' opcional'
    return material.description ? `${line}\n   Descripcion: ${material.description}` : line
  }).join('\n')

  return section.endsWith('\n') ? section : `${section}\n`
}

export function buildLessonQuizSection(lessonContext: LessonContext): string {
  if (!lessonContext.quiz || !lessonContext.quiz.hasRequiredQuizzes) return ''

  let section = '\nQUIZZES REQUERIDOS EN ESTA LECCION:\n'
  section += `- Totales: ${lessonContext.quiz.totalRequiredQuizzes} | Completados: ${lessonContext.quiz.completedQuizzes} | Aprobados: ${lessonContext.quiz.passedQuizzes}\n`
  section += (lessonContext.quiz.quizzes || []).slice(0, 6).map((quiz) => {
    const status = quiz.isPassed
      ? 'aprobado'
      : quiz.isCompleted
        ? `completado (${quiz.percentage}%)`
        : 'pendiente'
    return `- ${quiz.title} [${quiz.type}] - ${status}`
  }).join('\n')

  return section.endsWith('\n') ? section : `${section}\n`
}

function buildCurrentActivityFocusSection(lessonContext: LessonContext): string {
  const focus = lessonContext.activities?.currentActivityFocus
  if (!focus) return ''

  let section = `\nACTIVIDAD EN FOCO: "${focus.title}"\n`
  section += `- Tipo: ${focus.type}\n`
  section += `- Descripcion: ${focus.description}\n`
  if (focus.prompts?.length) {
    section += `- Prompts sugeridos: ${focus.prompts.join(' | ')}\n`
  }
  return section
}
