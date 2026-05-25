import type { BusinessCourseDetail } from '../types/business-course-detail.types'

type BusinessCourseModule = BusinessCourseDetail['modules'][number]

export function buildCourseStats(modulesWithLessons: BusinessCourseModule[]) {
  return {
    total_modules: modulesWithLessons.length,
    total_lessons: modulesWithLessons.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    ),
    total_duration_minutes: modulesWithLessons.reduce(
      (sum, module) => sum + module.calculated_duration_minutes,
      0,
    ),
  }
}
