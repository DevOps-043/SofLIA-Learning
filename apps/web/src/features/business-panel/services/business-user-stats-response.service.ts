import type { BusinessUserStatsApiResponse } from '../types/business-user-stats.types'
import type { BusinessUserStatsQueryData } from './business-user-stats-query.service'
import { applyActivityStats } from './business-user-stats-response/activity-stats'
import { buildAssignmentSummaries } from './business-user-stats-response/assignment-summaries'
import { buildEnrichedCertificates } from './business-user-stats-response/certificates'
import { createCourseIdByLessonId } from './business-user-stats-response/course-id-by-lesson'
import { createCourseStatsMap } from './business-user-stats-response/course-stats-map'
import { createInstructorMap } from './business-user-stats-response/instructors'
import { createCourseModuleIdsByCourse, createLessonInfoById, createRealLessonsByCourse } from './business-user-stats-response/lesson-lookups'
import { buildLessonDetailByCourse } from './business-user-stats-response/lesson-detail-builder'
import { applyLessonProgressStats } from './business-user-stats-response/lesson-progress-stats'
import { applyLiaStats } from './business-user-stats-response/lia-stats'
import { applyModuleStats } from './business-user-stats-response/module-stats'
import { applyNotesStats } from './business-user-stats-response/notes-stats'
import { sortCoursesByLearningPathOrder } from './business-user-stats-response/ordering'
import { buildUserResponse, getUserProfile } from './business-user-stats-response/profile'
import { applyQuizStats } from './business-user-stats-response/quiz-stats'
import { buildResponseStats } from './business-user-stats-response/response-stats'

export function buildBusinessUserStatsResponse(data: BusinessUserStatsQueryData): BusinessUserStatsApiResponse {
  const user = getUserProfile(data.organizationUser)
  const lessonInfoById = createLessonInfoById(data.lessons)
  const courseModuleIdsByCourse = createCourseModuleIdsByCourse(data.courseModules)
  const realLessonsByCourse = createRealLessonsByCourse(courseModuleIdsByCourse, data.lessonCounts)
  const instructorMap = createInstructorMap(data.instructors)
  const certificates = buildEnrichedCertificates(data, instructorMap)
  const courseStatsMap = createCourseStatsMap(data.enrollments, certificates, data.assignments)
  const courseIdByLessonId = createCourseIdByLessonId(data.lessonProgress)

  applyLiaStats(courseStatsMap, data.liaConversations, data.liaMessages)
  applyQuizStats(courseStatsMap, data.quizSubmissions)
  applyActivityStats(courseStatsMap, data.activityCompletions)
  applyNotesStats(courseStatsMap, data.lessonNotes, courseIdByLessonId)
  applyLessonProgressStats(courseStatsMap, data.lessonProgress, realLessonsByCourse)
  applyModuleStats(courseStatsMap, data.courseModules, data.lessonProgress, lessonInfoById)

  const courses = sortCoursesByLearningPathOrder(Array.from(courseStatsMap.values()), data.learningPathCourseOrder)
  const coursesWithLessons = sortCoursesByLearningPathOrder(buildLessonDetailByCourse(data), data.learningPathCourseOrder)

  return {
    success: true,
    user: buildUserResponse(user),
    stats: buildResponseStats({ certificates, coursesData: courses, coursesWithLessons, data, realLessonsByCourse }),
    courses,
    courses_with_lessons: coursesWithLessons,
    certificates,
    assignments: buildAssignmentSummaries(data.assignments),
  }
}
