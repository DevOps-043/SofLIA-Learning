import type {
  CourseModule,
  LessonDuration,
} from '../../types/user-context.types'
import { fetchCourseModulesRowsByCourseIds } from './db'
import type { CourseModuleRow } from './types'

export function mapCourseModuleRow(module: CourseModuleRow): CourseModule {
  return {
    moduleId: module.module_id,
    moduleTitle: module.module_title,
    moduleDescription: module.module_description || undefined,
    moduleOrderIndex: module.module_order_index,
    moduleDurationMinutes: module.module_duration_minutes || 0,
    isRequired: module.is_required || false,
    isPublished: module.is_published,
    lessons: (module.course_lessons || [])
      .filter((lesson) => lesson.is_published)
      .sort((left, right) => left.lesson_order_index - right.lesson_order_index)
      .map((lesson) => ({
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
        lessonDescription: lesson.lesson_description || undefined,
        lessonOrderIndex: lesson.lesson_order_index,
        durationSeconds: lesson.duration_seconds || 0,
        moduleId: module.module_id,
        isPublished: lesson.is_published,
      })),
  }
}

export async function getCourseModulesMap(
  courseIds: string[],
): Promise<Map<string, CourseModule[]>> {
  const uniqueCourseIds = Array.from(
    new Set(courseIds.filter((courseId) => Boolean(courseId))),
  )

  if (uniqueCourseIds.length === 0) {
    return new Map()
  }

  const moduleRows = await fetchCourseModulesRowsByCourseIds(uniqueCourseIds)
  const modulesByCourseId = new Map<string, CourseModule[]>()

  for (const moduleRow of moduleRows) {
    const mappedModule = mapCourseModuleRow(moduleRow)
    const existingModules = modulesByCourseId.get(moduleRow.course_id)

    if (existingModules) {
      existingModules.push(mappedModule)
      continue
    }

    modulesByCourseId.set(moduleRow.course_id, [mappedModule])
  }

  return modulesByCourseId
}

export function getCourseLessonIds(modules: CourseModule[]): string[] {
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.lessonId),
  )
}

export function getCourseDurations(
  modules: CourseModule[],
  durationMap: Map<string, LessonDuration>,
): LessonDuration[] {
  return getCourseLessonIds(modules)
    .map((lessonId) => durationMap.get(lessonId))
    .filter((duration): duration is LessonDuration => Boolean(duration))
}
