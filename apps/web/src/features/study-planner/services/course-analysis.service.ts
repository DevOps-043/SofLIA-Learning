/**
 * CourseAnalysisService
 *
 * Servicio para analizar cursos, calcular duraciones de lecciones,
 * analizar complejidad y sugerir rutas de aprendizaje usando LIA.
 */

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
import { buildCourseComplexity } from './course-analysis/calculations'
import {
  fetchActivePurchasedCourseIds,
  fetchAvailableCourseRows,
  fetchCompletedLessonIds,
  fetchCourseLessonCountRows,
  fetchCourseInfoRow,
  fetchCourseModulesRows,
  fetchCourseModulesRowsByCourseIds,
  fetchUserCourseProgressRows,
  fetchUserStudyStreakRow,
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
import type { CourseModuleRow } from './course-analysis/types'

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

    const modulesByCourseId = await this.getCourseModulesMap(uniqueCourseIds)
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
    const durations = await fetchCourseLessonDurations(modules)
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
      courseId,
      level: courseInfo.level,
      category: courseInfo.category,
      totalLessons,
      totalModules: modules.length,
      totalDurationMinutes,
      averageLessonDuration,
    })
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

    const uniqueCourses = Array.from(
      new Map(courses.map((course) => [course.id, course])).values(),
    )
    const modulesByCourseId = await this.getCourseModulesMap(
      uniqueCourses.map((course) => course.id),
    )
    const durationMap = await fetchLessonDurationMap(
      uniqueCourses.flatMap((course) =>
        getCourseLessonIds(modulesByCourseId.get(course.id) || []),
      ),
    )
    const complexities = uniqueCourses.map((course) =>
      buildCourseComplexityForCourse(
        course,
        modulesByCourseId.get(course.id) || [],
        durationMap,
      ),
    )

    return {
      courses,
      complexities,
      userProfile,
    }
  }

  static async getAvailableCoursesForSuggestion(
    userId: string,
    category?: string,
    level?: string,
    limit = 10,
  ): Promise<CourseInfo[]> {
    const excludedCourseIds = await fetchActivePurchasedCourseIds(userId)
    const courseRows = await fetchAvailableCourseRows({
      category,
      level,
      limit,
      excludedCourseIds,
    })

    return courseRows.map((courseRow) => mapCourseInfo(courseRow))
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
    const durationMap = await fetchLessonDurationMap(
      pendingLessons.map((lesson) => lesson.lessonId),
    )
    const totalRemainingMinutes = pendingLessons.reduce(
      (totalMinutes, lesson) =>
        totalMinutes + (durationMap.get(lesson.lessonId)?.totalMinutes || 0),
      0,
    )

    return {
      totalRemainingMinutes,
      remainingLessons: pendingLessons.length,
      estimatedSessionsNeeded: Math.ceil(totalRemainingMinutes / 30),
    }
  }

  static async getUserStudyStats(userId: string): Promise<{
    totalStudyMinutes: number
    totalSessionsCompleted: number
    averageSessionMinutes: number
    currentStreak: number
    longestStreak: number
  }> {
    const streakRow = await fetchUserStudyStreakRow(userId)

    if (!streakRow) {
      return {
        totalStudyMinutes: 0,
        totalSessionsCompleted: 0,
        averageSessionMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
      }
    }

    const totalSessionsCompleted = streakRow.total_sessions_completed || 0
    const totalStudyMinutes = streakRow.total_study_minutes || 0

    return {
      totalStudyMinutes,
      totalSessionsCompleted,
      averageSessionMinutes:
        totalSessionsCompleted > 0
          ? totalStudyMinutes / totalSessionsCompleted
          : 0,
      currentStreak: streakRow.current_streak || 0,
      longestStreak: streakRow.longest_streak || 0,
    }
  }

  private static async getCourseModulesMap(
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
}

function mapCourseModuleRow(module: CourseModuleRow): CourseModule {
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

function getCourseLessonIds(modules: CourseModule[]): string[] {
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.lessonId),
  )
}

function getCourseDurations(
  modules: CourseModule[],
  durationMap: Map<string, LessonDuration>,
): LessonDuration[] {
  return getCourseLessonIds(modules)
    .map((lessonId) => durationMap.get(lessonId))
    .filter((duration): duration is LessonDuration => Boolean(duration))
}

function buildCourseComplexityForCourse(
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
