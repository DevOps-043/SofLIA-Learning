import type { ModuleWithLessons } from './full-results.types'
import type { CourseModuleRow, EnrollmentRow, FullCourseRequest } from './full.types'
import { fetchLessonQueryData } from './full-lessons.queries'
import { mapModulesWithLessons } from './full-lessons.mapper'

export interface FullLessonsResult {
  modules: ModuleWithLessons[]
  overallProgress: number
}

export async function buildModulesWithLessons(
  request: FullCourseRequest,
  modules: CourseModuleRow[],
  enrollment: EnrollmentRow | null,
): Promise<FullLessonsResult> {
  if (modules.length === 0) {
    return { modules: [], overallProgress: 0 }
  }

  const queryData = await fetchLessonQueryData(request, modules, enrollment)

  return {
    modules: mapModulesWithLessons(modules, queryData),
    overallProgress: enrollment?.overall_progress_percentage
      ? Number(enrollment.overall_progress_percentage)
      : 0,
  }
}
