import type {
  CourseAssignment,
  CourseComplexity,
  CourseInfo,
  CourseModule,
  LessonDuration,
  LessonInfo,
  UserType,
} from '../types/user-context.types'
import { mapCourseInfo, mapPersonName } from './course-query.shared'
import {
  fetchCompletedLessonIds,
  fetchCourseLessonCountRows,
  fetchCourseInfoRow,
  fetchCourseModulesRows,
  fetchUserCourseProgressRows,
} from './course-analysis/db'
import {
  fetchCourseLessonDurations,
  fetchLessonDurationMap,
} from './course-analysis/duration.service'
import {
  buildCourseProgressMap,
  createDefaultCourseProgress,
  type CourseProgressSnapshot,
} from './course-analysis/progress.service'
import {
  getCourseDurations,
  getCourseLessonIds,
  getCourseModulesMap,
  mapCourseModuleRow,
} from './course-analysis/modules.service'
import { buildCourseComplexitySummary } from './course-analysis/course-complexity-summary.service'
import { prepareLearningRouteSuggestionData as prepareRouteSuggestionData } from './course-analysis/learning-route-suggestion-data.service'
import { calculateRemainingTimeFromLessons } from './course-analysis/remaining-time.service'
import {
  getUserStudyStats,
  type UserStudyStats,
} from './course-analysis/stats.service'
import { getAvailableCoursesForSuggestion } from './course-analysis/available-courses.service'

export class CourseAnalysisService {
  static async getUserCourses(
    userId: string,
    userType: UserType,
  ): Promise<CourseAssignment[]> {
    const { UserContextService } = await import('./user-context.service')
    return UserContextService.getUserCourses(userId, userType)
  }

  static async getCourseInfo(courseId: string): Promise<CourseInfo | null> {
    const courseRow = await fetchCourseInfoRow(courseId)
    if (!courseRow) {
      return null
    }

    return mapCourseInfo(courseRow, {
      instructorName: mapPersonName(courseRow.instructor),
    })
  }

  static async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const moduleRows = await fetchCourseModulesRows(courseId)

    return moduleRows.map(mapCourseModuleRow)
  }

  static async getCourseLessons(courseId: string): Promise<LessonInfo[]> {
    const modules = await this.getCourseModules(courseId)
    return modules.flatMap((module) => module.lessons)
  }

  static async calculateLessonDuration(
    lessonId: string,
  ): Promise<LessonDuration | null> {
    const durationMap = await fetchLessonDurationMap([lessonId])
    return durationMap.get(lessonId) || null
  }

  static async getAllLessonsForCourses(
    courseIds: string[],
  ): Promise<Map<string, LessonDuration[]>> {
    const uniqueCourseIds = Array.from(
      new Set(courseIds.filter((courseId) => Boolean(courseId))),
    )

    if (uniqueCourseIds.length === 0) {
      return new Map()
    }

    const modulesByCourseId = await getCourseModulesMap(uniqueCourseIds)
    const durationMap = await fetchLessonDurationMap(
      uniqueCourseIds.flatMap((courseId) =>
        getCourseLessonIds(modulesByCourseId.get(courseId) || []),
      ),
    )

    return new Map(
      uniqueCourseIds.map((courseId) => [
        courseId,
        getCourseDurations(
          modulesByCourseId.get(courseId) || [],
          durationMap,
        ),
      ]),
    )
  }

  static async calculateCourseTotalTime(courseId: string): Promise<number> {
    const modules = await this.getCourseModules(courseId)
    const durations = await fetchCourseLessonDurations(modules)

    return durations.reduce(
      (totalMinutes, duration) => totalMinutes + duration.totalMinutes,
      0,
    )
  }

  static async getMinimumLessonTime(courseId: string): Promise<number> {
    const modules = await this.getCourseModules(courseId)
    const durations = await fetchCourseLessonDurations(modules)

    if (durations.length === 0) {
      return 0
    }

    return durations.reduce(
      (minimumMinutes, duration) =>
        Math.min(minimumMinutes, duration.totalMinutes),
      Infinity,
    )
  }

  static async getCourseComplexity(
    courseId: string,
  ): Promise<CourseComplexity | null> {
    const courseInfo = await this.getCourseInfo(courseId)
    if (!courseInfo) {
      return null
    }

    const modules = await this.getCourseModules(courseId)
    return buildCourseComplexitySummary(courseId, courseInfo, modules)
  }

  static async getUserCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<{
    progressPercentage: number
    completedLessons: number
    totalLessons: number
    lastAccessedAt?: string
  }> {
    const progressByCourseId = await this.getUserCourseProgressMap(userId, [courseId])
    return progressByCourseId.get(courseId) ?? createDefaultCourseProgress()
  }

  static async getUserCourseProgressMap(
    userId: string,
    courseIds: string[],
  ): Promise<Map<string, CourseProgressSnapshot>> {
    const uniqueCourseIds = Array.from(
      new Set(courseIds.filter((courseId) => Boolean(courseId))),
    )

    if (uniqueCourseIds.length === 0) {
      return new Map()
    }

    const [progressRows, lessonCountRows] = await Promise.all([
      fetchUserCourseProgressRows(userId, uniqueCourseIds),
      fetchCourseLessonCountRows(uniqueCourseIds),
    ])

    return buildCourseProgressMap({
      courseIds: uniqueCourseIds,
      lessonCountRows,
      progressRows,
    })
  }

  static async getPendingLessons(
    userId: string,
    courseId: string,
  ): Promise<LessonInfo[]> {
    const [allLessons, completedLessonIds] = await Promise.all([
      this.getCourseLessons(courseId),
      fetchCompletedLessonIds(userId),
    ])

    return allLessons.filter(
      (lesson) => !completedLessonIds.has(lesson.lessonId),
    )
  }

  static async prepareLearningRouteSuggestionData(
    userId: string,
    courses: CourseInfo[],
    userProfile: {
      rol?: string
      area?: string
      nivel?: string
    },
  ): Promise<{
    courses: CourseInfo[]
    complexities: CourseComplexity[]
    userProfile: typeof userProfile
  }> {
    void userId
    return prepareRouteSuggestionData({
      courses,
      userProfile,
    })
  }

  static async getAvailableCoursesForSuggestion(
    userId: string,
    category?: string,
    level?: string,
    limit = 10,
  ): Promise<CourseInfo[]> {
    return getAvailableCoursesForSuggestion(userId, category, level, limit)
  }

  static async calculateRemainingTime(
    userId: string,
    courseId: string,
  ): Promise<{
    totalRemainingMinutes: number
    remainingLessons: number
    estimatedSessionsNeeded: number
  }> {
    const pendingLessons = await this.getPendingLessons(userId, courseId)
    return calculateRemainingTimeFromLessons(pendingLessons)
  }

  static getUserStudyStats(userId: string): Promise<UserStudyStats> {
    return getUserStudyStats(userId)
  }
}
