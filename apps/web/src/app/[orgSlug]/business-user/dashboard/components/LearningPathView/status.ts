import type { AssignedCourse, AssignedLearningPathItem } from '../../types'
import type { LearningPathTranslator } from './types'

export function getItemCourseStatus(
  item: AssignedLearningPathItem,
): AssignedCourse['status'] {
  if (item.isCompleted || item.progress >= 100) return 'Completado'
  if (item.progress > 0) return 'En progreso'
  return 'No iniciado'
}

function getCourseStatusTranslationKey(status: AssignedCourse['status']) {
  switch (status) {
    case 'No iniciado':
      return 'dashboard.courses.status.notStarted'
    case 'Asignado':
      return 'dashboard.courses.status.assigned'
    case 'En progreso':
      return 'dashboard.courses.status.inProgress'
    case 'Completado':
      return 'dashboard.courses.status.completed'
    default:
      return null
  }
}

export function translateCourseStatus(
  status: AssignedCourse['status'],
  t: LearningPathTranslator,
) {
  const key = getCourseStatusTranslationKey(status)
  return key ? t(key, status) : status
}
