import type {
  CourseAssignment,
  UserContext,
} from '../types/user-context.types'
import { CourseAnalysisService } from './course-analysis.service'
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
  const progressByCourseId = await CourseAnalysisService.getUserCourseProgressMap(
    userId,
    userContext.courses.map((course) => course.courseId),
  )

  return {
    ...userContext,
    userId,
    courses: enrichUserCourses({
      courses: userContext.courses,
      progressByCourseId,
    }),
  }
}

export { enrichUserCourses }
