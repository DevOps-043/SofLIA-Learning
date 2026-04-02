import type { BusinessCourseLevelStyles } from '../types/business-course-detail.types'

export function formatBusinessCourseDuration(minutes: number | null) {
  if (!minutes) {
    return 'N/A'
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

export function formatBusinessCourseDurationSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatBusinessCourseDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getBusinessCourseLevelStyles(level: string | null, primaryColor: string, accentColor: string): BusinessCourseLevelStyles {
  switch (level?.toLowerCase()) {
    case 'beginner':
    case 'principiante':
      return { bg: `${accentColor}20`, color: accentColor, text: 'Principiante' }
    case 'intermediate':
    case 'intermedio':
      return { bg: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', text: 'Intermedio' }
    case 'advanced':
    case 'avanzado':
      return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', text: 'Avanzado' }
    default:
      return { bg: `${primaryColor}20`, color: primaryColor, text: level || 'N/A' }
  }
}
