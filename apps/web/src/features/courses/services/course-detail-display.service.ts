import type {
  CourseDetailCourse,
  CourseDetailModule,
  CourseDetailSummary,
  CourseInstructorProfile,
} from '../types/course-detail.types'

export function formatCourseDuration(minutes: number | undefined) {
  const safeMinutes = minutes || 0
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`.trim()
  }

  return `${remainingMinutes}m`
}

export function formatLessonDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatCourseDate(dateString: string | Date) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function resolveCourseDifficultyText(difficulty: string | undefined) {
  switch (difficulty) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
    default:
      return 'General'
  }
}

export function resolveCourseDifficultyClassName(level: string | undefined) {
  switch (level?.toLowerCase()) {
    case 'beginner':
    case 'principiante':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'intermediate':
    case 'intermedio':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'advanced':
    case 'avanzado':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
}

export function buildCourseDetailSummary(
  modules: CourseDetailModule[],
  fallbackDurationMinutes: number | undefined
): CourseDetailSummary {
  const totalModules = modules.length
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const totalDurationMinutes = fallbackDurationMinutes || 0

  return {
    totalModules,
    totalLessons,
    totalDurationMinutes
  }
}

export function resolveInstructorName(
  course: CourseDetailCourse,
  instructor: CourseInstructorProfile | null
) {
  return instructor?.display_name ||
    (instructor?.first_name && instructor?.last_name
      ? `${instructor.first_name} ${instructor.last_name}`
      : instructor?.username) ||
    course.instructor_name ||
    'Instructor'
}

export function getInitialExpandedModuleIds(modules: CourseDetailModule[]) {
  if (modules.length === 0) {
    return []
  }

  return [modules[0].module_id]
}
