import type {
  CourseAssignment,
  UserContext,
} from '../types/user-context.types'
import { CourseAnalysisService } from './course-analysis.service'
import {
  buildPlannedCourseKey,
  getUserPlannedCourseKeys,
} from './study-planner-plans.server.service'
import { UserContextService } from './user-context.service'

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

export async function buildStudyPlannerUserContext(
  userId: string,
): Promise<UserContext> {
  const userContext = await UserContextService.getFullUserContext(userId)
  const courseIds = userContext.courses.map((course) => course.courseId)
  const [progressByCourseId, plannedCourseKeys] = await Promise.all([
    CourseAnalysisService.getUserCourseProgressMap(userId, courseIds),
    getUserPlannedCourseKeys(userId),
  ])

  const enrichedCourses = enrichUserCourses({
    courses: userContext.courses,
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

  return {
    ...userContext,
    userId,
    courses: enrichedCourses,
  }
}

export { enrichUserCourses }
