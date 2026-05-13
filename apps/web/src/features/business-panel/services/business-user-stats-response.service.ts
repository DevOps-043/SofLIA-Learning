import type {
  BusinessUserStatsApiResponse,
  BusinessUserStatsCertificate,
  BusinessUserStatsCompletedByMonthPoint,
  BusinessUserStatsCourseData,
  BusinessUserStatsTimeByCoursePoint,
  CourseWithLessons,
  LessonDetail,
} from '../types/business-user-stats.types'
import type {
  BusinessUserStatsActivityCompletionRecord,
  BusinessUserStatsAssignmentRecord,
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsInstructorRecord,
  BusinessUserStatsLiaConversationRecord,
  BusinessUserStatsLiaMessageRecord,
  BusinessUserStatsLessonCountRecord,
  BusinessUserStatsLessonNoteRecord,
  BusinessUserStatsLessonProgressRecord,
  BusinessUserStatsLessonRecord,
  BusinessUserStatsOrganizationUserRecord,
  BusinessUserStatsQueryData,
  BusinessUserStatsQuizSubmissionRecord,
} from './business-user-stats-query.service'
import { unwrapRelation } from './business-user-stats-query.service'

export function buildBusinessUserStatsResponse(
  data: BusinessUserStatsQueryData,
): BusinessUserStatsApiResponse {
  const user = getUserProfile(data.organizationUser)
  const lessonInfoById = createLessonInfoById(data.lessons)
  const courseModuleIdsByCourse = createCourseModuleIdsByCourse(data.courseModules)
  const realLessonsByCourse = createRealLessonsByCourse(
    courseModuleIdsByCourse,
    data.lessonCounts,
  )
  const instructorMap = createInstructorMap(data.instructors)
  const enrichedCertificates = buildEnrichedCertificates(data, instructorMap)
  const courseStatsMap = createCourseStatsMap(
    data.enrollments,
    enrichedCertificates,
    data.assignments,
  )

  const courseIdByLessonId = new Map<string, string>()
  data.lessonProgress.forEach((progress) => {
    const enrollment = unwrapRelation(progress.user_course_enrollments)
    if (progress.lesson_id && enrollment?.course_id) {
      courseIdByLessonId.set(progress.lesson_id, enrollment.course_id)
    }
  })

  applyLiaStats(courseStatsMap, data.liaConversations, data.liaMessages)
  applyQuizStats(courseStatsMap, data.quizSubmissions)
  applyActivityStats(courseStatsMap, data.activityCompletions)
  applyNotesStats(courseStatsMap, data.lessonNotes, courseIdByLessonId)
  applyLessonProgressStats(courseStatsMap, data.lessonProgress, realLessonsByCourse)
  applyModuleStats(courseStatsMap, data.courseModules, data.lessonProgress, lessonInfoById)

  const coursesData = Array.from(courseStatsMap.values())
  const totalCourses = coursesData.length
  const completedCourses = coursesData.filter(isCompletedCourseStats).length
  const inProgressCourses = coursesData.filter(isInProgressCourseStats).length
  const notStartedCourses = Math.max(totalCourses - completedCourses - inProgressCourses, 0)
  const averageProgress =
    totalCourses > 0
      ? coursesData.reduce(
          (sum, course) => sum + (Number(course.progress) || 0),
          0,
        ) / totalCourses
      : 0
  const totalTimeSpent = data.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes || 0),
    0,
  )
  const completedLessons = data.lessonProgress.filter((progress) => progress.is_completed).length
  const totalLessons = Array.from(realLessonsByCourse.values()).reduce(
    (sum, count) => sum + count,
    0,
  )
  const timeByCourse = buildTimeByCourse(coursesData)
  const completedByMonth = buildCompletedByMonth(data.enrollments, data.assignments)
  const coursesWithLessons = buildLessonDetailByCourse(data)

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name:
        user.display_name ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        user.username,
      profile_picture_url: user.profile_picture_url,
    },
    stats: {
      total_courses: totalCourses,
      completed_courses: completedCourses,
      in_progress_courses: inProgressCourses,
      not_started_courses: notStartedCourses,
      average_progress: Math.round(averageProgress * 10) / 10,
      total_time_spent_minutes: totalTimeSpent,
      total_time_spent_hours: Math.round((totalTimeSpent / 60) * 10) / 10,
      completed_lessons: completedLessons,
      total_lessons: totalLessons,
      certificates_count: enrichedCertificates.length,
      notes_count: data.lessonNotes.length,
      total_assignments: data.assignments.length,
      completed_assignments: data.assignments.filter(
        (assignment) => assignment.status === 'completed',
      ).length,
      lia_conversations_total: data.liaConversations.length,
      lia_messages_total: data.liaMessages.length,
      quiz_total: data.quizSubmissions.length,
      quiz_passed: data.quizSubmissions.filter((submission) => submission.is_passed).length,
      quiz_failed: data.quizSubmissions.filter((submission) => !submission.is_passed).length,
      quiz_average_score:
        data.quizSubmissions.length > 0
          ? Math.round(
              (data.quizSubmissions.reduce(
                (sum, submission) => sum + (Number(submission.percentage_score) || 0),
                0,
              ) /
                data.quizSubmissions.length) *
                10,
            ) / 10
          : 0,
      lia_activities_completed: data.activityCompletions.filter(
        (activity) => activity.status === 'completed',
      ).length,
      lia_activities_total: data.activityCompletions.length,
      courses_data: coursesData,
      courses_with_lessons: coursesWithLessons,
      time_by_course: timeByCourse,
      completed_by_month: completedByMonth,
      distribution: {
        completed: completedCourses,
        in_progress: inProgressCourses,
        not_started: notStartedCourses,
      },
    },
    courses: coursesData,
    courses_with_lessons: coursesWithLessons,
    certificates: enrichedCertificates,
    assignments: data.assignments.map((assignment) => ({
      assignment_id: assignment.id,
      course_id: assignment.course_id,
      course_title: unwrapRelation(assignment.courses)?.title || 'Curso desconocido',
      status: assignment.status,
      completion_percentage: assignment.completion_percentage || 0,
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date,
      completed_at: assignment.completed_at,
    })),
  }
}

