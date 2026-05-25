import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'

export function normalizeCourseStatus(status: string | null, progress: number): string {
  if (status === 'completed' || progress >= 100) return 'completed'
  if (status === 'active' || status === 'in_progress' || progress > 0) return 'active'
  return status || 'assigned'
}

export function normalizeCourseProgress(status: string | null, progress: number): number {
  const boundedProgress = Math.min(Math.max(progress, 0), 100)
  if (status === 'completed') return 100
  return boundedProgress
}

export function isCompletedCourseStats(course: BusinessUserStatsCourseData): boolean {
  return course.status === 'completed' || course.progress >= 100
}

export function isInProgressCourseStats(course: BusinessUserStatsCourseData): boolean {
  return !isCompletedCourseStats(course) && course.progress > 0
}
