import type {
  CourseAssignment,
  UserContext,
} from '../types/user-context.types'
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'
import { CourseAnalysisService } from './course-analysis.service'
import { COURSE_INFO_SELECT, mapCourseInfo, type CourseRow } from './course-query.shared'
import { getStudyPlannerPlannableCourses } from './study-planner-plannable-courses.service'
import {
  buildPlannedCourseKey,
  getUserPlannedCourseKeys,
} from './study-planner-plans.server.service'
import { UserContextService } from './user-context.service'
import { createClient } from '@/lib/supabase/server'
import { loadActiveOrganizationMemberships } from './user-course-assignments/organization-memberships.service'

function enrichUserCourses(params: {
  courses: CourseAssignment[]
  progressByCourseId: Map<
    string,
    {
      progressPercentage: number
      completedLessons: number
      totalLessons: number
      lastAccessedAt?: string
    }
  >
}): CourseAssignment[] {
  return params.courses.map((course) => {
    const progress = params.progressByCourseId.get(course.courseId)

    if (!progress) {
      return course
    }

    return {
      ...course,
      completionPercentage: progress.progressPercentage,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      lastAccessedAt: progress.lastAccessedAt,
    }
  })
}

async function appendUnlockedLearningPathCourses(params: {
  userContext: UserContext
  userId: string
}): Promise<CourseAssignment[]> {
  const { userContext, userId } = params

  if (userContext.userType !== 'b2b') {
    return userContext.courses
  }

  try {
    const memberships = await loadActiveOrganizationMemberships(userId)
    if (memberships.length === 0) {
      return userContext.courses
    }

    const learningPathSets = await Promise.all(
      memberships.map(async (membership) => ({
        organizationId: membership.organizationId,
        organizationName: membership.organizationName,
        learningPaths: await loadBusinessUserLearningPaths({
          userId,
          organizationId: membership.organizationId,
        }),
      })),
    )

    const existingCourseKeys = new Set(
      userContext.courses.map(
        (course) => `${course.courseId}::${course.organizationId ?? ''}`,
      ),
    )
    const unlockedItems = learningPathSets.flatMap((entry) =>
      entry.learningPaths.flatMap((learningPath) =>
        learningPath.items
          .filter((item) => item.isUnlocked && !item.isCompleted)
          .map((item) => ({
            courseId: item.courseId,
            organizationId: entry.organizationId,
            organizationName: entry.organizationName,
            progress: item.progress,
          })),
      ),
    )
    const missingCourseIds = [...new Set(
      unlockedItems
        .filter((item) => !existingCourseKeys.has(`${item.courseId}::${item.organizationId}`))
        .map((item) => item.courseId),
    )]

    if (missingCourseIds.length === 0) {
      return userContext.courses
    }

    const supabase = await createClient()
    const { data: courseRows, error } = await supabase
      .from('courses')
      .select(COURSE_INFO_SELECT)
      .in('id', missingCourseIds)
      .returns<CourseRow[]>()

    if (error || !courseRows) {
      return userContext.courses
    }

    const courseInfoById = new Map(
      courseRows.map((courseRow) => [courseRow.id, mapCourseInfo(courseRow)]),
    )
    const appendedCourses: CourseAssignment[] = []

    for (const item of unlockedItems) {
      const courseInfo = courseInfoById.get(item.courseId)
      if (!courseInfo) {
        continue
      }

      const courseKey = `${item.courseId}::${item.organizationId}`
      if (existingCourseKeys.has(courseKey)) {
        continue
      }

      existingCourseKeys.add(courseKey)
      appendedCourses.push({
        courseId: item.courseId,
        course: courseInfo,
        userType: 'b2b',
        organizationId: item.organizationId,
        organizationName:
          item.organizationName ??
          (userContext.organization?.id === item.organizationId ? userContext.organization.name : undefined),
        status: 'assigned',
        completionPercentage: item.progress,
        source: 'organization',
      })
    }

    return [...userContext.courses, ...appendedCourses]
  } catch {
    return userContext.courses
  }
}

export async function buildStudyPlannerUserContext(
  userId: string,
): Promise<UserContext> {
  const userContext = await UserContextService.getFullUserContext(userId)
  const allCourses = await appendUnlockedLearningPathCourses({ userContext, userId })
  const courseIds = allCourses.map((course) => course.courseId)
  const [progressByCourseId, plannedCourseKeys] = await Promise.all([
    CourseAnalysisService.getUserCourseProgressMap(userId, courseIds),
    getUserPlannedCourseKeys(userId),
  ])

  const enrichedCourses = enrichUserCourses({
    courses: allCourses,
    progressByCourseId,
  }).map((course) => ({
    ...course,
    // Use composite key (courseId::orgId) so the same course assigned by two
    // different organizations is treated as two independent plannable items.
    // Backward compat: also check bare courseId for plans created before multi-org
    // support was added (those were saved with organization_id = null).
    hasActivePlan:
      plannedCourseKeys.has(buildPlannedCourseKey(course.courseId, course.organizationId)) ||
      (course.organizationId != null && plannedCourseKeys.has(course.courseId)),
  }))
  const plannableCourses = getStudyPlannerPlannableCourses(enrichedCourses)

  return {
    ...userContext,
    userId,
    courses: plannableCourses,
  }
}

export { enrichUserCourses }