function getUserProfile(organizationUser: BusinessUserStatsOrganizationUserRecord) {
  const user = unwrapRelation(organizationUser.users)

  if (!user) {
    throw new Error('No se encontró el perfil del usuario')
  }

  return user
}

function createLessonInfoById(records: BusinessUserStatsLessonRecord[]) {
  return records.reduce((map, record) => {
    map.set(record.lesson_id, record)
    return map
  }, new Map<string, BusinessUserStatsLessonRecord>())
}

function createCourseModuleIdsByCourse(records: BusinessUserStatsCourseModuleRecord[]) {
  const map = new Map<string, string[]>()

  records.forEach((record) => {
    const moduleIds = map.get(record.course_id)
    if (moduleIds) {
      moduleIds.push(record.module_id)
    } else {
      map.set(record.course_id, [record.module_id])
    }
  })

  return map
}

function createRealLessonsByCourse(
  courseModuleIdsByCourse: Map<string, string[]>,
  lessonCounts: BusinessUserStatsLessonCountRecord[],
) {
  const lessonCountByModule = lessonCounts.reduce((map, record) => {
    map.set(record.module_id, (map.get(record.module_id) || 0) + 1)
    return map
  }, new Map<string, number>())

  return Array.from(courseModuleIdsByCourse.entries()).reduce((map, [courseId, moduleIds]) => {
    map.set(
      courseId,
      moduleIds.reduce((sum, moduleId) => sum + (lessonCountByModule.get(moduleId) || 0), 0),
    )
    return map
  }, new Map<string, number>())
}

function createInstructorMap(records: BusinessUserStatsInstructorRecord[]) {
  return records.reduce((map, instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    map.set(instructor.id, {
      name: fullName || instructor.username || 'Instructor',
      username: instructor.username,
    })
    return map
  }, new Map<string, { name: string; username: string | null }>())
}

