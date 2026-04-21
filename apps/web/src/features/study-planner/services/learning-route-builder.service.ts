import type {
  CourseWithProgress,
  LearningRouteItem,
} from './learning-route.types'

const LEVEL_ORDER: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}

export function sortCoursesByLevelAndProgress(
  courses: CourseWithProgress[],
): CourseWithProgress[] {
  return [...courses].sort((left, right) => {
    const levelA = LEVEL_ORDER[left.level || 'intermediate'] || 2
    const levelB = LEVEL_ORDER[right.level || 'intermediate'] || 2

    if (levelA !== levelB) return levelA - levelB
    if (left.progress_percentage > 0 && right.progress_percentage === 0) return -1
    if (right.progress_percentage > 0 && left.progress_percentage === 0) return 1

    return left.title.localeCompare(right.title)
  })
}

export function buildRouteItems(
  courses: CourseWithProgress[],
): LearningRouteItem[] {
  return courses.map((course, index) => ({
    courseId: course.course_id,
    title: course.title,
    level: course.level,
    category: course.category,
    order: index + 1,
    isRequired: true,
    isOwned: true,
    currentProgress: course.progress_percentage,
    estimatedMinutes: course.duration_total_minutes || 60,
    reason: getCourseReason(course, index, courses),
  }))
}

export function getLevelName(level: string): string {
  const names: Record<string, string> = {
    beginner: 'bÃ¡sico',
    intermediate: 'intermedio',
    advanced: 'avanzado',
  }

  return names[level] || level
}

export function generateRouteName(courses: CourseWithProgress[]): string {
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))]

  if (categories.length === 1) {
    return `Ruta de ${categories[0]}`
  }

  if (categories.length <= 3) {
    return `Ruta de ${categories.join(' y ')}`
  }

  return 'Ruta de Aprendizaje Personalizada'
}

export function generateRouteDescription(courses: CourseWithProgress[]): string {
  const levels = [...new Set(courses.map((course) => course.level).filter(Boolean))]
  const hasAllLevels = levels.includes('beginner') && levels.includes('advanced')

  if (hasAllLevels) {
    return 'Una ruta completa que te llevarÃ¡ desde los fundamentos hasta tÃ©cnicas avanzadas.'
  }

  if (levels.includes('beginner')) {
    return 'Ruta enfocada en establecer bases sÃ³lidas de conocimiento.'
  }

  if (levels.includes('advanced')) {
    return 'Ruta avanzada para profundizar en temas especializados.'
  }

  return 'Ruta personalizada basada en tus cursos seleccionados.'
}

function getCourseReason(
  course: CourseWithProgress,
  index: number,
  allCourses: CourseWithProgress[],
): string {
  if (course.progress_percentage >= 100) {
    return 'Ya completado - incluido para referencia'
  }

  if (course.progress_percentage > 0) {
    return `En progreso (${course.progress_percentage}%) - prioritario para continuar`
  }

  const level = course.level || 'intermediate'

  if (index === 0) {
    return `Curso de nivel ${getLevelName(level)} - punto de partida recomendado`
  }

  const previousCourse = allCourses[index - 1]
  if (previousCourse && previousCourse.level !== course.level) {
    return `Avance a nivel ${getLevelName(level)} despuÃ©s de completar los fundamentos`
  }

  return `Curso ${getLevelName(level)} complementario`
}
