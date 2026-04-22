import type { LearningRouteItem } from './learning-route.types'

export function generateTips(items: LearningRouteItem[]): string[] {
  const tips: string[] = []
  const inProgressCourses = items.filter(
    (item) => item.currentProgress > 0 && item.currentProgress < 100,
  )

  if (inProgressCourses.length > 0) {
    tips.push(
      `Tienes ${inProgressCourses.length} curso(s) en progreso. Te recomendamos completarlos antes de iniciar nuevos.`,
    )
  }

  const beginnerCourses = items.filter((item) => item.level === 'beginner')
  if (beginnerCourses.length > 0 && beginnerCourses[0].currentProgress < 100) {
    tips.push('Comienza con los cursos de nivel básico para construir una base sólida.')
  }

  tips.push('Aplica lo aprendido en cada curso antes de pasar al siguiente para mejor retención.')
  return tips
}

export function generateWarnings(items: LearningRouteItem[]): string[] {
  const warnings: string[] = []
  const hasAdvancedWithoutBeginner =
    items.some((item) => item.level === 'advanced')
    && !items.some((item) => item.level === 'beginner' && item.currentProgress >= 50)

  if (hasAdvancedWithoutBeginner) {
    warnings.push(
      'Tienes cursos avanzados sin haber completado los básicos. Considera completar los fundamentos primero.',
    )
  }

  if (items.length > 5) {
    warnings.push(
      'Tienes muchos cursos en tu ruta. Considera enfocarte en 3-5 para mejor concentración.',
    )
  }

  return warnings
}