function buildEnrichedCertificates(
  data: Pick<BusinessUserStatsQueryData, 'certificates'>,
  instructorMap: Map<string, { name: string; username: string | null }>,
): BusinessUserStatsCertificate[] {
  return data.certificates.map((certificate) => {
    const course = unwrapRelation(certificate.courses)
    const instructor = course?.instructor_id
      ? instructorMap.get(course.instructor_id)
      : null

    return {
      certificate_id: certificate.certificate_id,
      certificate_url: certificate.certificate_url,
      certificate_hash: certificate.certificate_hash,
      course_id: certificate.course_id,
      issued_at: certificate.issued_at,
      expires_at: certificate.expires_at,
      course_title: course?.title || 'Curso sin título',
      course_slug: course?.slug || '',
      course_thumbnail: course?.thumbnail_url || null,
      instructor_name: instructor?.name || 'Instructor',
      instructor_username: instructor?.username || null,
    }
  })
}

function createCourseStatsMap(
  enrollments: BusinessUserStatsQueryData['enrollments'],
  certificates: BusinessUserStatsCertificate[],
  assignments: BusinessUserStatsAssignmentRecord[],
) {
  const map = new Map<string, BusinessUserStatsCourseData>()

  enrollments.forEach((enrollment) => {
    const course = unwrapRelation(enrollment.courses)
    const progress = normalizeCourseProgress(
      enrollment.enrollment_status,
      Number(enrollment.overall_progress_percentage) || 0,
    )

    map.set(
      enrollment.course_id,
      createEmptyCourseStats({
        courseId: enrollment.course_id,
        title: course?.title,
        progress,
        status: normalizeCourseStatus(enrollment.enrollment_status, progress),
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        hasCertificate: certificates.some(
          (certificate) => certificate.course_id === enrollment.course_id,
        ),
      }),
    )
  })

  assignments.forEach((assignment) => {
    const existing = map.get(assignment.course_id)
    const assignmentProgress = normalizeCourseProgress(
      assignment.status,
      Number(assignment.completion_percentage) || 0,
    )
    const assignmentStatus = normalizeCourseStatus(assignment.status, assignmentProgress)

    if (existing) {
      existing.is_assigned = true
      existing.assignment_status = assignment.status
      existing.assigned_at = assignment.assigned_at
      existing.due_date = assignment.due_date

      if (assignmentProgress > existing.progress) {
        existing.progress = assignmentProgress
      }

      if (assignmentStatus === 'completed') {
        existing.status = 'completed'
        existing.completed_at = existing.completed_at || assignment.completed_at
      }

      return
    }

    const course = unwrapRelation(assignment.courses)
    map.set(
      assignment.course_id,
      createEmptyCourseStats({
        courseId: assignment.course_id,
        title: course?.title,
        progress: assignmentProgress,
        status: assignmentStatus,
        enrolledAt: null,
        assignedAt: assignment.assigned_at,
        dueDate: assignment.due_date,
        completedAt: assignment.completed_at,
        assignmentStatus: assignment.status,
        isAssigned: true,
        hasCertificate: certificates.some(
          (certificate) => certificate.course_id === assignment.course_id,
        ),
      }),
    )
  })

  return map
}

