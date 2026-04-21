import type {
  CourseComplexity,
  CourseInfo,
  CourseModule,
  LessonDuration,
} from '../../types/user-context.types'
import { buildCourseComplexity } from './calculations'
import { getCourseDurations } from './modules.service'

export function buildCourseComplexityForCourse(
  course: CourseInfo,
  modules: CourseModule[],
  durationMap: Map<string, LessonDuration>,
): CourseComplexity {
  const durations = getCourseDurations(modules, durationMap)
  const totalLessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  )
  const totalDurationMinutes = durations.reduce(
    (sum, duration) => sum + duration.totalMinutes,
    0,
  )
  const averageLessonDuration =
    durations.length > 0 ? totalDurationMinutes / durations.length : 0

  return buildCourseComplexity({
    courseId: course.id,
    level: course.level,
    category: course.category,
    totalLessons,
    totalModules: modules.length,
    totalDurationMinutes,
    averageLessonDuration,
  })
}
