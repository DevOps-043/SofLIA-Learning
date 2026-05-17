import { useMemo } from 'react'

import type { AssignedCourse, AssignedLearningPath } from '../../types'
import {
  buildCourseFromLearningPathItem,
  buildStandaloneCourseSection,
} from './course-utils'
import type {
  CourseListSection,
  DashboardTranslator,
} from './types'

export function useDashboardCourseSections(
  assignedCourses: AssignedCourse[],
  learningPaths: AssignedLearningPath[],
  t: DashboardTranslator,
) {
  const assignedCourseMap = useMemo(() => {
    return new Map(assignedCourses.map((course) => [course.course_id, course]))
  }, [assignedCourses])

  const coursePathMap = useMemo(() => {
    const map = new Map<string, { isUnlocked: boolean; pathTitle: string; position: number }>()
    learningPaths.forEach((path) => {
      path.items.forEach((item) => {
        if (!map.has(item.courseId)) {
          map.set(item.courseId, {
            isUnlocked: item.isUnlocked,
            pathTitle: path.title,
            position: item.position,
          })
        }
      })
    })
    return map
  }, [learningPaths])

  const learningPathListSections = useMemo<CourseListSection[]>(() => {
    return learningPaths
      .map((learningPath) => ({
        entries: learningPath.items.map((item) => {
          const assignedCourse = assignedCourseMap.get(item.courseId)
          return {
            assigned: Boolean(assignedCourse),
            course: assignedCourse ?? buildCourseFromLearningPathItem(item, learningPath, t),
            isLocked: !item.isUnlocked,
            pathTitle: learningPath.title,
            position: item.position,
          }
        }),
        id: learningPath.id,
        summary: `${learningPath.completedItemsCount} ${t('dashboard.learningPaths.of', 'de')} ${learningPath.totalItemsCount} ${t('dashboard.learningPaths.completedCoursesSuffix', 'cursos completados')}`,
        title: learningPath.title,
      }))
      .filter((section) => section.entries.length > 0)
  }, [assignedCourseMap, learningPaths, t])

  const standaloneCourses = useMemo(() => {
    const learningPathCourseIds = new Set(
      learningPaths.flatMap((path) => path.items.map((item) => item.courseId)),
    )
    return assignedCourses.filter((course) => !learningPathCourseIds.has(course.course_id))
  }, [assignedCourses, learningPaths])

  const standaloneListSection = useMemo(
    () => buildStandaloneCourseSection(standaloneCourses, t),
    [standaloneCourses, t],
  )

  const groupedListSections = useMemo(
    () =>
      standaloneListSection
        ? [...learningPathListSections, standaloneListSection]
        : learningPathListSections,
    [learningPathListSections, standaloneListSection],
  )

  return { coursePathMap, groupedListSections }
}