function createEmptyCourseStats({
  courseId,
  title,
  progress,
  status,
  enrolledAt,
  assignedAt,
  dueDate,
  completedAt,
  assignmentStatus,
  isAssigned = false,
  hasCertificate,
}: {
  courseId: string
  title: string | null | undefined
  progress: number
  status: string
  enrolledAt: string | null
  assignedAt?: string | null
  dueDate?: string | null
  completedAt: string | null
  assignmentStatus?: string | null
  isAssigned?: boolean
  hasCertificate: boolean
}): BusinessUserStatsCourseData {
  return {
    course_id: courseId,
    course_title: title || 'Curso desconocido',
    progress,
    status,
    assignment_status: assignmentStatus,
    enrolled_at: enrolledAt,
    assigned_at: assignedAt,
    due_date: dueDate,
    completed_at: completedAt,
    is_assigned: isAssigned,
    has_certificate: hasCertificate,
    lia_conversations_count: 0,
    lia_messages_count: 0,
    lia_avg_duration_minutes: 0,
    lia_last_conversation: null,
    quiz_total: 0,
    quiz_passed: 0,
    quiz_failed: 0,
    quiz_average_score: 0,
    quiz_best_score: 0,
    quiz_total_attempts: 0,
    lia_activities_completed: 0,
    notes_count: 0,
    time_spent_minutes: 0,
    modules_total: 0,
    modules_completed: 0,
    lessons_total: 0,
    lessons_completed: 0,
    lessons_in_progress: 0,
    activities_completed: 0,
    activities_total: 0,
    readings_viewed: 0,
    quiz_lessons_completed: 0,
  }
}

function normalizeCourseStatus(status: string | null, progress: number): string {
  if (status === 'completed' || progress >= 100) return 'completed'
  if (status === 'active' || status === 'in_progress' || progress > 0) return 'active'
  return status || 'assigned'
}

function normalizeCourseProgress(status: string | null, progress: number): number {
  const boundedProgress = Math.min(Math.max(progress, 0), 100)
  if (status === 'completed') return 100
  return boundedProgress
}

function isCompletedCourseStats(course: BusinessUserStatsCourseData): boolean {
  return course.status === 'completed' || course.progress >= 100
}

function isInProgressCourseStats(course: BusinessUserStatsCourseData): boolean {
  return !isCompletedCourseStats(course) && course.progress > 0
}

function applyLiaStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  conversations: BusinessUserStatsLiaConversationRecord[],
  messages: BusinessUserStatsLiaMessageRecord[],
) {
  const durationsByCourse = new Map<string, number[]>()
  const messagesByConversation = messages.reduce((map, message) => {
    map.set(message.conversation_id, (map.get(message.conversation_id) || 0) + 1)
    return map
  }, new Map<string, number>())

  conversations.forEach((conversation) => {
    if (!conversation.course_id || !courseStatsMap.has(conversation.course_id)) return

    const stats = courseStatsMap.get(conversation.course_id)
    if (!stats) return

    stats.lia_conversations_count = (stats.lia_conversations_count || 0) + 1
    stats.lia_messages_count =
      (stats.lia_messages_count || 0) +
      (conversation.total_messages ?? messagesByConversation.get(conversation.conversation_id) ?? 0)

    if (conversation.started_at && conversation.ended_at) {
      const duration =
        (new Date(conversation.ended_at).getTime() - new Date(conversation.started_at).getTime()) /
        (1000 * 60)

      const durations = durationsByCourse.get(conversation.course_id)
      if (durations) {
        durations.push(duration)
      } else {
        durationsByCourse.set(conversation.course_id, [duration])
      }
    }

    if (conversation.started_at) {
      const lastConversation = stats.lia_last_conversation
      if (
        !lastConversation ||
        new Date(conversation.started_at).getTime() > new Date(lastConversation).getTime()
      ) {
        stats.lia_last_conversation = conversation.started_at
      }
    }
  })

  durationsByCourse.forEach((durations, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats || durations.length === 0) return

    stats.lia_avg_duration_minutes =
      Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10
  })
}

function applyQuizStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  submissions: BusinessUserStatsQuizSubmissionRecord[],
) {
  const quizStatsByCourse = new Map<
    string,
    { total: number; passed: number; failed: number; scores: number[]; attempts: number }
  >()

  submissions.forEach((submission) => {
    const courseId = unwrapRelation(submission.user_course_enrollments)?.course_id
    if (!courseId || !courseStatsMap.has(courseId)) return

    const stats = quizStatsByCourse.get(courseId) || {
      total: 0,
      passed: 0,
      failed: 0,
      scores: [],
      attempts: 0,
    }

    stats.total += 1
    stats.attempts += 1
    if (submission.is_passed) stats.passed += 1
    else stats.failed += 1
    if (submission.percentage_score !== null && submission.percentage_score !== undefined) {
      stats.scores.push(Number(submission.percentage_score))
    }

    quizStatsByCourse.set(courseId, stats)
  })

  quizStatsByCourse.forEach((quizStats, courseId) => {
    const courseStats = courseStatsMap.get(courseId)
    if (!courseStats) return

    courseStats.quiz_total = quizStats.total
    courseStats.quiz_passed = quizStats.passed
    courseStats.quiz_failed = quizStats.failed
    courseStats.quiz_total_attempts = quizStats.attempts
    if (quizStats.scores.length > 0) {
      courseStats.quiz_average_score =
        Math.round(
          (quizStats.scores.reduce((sum, value) => sum + value, 0) / quizStats.scores.length) *
            10,
        ) / 10
      courseStats.quiz_best_score = Math.max(...quizStats.scores)
    }
  })
}

function applyActivityStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  completions: BusinessUserStatsActivityCompletionRecord[],
) {
  completions.forEach((completion) => {
    const activity = unwrapRelation(completion.lesson_activities)
    const courseId = unwrapRelation(activity?.course_lessons)?.course_modules
    const resolvedCourseId = unwrapRelation(courseId)?.course_id

    if (!resolvedCourseId || !courseStatsMap.has(resolvedCourseId)) return

    const stats = courseStatsMap.get(resolvedCourseId)
    if (!stats) return

    stats.activities_total = (stats.activities_total || 0) + 1
    if (completion.status === 'completed') {
      stats.activities_completed = (stats.activities_completed || 0) + 1
      stats.lia_activities_completed = (stats.lia_activities_completed || 0) + 1
    }
  })
}

function applyNotesStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  notes: BusinessUserStatsLessonNoteRecord[],
  courseIdByLessonId: Map<string, string>,
) {
  notes.forEach((note) => {
    const noteCourseId =
      unwrapRelation(unwrapRelation(note.course_lessons)?.course_modules)?.course_id ||
      (note.lesson_id ? courseIdByLessonId.get(note.lesson_id) : null)

    if (!noteCourseId || !courseStatsMap.has(noteCourseId)) return

    const stats = courseStatsMap.get(noteCourseId)
    if (!stats) return

    stats.notes_count = (stats.notes_count || 0) + 1
    stats.readings_viewed = (stats.readings_viewed || 0) + 1
  })
}

function applyLessonProgressStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  progressRecords: BusinessUserStatsLessonProgressRecord[],
  realLessonsByCourse: Map<string, number>,
) {
  const lessonStatsByCourse = new Map<
    string,
    { total: number; completed: number; inProgress: number; quizCompleted: number }
  >()

  progressRecords.forEach((progress) => {
    const courseId = unwrapRelation(progress.user_course_enrollments)?.course_id
    if (!courseId || !courseStatsMap.has(courseId)) return

    const stats = courseStatsMap.get(courseId)
    if (!stats) return

    stats.time_spent_minutes = (stats.time_spent_minutes || 0) + (progress.time_spent_minutes || 0)

    const courseLessonStats = lessonStatsByCourse.get(courseId) || {
      total: 0,
      completed: 0,
      inProgress: 0,
      quizCompleted: 0,
    }

    courseLessonStats.total += 1
    if (progress.is_completed) courseLessonStats.completed += 1
    else if (progress.lesson_status === 'in_progress' || progress.started_at) {
      courseLessonStats.inProgress += 1
    }
    if (progress.quiz_completed && progress.quiz_passed) {
      courseLessonStats.quizCompleted += 1
    }

    lessonStatsByCourse.set(courseId, courseLessonStats)
  })

  lessonStatsByCourse.forEach((courseLessonStats, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats) return

    stats.lessons_total = realLessonsByCourse.get(courseId) || courseLessonStats.total
    stats.lessons_completed = courseLessonStats.completed
    stats.lessons_in_progress = courseLessonStats.inProgress
    stats.quiz_lessons_completed = courseLessonStats.quizCompleted
  })

  realLessonsByCourse.forEach((totalLessons, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (stats && !stats.lessons_total) {
      stats.lessons_total = totalLessons
    }
  })
}

function applyModuleStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  courseModules: BusinessUserStatsCourseModuleRecord[],
  progressRecords: BusinessUserStatsLessonProgressRecord[],
  lessonInfoById: Map<string, BusinessUserStatsLessonRecord>,
) {
  const moduleStatsByCourse = new Map<string, { total: number; completedModules: Set<string> }>()

  courseModules.forEach((module) => {
    const stats = moduleStatsByCourse.get(module.course_id) || {
      total: 0,
      completedModules: new Set<string>(),
    }
    stats.total += 1
    moduleStatsByCourse.set(module.course_id, stats)
  })

  progressRecords.forEach((progress) => {
    const courseId = unwrapRelation(progress.user_course_enrollments)?.course_id
    const moduleId = lessonInfoById.get(progress.lesson_id)?.module_id
    if (!courseId || !moduleId) return

    const stats = moduleStatsByCourse.get(courseId) || {
      total: 0,
      completedModules: new Set<string>(),
    }

    if (progress.is_completed) {
      stats.completedModules.add(moduleId)
    }

    moduleStatsByCourse.set(courseId, stats)
  })

  moduleStatsByCourse.forEach((moduleStats, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats) return

    stats.modules_total = moduleStats.total
    stats.modules_completed = moduleStats.completedModules.size
  })
}

function buildTimeByCourse(
  coursesData: BusinessUserStatsCourseData[],
): BusinessUserStatsTimeByCoursePoint[] {
  return coursesData.map((course) => ({
    course_id: course.course_id,
    course_title: course.course_title,
    total_minutes: course.time_spent_minutes || 0,
    total_hours: Math.round(((course.time_spent_minutes || 0) / 60) * 10) / 10,
  }))
}

function buildCompletedByMonth(
  enrollments: BusinessUserStatsQueryData['enrollments'],
  assignments: BusinessUserStatsAssignmentRecord[],
): BusinessUserStatsCompletedByMonthPoint[] {
  const completedAtByCourse = new Map<string, string>()

  enrollments.forEach((enrollment) => {
    if (enrollment.completed_at) {
      completedAtByCourse.set(enrollment.course_id, enrollment.completed_at)
    }
  })

  assignments.forEach((assignment) => {
    if (assignment.completed_at && !completedAtByCourse.has(assignment.course_id)) {
      completedAtByCourse.set(assignment.course_id, assignment.completed_at)
    }
  })

  const countByMonth = Array.from(completedAtByCourse.values()).reduce((map, completedAt) => {
    const date = new Date(completedAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    map.set(monthKey, (map.get(monthKey) || 0) + 1)
    return map
  }, new Map<string, number>())

  return Array.from(countByMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((left, right) => left.month.localeCompare(right.month))
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-lesson detail builder
// ─────────────────────────────────────────────────────────────────────────────

function buildLessonDetailByCourse(data: BusinessUserStatsQueryData): CourseWithLessons[] {
  // Index lesson progress by lesson_id for O(1) lookup
  const progressByLesson = new Map<string, BusinessUserStatsLessonProgressRecord>()
  data.lessonProgress.forEach((p) => {
    progressByLesson.set(p.lesson_id, p)
  })

  // Index lesson metadata by lesson_id
  const lessonMetaById = new Map<string, BusinessUserStatsLessonRecord>()
  data.lessons.forEach((l) => {
    lessonMetaById.set(l.lesson_id, l)
  })

  // Count lia_conversations per lesson_id
  const liaConvByLesson = new Map<string, number>()
  const liaMsgByLesson = new Map<string, number>()
  data.liaConversations.forEach((conv) => {
    if (!conv.lesson_id) return
    liaConvByLesson.set(conv.lesson_id, (liaConvByLesson.get(conv.lesson_id) ?? 0) + 1)
    liaMsgByLesson.set(
      conv.lesson_id,
      (liaMsgByLesson.get(conv.lesson_id) ?? 0) + (conv.total_messages ?? 0),
    )
  })

  // Count user_lesson_notes per lesson_id
  const notesByLesson = new Map<string, number>()
  data.lessonNotes.forEach((note) => {
    if (!note.lesson_id) return
    notesByLesson.set(note.lesson_id, (notesByLesson.get(note.lesson_id) ?? 0) + 1)
  })

  // Count quiz submissions per lesson_id (take best score if multiple attempts)
  const quizByLesson = new Map<string, { passed: boolean; score: number | null }>()
  data.quizSubmissions.forEach((q) => {
    if (!q.lesson_id) return
    const existing = quizByLesson.get(q.lesson_id)
    const score = q.percentage_score ?? null
    if (!existing || (score ?? 0) > (existing.score ?? 0)) {
      quizByLesson.set(q.lesson_id, {
        passed: q.is_passed ?? false,
        score,
      })
    }
  })

  // Group lessons by course_id using lesson metadata
  const lessonsByCourse = new Map<string, BusinessUserStatsLessonRecord[]>()
  data.lessons.forEach((lesson) => {
    const module = unwrapRelation(lesson.course_modules)
    const courseId = module?.course_id
    if (!courseId) return
    if (!lessonsByCourse.has(courseId)) lessonsByCourse.set(courseId, [])
    lessonsByCourse.get(courseId)!.push(lesson)
  })

  // Build one CourseWithLessons per enrolled course
  const result: CourseWithLessons[] = []

  data.enrollments.forEach((enrollment) => {
    const courseId = enrollment.course_id
    const courseTitle = unwrapRelation(enrollment.courses)?.title ?? null
    const courseLessons = lessonsByCourse.get(courseId) ?? []

    const lessons: LessonDetail[] = courseLessons
      .map((lesson): LessonDetail => {
        const meta = lessonMetaById.get(lesson.lesson_id)
        const module = unwrapRelation(meta?.course_modules ?? lesson.course_modules)
        const progress = progressByLesson.get(lesson.lesson_id)
        const liaCalls = liaConvByLesson.get(lesson.lesson_id) ?? 0
        const liaMsg = liaMsgByLesson.get(lesson.lesson_id) ?? 0
        const quiz = quizByLesson.get(lesson.lesson_id)

        const videoPct = progress?.video_progress_percentage ?? 0
        const actDone = progress?.required_activities_completed ?? 0
        const actTotal = progress?.required_activities_total ?? 0
        const status: 'not_started' | 'in_progress' | 'completed' =
          progress?.is_completed ? 'completed'
          : progress?.lesson_status === 'in_progress' ? 'in_progress'
          : 'not_started'

        return {
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_order: lesson.lesson_order_index ?? null,
          module_id: lesson.module_id ?? null,
          module_title: module?.module_title ?? null,
          module_order: module?.module_order_index ?? null,
          status,
          video_progress_pct: videoPct,
          video_watched: videoPct >= 80 || status === 'completed',
          activities_completed: actDone,
          activities_total: actTotal,
          activity_done: actTotal > 0 ? actDone >= actTotal : false,
          quiz_completed: progress?.quiz_completed ?? false,
          quiz_passed: quiz?.passed ?? null,
          quiz_score: quiz?.score ?? null,
          lia_conversations: liaCalls,
          lia_messages: liaMsg,
          notes_count: notesByLesson.get(lesson.lesson_id) ?? 0,
          time_spent_minutes: progress?.time_spent_minutes ?? 0,
        }
      })
      .sort((a, b) => {
        const modDiff = (a.module_order ?? 99) - (b.module_order ?? 99)
        if (modDiff !== 0) return modDiff
        return (a.lesson_order ?? 99) - (b.lesson_order ?? 99)
      })

    result.push({ course_id: courseId, course_title: courseTitle, lessons })
  })

  return result
}
