import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import { logger } from '@/lib/utils/logger'
import type {
  BusinessUserAnalyticsAiSample,
  BusinessUserAnalyticsBreakdownItem,
  BusinessUserAnalyticsDataset,
  BusinessUserAnalyticsPeriod,
  BusinessUserAnalyticsRange,
  BusinessUserAnalyticsTrendPoint,
} from '../../types/business-user-analytics.types'
import {
  buildBreakdown,
  buildConnectionCalendar,
  buildPeriodKey,
  buildPeriodTrend,
  calculateAverage,
  calculatePercentage,
  calculateQualityScore,
  clampPercentage,
  getProgressBand,
  incrementMap,
} from '../reports-analytics/reports-analytics.helpers'

type BusinessUserAnalyticsSupabaseClient = SupabaseClient<Database>
type Relation<T> = T | T[] | null

interface FetchBusinessUserAnalyticsParams {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
}

interface CourseRelationRecord {
  id: string
  title: string | null
}

interface AssignmentRecord {
  id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
}

interface EnrollmentRecord {
  enrollment_id: string
  course_id: string
  organization_id: string | null
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
}

interface LessonProgressRecord {
  progress_id: string
  enrollment_id: string
  lesson_id: string
  organization_id: string | null
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_activity_submission_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  activity_progress_percentage: number | null
  quiz_progress_percentage: number | null
  required_activities_completed: number | null
  required_activities_total: number | null
}

interface CourseLessonRecord {
  lesson_id: string
  duration_seconds: number | null
  total_duration_minutes: number | null
  course_modules: Relation<{
    course_id: string | null
  }>
}

interface LessonActivityRecord {
  activity_id: string
  lesson_id: string
  is_required: boolean | null
  estimated_time_minutes: number | null
}

interface ActivitySubmissionRecord {
  submission_id: string
  course_id: string
  enrollment_id: string
  activity_id: string
  organization_id: string | null
  status: string
  response_text: string | null
  response_payload: Json
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string
  updated_at: string
}

interface ActivityCompletionRecord {
  completion_id: string
  activity_id: string
  organization_id: string | null
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  completed_at: string | null
  started_at: string | null
  updated_at: string | null
  lesson_activities: Relation<{
    activity_id: string
    lesson_id: string | null
    course_lessons: Relation<{
      lesson_id: string
      course_modules: Relation<{
        course_id: string | null
      }>
    }>
  }>
}

interface ActivityEvaluationRecord {
  submission_id: string
  result_status: string
  feedback_payload: Json
  model_name: string | null
  created_at: string
}

interface LiaConversationRecord {
  conversation_id: string
  course_id: string | null
  organization_id: string | null
  context_type: string
  conversation_completed: boolean | null
  started_at: string
  ended_at: string | null
  created_at: string | null
  updated_at: string | null
  total_messages: number | null
  total_lia_messages: number | null
  total_user_messages: number | null
}

interface LiaMessageRecord {
  message_id: string
  conversation_id: string
  role: string
  content: string
  message_sequence: number | null
  created_at: string | null
  contains_question: boolean | null
  response_time_ms: number | null
  is_off_topic: boolean | null
  lia_redirected: boolean | null
  lia_provided_example: boolean | null
  sentiment_score: number | null
  tokens_used: number | null
}

interface StudySessionRecord {
  id: string
  course_id: string | null
  organization_id: string | null
  status: string
  start_time: string
  end_time: string
  completed_at: string | null
  started_at: string | null
  duration_minutes: number | null
  actual_duration_minutes: number | null
  was_rescheduled: boolean | null
  updated_at: string
}

interface LessonNoteRecord {
  note_id: string
  lesson_id: string
  organization_id: string | null
  note_title: string
  note_content: string
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
}

interface QuizSubmissionRecord {
  submission_id: string
  enrollment_id: string
  organization_id: string | null
  percentage_score: number | null
  score: number | null
  total_points: number | null
  user_answers: Json
  is_passed: boolean | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface CertificateRecord {
  certificate_id: string
  course_id: string
  organization_id: string | null
}

interface UserSessionRecord {
  id: string
  issued_at: string
}

interface LessonTrackingRecord {
  id: string
  lesson_id: string
  organization_id: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  last_activity_at: string | null
  t_lesson_minutes: number | null
  t_video_minutes: number | null
  t_materials_minutes: number | null
  updated_at: string
}

interface AnalyticsScope {
  courseIds: Set<string>
  enrollmentIds: Set<string>
  lessonIds: Set<string>
}

interface QueryData {
  assignments: AssignmentRecord[]
  enrollments: EnrollmentRecord[]
  courseLessons: CourseLessonRecord[]
  lessonActivities: LessonActivityRecord[]
  lessonProgress: LessonProgressRecord[]
  activitySubmissions: ActivitySubmissionRecord[]
  activityCompletions: ActivityCompletionRecord[]
  activityEvaluations: ActivityEvaluationRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  studySessions: StudySessionRecord[]
  lessonNotes: LessonNoteRecord[]
  quizSubmissions: QuizSubmissionRecord[]
  certificates: CertificateRecord[]
  userSessions: UserSessionRecord[]
  lessonTracking: LessonTrackingRecord[]
}

const PERIOD_GRANULARITY = 'month' as const
const PAGE_LIMIT = 1000

export function normalizeBusinessUserAnalyticsRange(
  value: string | null | undefined,
): BusinessUserAnalyticsRange {
  if (value === '30d' || value === '90d' || value === '180d' || value === '365d') {
    return value
  }

  return '365d'
}

export function buildBusinessUserAnalyticsPeriod(range: BusinessUserAnalyticsRange): BusinessUserAnalyticsPeriod {
  const daysByRange: Record<BusinessUserAnalyticsRange, number> = {
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  }
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (daysByRange[range] - 1))
  from.setUTCHours(0, 0, 0, 0)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    range,
  }
}

export async function fetchBusinessUserAnalyticsDataset({
  supabase,
  userId,
  organizationId,
  range,
}: FetchBusinessUserAnalyticsParams): Promise<BusinessUserAnalyticsDataset> {
  const period = buildBusinessUserAnalyticsPeriod(range)
  const data = await fetchQueryData(supabase, userId, organizationId, period)
  const courseTitleById = buildCourseTitleMap(data.assignments)
  const enrollmentCourseById = new Map(data.enrollments.map((enrollment) => [enrollment.enrollment_id, enrollment.course_id]))
  const certificateCourseIds = new Set(data.certificates.map((certificate) => certificate.course_id))
  const contributionDates = collectContributionDates(data, period)
  const activeDateKeys = uniqueDateKeys(contributionDates)
  const lessonProgressByCourse = groupLessonProgressByCourse(data.lessonProgress, enrollmentCourseById)
  const lessonTrackingByCourse = groupLessonTrackingByCourse(data.lessonTracking, data.courseLessons)
  const courseLessonsByCourse = groupCourseLessonsByCourse(data.courseLessons)
  const courseLessonCountByCourse = buildCourseLessonCountByCourse(data.courseLessons)
  const evaluationsBySubmission = buildLatestEvaluationBySubmission(data.activityEvaluations)
  const completedCourseIds = buildCompletedCourseIds(data.assignments, data.enrollments)

  const courseRows = data.assignments.map((assignment) => {
    const enrollment = data.enrollments.find((item) => item.course_id === assignment.course_id)
    const progress = clampPercentage(
      Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0),
    )
    const courseLessonProgress = lessonProgressByCourse.get(assignment.course_id) || []
    const courseLessonTracking = lessonTrackingByCourse.get(assignment.course_id) || []
    const courseLessons = courseLessonsByCourse.get(assignment.course_id) || []
    const status = resolveCourseStatus(assignment.status, enrollment?.enrollment_status, progress)
    const completedLessonsFromProgress = courseLessonProgress.filter((item) => item.is_completed || item.lesson_status === 'completed').length
    const publishedLessonCount = courseLessonCountByCourse.get(assignment.course_id) || completedLessonsFromProgress

    return {
      courseId: assignment.course_id,
      courseTitle: resolveCourseTitle(courseTitleById, assignment.course_id),
      progress,
      status,
      assignedAt: assignment.assigned_at,
      dueDate: assignment.due_date,
      completedAt: enrollment?.completed_at || assignment.completed_at,
      lastAccessedAt: getLatestDate([
        enrollment?.last_accessed_at,
        enrollment?.updated_at,
        ...courseLessonProgress.map((item) => item.last_accessed_at || item.updated_at),
        ...courseLessonTracking.map((item) => item.last_activity_at || item.completed_at || item.updated_at),
      ]),
      lessonsCompleted:
        status === 'completed' && publishedLessonCount > completedLessonsFromProgress
          ? publishedLessonCount
          : completedLessonsFromProgress,
      timeSpentMinutes: calculateStudyMinutes(
        courseLessonProgress,
        courseLessonTracking,
        courseLessons,
        data.lessonActivities,
        status === 'completed' || progress >= 100,
      ),
      hasCertificate: certificateCourseIds.has(assignment.course_id),
    }
  })

  const completedCourses = courseRows.filter((course) => course.progress >= 100 || course.status === 'completed').length
  const inProgressCourses = courseRows.filter((course) => course.progress > 0 && course.progress < 100).length
  const lessonsCompleted = courseRows.reduce((sum, course) => sum + course.lessonsCompleted, 0)
  const timeSpentMinutes = roundNumber(courseRows.reduce((sum, course) => sum + course.timeSpentMinutes, 0))

  const aiAdoption = buildAiAdoption(data, period)
  const planning = buildPlanning(data, period)
  const notes = buildNotes(data, period, lessonsCompleted)
  const activities = buildActivities(data, period, evaluationsBySubmission, completedCourseIds)
  const quizzes = buildQuizzes(data, period)
  const quality = buildQuality({
    averageCourseProgress: calculateAverage(courseRows.map((course) => course.progress)),
    activitiesScore: activities.averageQualityScore,
    sofliaScore: aiAdoption.questionQualityScore,
    notesScore: notes.notesScore,
    quizScore: quizzes.averageScore,
    evidenceCount:
      data.lessonProgress.length +
      data.activitySubmissions.length +
      data.activityCompletions.length +
      data.liaMessages.length +
      data.lessonNotes.length +
      data.quizSubmissions.length +
      data.lessonTracking.length,
  })

  const datasetWithoutHash = {
    success: true as const,
    generatedAt: new Date().toISOString(),
    period,
    overview: {
      totalAssigned: courseRows.length,
      inProgressCourses,
      completedCourses,
      certificates: data.certificates.length,
      averageProgress: calculateAverage(courseRows.map((course) => course.progress)),
      completionRate: calculatePercentage(completedCourses, courseRows.length),
      lessonsCompleted,
      timeSpentMinutes,
      activeDays: activeDateKeys.length,
      currentStreak: calculateCurrentStreak(activeDateKeys),
      longestStreak: calculateLongestStreak(activeDateKeys),
      lastActivityAt: getLatestDate(contributionDates),
      qualityScore: quality.overallScore,
    },
    learning: {
      courses: courseRows,
      progressDistribution: buildCourseProgressDistribution(courseRows.map((course) => course.progress)),
      completionsTrend: buildTrend(
        data.assignments
          .map((assignment) => getCourseCompletionDate(assignment, data.enrollments))
          .filter((value): value is string => Boolean(value)),
        period,
      ),
      lessonTrend: buildTrend(
        data.lessonProgress
          .filter((item) => item.is_completed || item.lesson_status === 'completed')
          .map((item) => item.completed_at || item.updated_at)
          .filter((value): value is string => Boolean(value)),
        period,
      ),
    },
    aiAdoption,
    planning,
    notes,
    activities,
    quizzes,
    quality,
    contributionCalendar: buildConnectionCalendar(contributionDates, buildBusinessUserAnalyticsPeriod('365d')),
    aiSamples: buildAiSamples(data, courseTitleById, enrollmentCourseById, evaluationsBySubmission),
  }

  return {
    ...datasetWithoutHash,
    dataHash: hashAnalyticsPayload(datasetWithoutHash),
  }
}

async function fetchQueryData(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
): Promise<QueryData> {
  const [assignments, allEnrollments, allCertificates, userSessions] = await Promise.all([
    fetchAssignments(supabase, userId, organizationId),
    fetchEnrollments(supabase, userId),
    fetchCertificates(supabase, userId),
    fetchUserSessions(supabase, userId, buildBusinessUserAnalyticsPeriod('365d')),
  ])
  const assignedCourseIds = new Set(assignments.map((assignment) => assignment.course_id))
  const enrollments = allEnrollments.filter((enrollment) =>
    enrollment.organization_id === organizationId || assignedCourseIds.has(enrollment.course_id),
  )
  const courseIds = new Set([
    ...assignedCourseIds,
    ...enrollments.map((enrollment) => enrollment.course_id),
  ])
  const courseLessons = await fetchCourseLessons(supabase, Array.from(courseIds))
  const scope = buildAnalyticsScope(assignments, enrollments, courseLessons)
  const lessonActivities = await fetchLessonActivities(supabase, Array.from(scope.lessonIds))
  const certificates = allCertificates.filter((certificate) =>
    certificate.organization_id === organizationId || scope.courseIds.has(certificate.course_id),
  )

  const [
    lessonProgress,
    activitySubmissions,
    activityCompletions,
    liaConversations,
    studySessions,
    lessonNotes,
    quizSubmissions,
    lessonTracking,
  ] = await Promise.all([
    fetchLessonProgress(supabase, userId, scope),
    fetchActivitySubmissions(supabase, userId, scope),
    fetchActivityCompletions(supabase, userId, organizationId, scope),
    fetchLiaConversations(supabase, userId, organizationId, scope),
    fetchStudySessions(supabase, userId, organizationId, scope),
    fetchLessonNotes(supabase, userId, organizationId, scope),
    fetchQuizSubmissions(supabase, userId, scope),
    fetchLessonTracking(supabase, userId, organizationId, scope),
  ])

  const [activityEvaluations, liaMessages] = await Promise.all([
    fetchActivityEvaluations(
      supabase,
      activitySubmissions.map((submission) => submission.submission_id),
    ),
    fetchLiaMessages(
      supabase,
      liaConversations.map((conversation) => conversation.conversation_id),
    ),
  ])

  return {
    assignments,
    enrollments,
    courseLessons,
    lessonActivities,
    lessonProgress,
    activitySubmissions,
    activityCompletions,
    activityEvaluations,
    liaConversations,
    liaMessages,
    studySessions,
    lessonNotes,
    quizSubmissions,
    certificates,
    userSessions,
    lessonTracking,
  }
}

async function fetchAssignments(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select(`
      id,
      course_id,
      status,
      completion_percentage,
      assigned_at,
      due_date,
      completed_at,
      updated_at,
      courses (
        id,
        title
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(PAGE_LIMIT)
    .returns<AssignmentRecord[]>()

  logQueryError('business user assignments', error)
  return data || []
}

async function fetchEnrollments(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, course_id, organization_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<EnrollmentRecord[]>()

  logQueryError('business user enrollments', error)
  return data || []
}

async function fetchCourseLessons(
  supabase: BusinessUserAnalyticsSupabaseClient,
  courseIds: string[],
) {
  if (courseIds.length === 0) return []

  const rows: CourseLessonRecord[] = []
  for (const chunk of chunkArray(courseIds, 200)) {
    const { data, error } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        duration_seconds,
        total_duration_minutes,
        course_modules!inner (
          course_id
        )
      `)
      .eq('is_published', true)
      .in('course_modules.course_id', chunk)
      .limit(PAGE_LIMIT)
      .returns<CourseLessonRecord[]>()

    logQueryError('business user course lessons', error)
    rows.push(...(data || []))
  }

  return rows
}

async function fetchLessonActivities(
  supabase: BusinessUserAnalyticsSupabaseClient,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) return []

  const rows: LessonActivityRecord[] = []
  for (const chunk of chunkArray(lessonIds, 200)) {
    const { data, error } = await supabase
      .from('lesson_activities')
      .select('activity_id, lesson_id, is_required, estimated_time_minutes')
      .in('lesson_id', chunk)
      .limit(PAGE_LIMIT)
      .returns<LessonActivityRecord[]>()

    logQueryError('business user lesson activities', error)
    rows.push(...(data || []))
  }

  return rows
}

async function fetchLessonProgress(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('progress_id, enrollment_id, lesson_id, organization_id, lesson_status, is_completed, time_spent_minutes, completed_at, started_at, last_activity_submission_at, last_accessed_at, updated_at, activity_progress_percentage, quiz_progress_percentage, required_activities_completed, required_activities_total')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<LessonProgressRecord[]>()

  logQueryError('business user lesson progress', error)
  return data || []
}

async function fetchActivitySubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_activity_submissions')
    .select('submission_id, course_id, enrollment_id, activity_id, organization_id, status, response_text, response_payload, submitted_at, last_validated_at, created_at, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<ActivitySubmissionRecord[]>()

  logQueryError('business user activity submissions', error)
  return data || []
}

async function fetchActivityCompletions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('lia_activity_completions')
    .select(`
      completion_id,
      activity_id,
      organization_id,
      status,
      completed_steps,
      total_steps,
      time_to_complete_seconds,
      attempts_to_complete,
      completed_at,
      started_at,
      updated_at,
      lesson_activities (
        activity_id,
        lesson_id,
        course_lessons (
          lesson_id,
          course_modules (
            course_id
          )
        )
      )
    `)
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<ActivityCompletionRecord[]>()

  logQueryError('business user SofLIA activity completions', error)

  return (data || []).filter((completion) => {
    const activityCourseId = getActivityCompletionCourseId(completion)
    const activityLessonId = unwrapRelation(completion.lesson_activities)?.lesson_id
    return (
      completion.organization_id === organizationId ||
      (activityCourseId ? scope.courseIds.has(activityCourseId) : false) ||
      (activityLessonId ? scope.lessonIds.has(activityLessonId) : false)
    )
  })
}

async function fetchActivityEvaluations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  submissionIds: string[],
) {
  if (submissionIds.length === 0) return []

  const rows: ActivityEvaluationRecord[] = []
  for (const chunk of chunkArray(submissionIds, 200)) {
    const { data, error } = await supabase
      .from('user_activity_evaluations')
      .select('submission_id, result_status, feedback_payload, model_name, created_at')
      .in('submission_id', chunk)
      .order('created_at', { ascending: false })
      .returns<ActivityEvaluationRecord[]>()

    logQueryError('business user activity evaluations', error)
    rows.push(...(data || []))
  }

  return rows
}

async function fetchLiaConversations(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('lia_conversations')
    .select('conversation_id, course_id, organization_id, context_type, conversation_completed, started_at, ended_at, created_at, updated_at, total_messages, total_lia_messages, total_user_messages')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<LiaConversationRecord[]>()

  logQueryError('business user SofLIA conversations', error)
  return (data || []).filter((conversation) =>
    conversation.organization_id === organizationId ||
    (conversation.course_id ? scope.courseIds.has(conversation.course_id) : false) ||
    (!conversation.organization_id && !conversation.course_id),
  )
}

async function fetchLiaMessages(
  supabase: BusinessUserAnalyticsSupabaseClient,
  conversationIds: string[],
) {
  if (conversationIds.length === 0) return []

  const rows: LiaMessageRecord[] = []
  for (const chunk of chunkArray(conversationIds, 200)) {
    const { data, error } = await supabase
      .from('lia_messages')
      .select('message_id, conversation_id, role, content, message_sequence, created_at, contains_question, response_time_ms, is_off_topic, lia_redirected, lia_provided_example, sentiment_score, tokens_used')
      .in('conversation_id', chunk)
      .order('created_at', { ascending: true })
      .returns<LiaMessageRecord[]>()

    logQueryError('business user SofLIA messages', error)
    rows.push(...(data || []))
  }

  return rows
}

async function fetchStudySessions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, course_id, organization_id, status, start_time, end_time, completed_at, started_at, duration_minutes, actual_duration_minutes, was_rescheduled, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<StudySessionRecord[]>()

  logQueryError('business user study sessions', error)
  return (data || []).filter((session) =>
    session.organization_id === organizationId ||
    (session.course_id ? scope.courseIds.has(session.course_id) : false),
  )
}

async function fetchLessonNotes(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select('note_id, lesson_id, organization_id, note_title, note_content, is_auto_generated, source_type, created_at, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<LessonNoteRecord[]>()

  logQueryError('business user lesson notes', error)
  return (data || []).filter((note) =>
    note.organization_id === organizationId ||
    scope.lessonIds.has(note.lesson_id),
  )
}

async function fetchQuizSubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_quiz_submissions')
    .select('submission_id, enrollment_id, organization_id, percentage_score, score, total_points, user_answers, is_passed, completed_at, created_at, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<QuizSubmissionRecord[]>()

  logQueryError('business user quiz submissions', error)
  return data || []
}

async function fetchCertificates(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_course_certificates')
    .select('certificate_id, course_id, organization_id')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<CertificateRecord[]>()

  logQueryError('business user certificates', error)
  return data || []
}

async function fetchLessonTracking(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.lessonIds.size === 0) return []

  const { data, error } = await supabase
    .from('lesson_tracking')
    .select('id, lesson_id, organization_id, status, started_at, completed_at, last_activity_at, t_lesson_minutes, t_video_minutes, t_materials_minutes, updated_at')
    .eq('user_id', userId)
    .in('lesson_id', Array.from(scope.lessonIds))
    .limit(PAGE_LIMIT)
    .returns<LessonTrackingRecord[]>()

  logQueryError('business user lesson tracking', error)
  return (data || []).filter((tracking) =>
    tracking.organization_id === organizationId ||
    tracking.organization_id === null ||
    scope.lessonIds.has(tracking.lesson_id),
  )
}

async function fetchUserSessions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('user_session')
    .select('id, issued_at')
    .eq('user_id', userId)
    .gte('issued_at', period.from)
    .lte('issued_at', period.to)
    .limit(PAGE_LIMIT)
    .returns<UserSessionRecord[]>()

  logQueryError('business user sessions', error)
  return data || []
}

function buildAiAdoption(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const userMessages = data.liaMessages.filter((message) => message.role === 'user')
  const liaMessages = data.liaMessages.filter((message) => message.role !== 'user')
  const questions = userMessages.filter(hasQuestionSignal).length
  const offTopic = userMessages.filter((message) => message.is_off_topic).length
  const redirects = data.liaMessages.filter((message) => message.lia_redirected).length
  const storedResponseTimes = data.liaMessages
    .map((message) => Number(message.response_time_ms))
    .filter((value) => Number.isFinite(value) && value > 0)
  const responseTimes = [
    ...storedResponseTimes,
    ...buildDerivedResponseTimes(data.liaMessages),
  ]
  const sentimentScores = data.liaMessages
    .map((message) => Number(message.sentiment_score))
    .filter((value) => Number.isFinite(value))
  const questionRate = calculatePercentage(questions, userMessages.length)
  const offTopicRate = calculatePercentage(offTopic, userMessages.length)
  const redirectRate = calculatePercentage(redirects, data.liaMessages.length)
  const averageSentiment = sentimentScores.length > 0 ? roundNumber(calculateAverage(sentimentScores), 2) : 0
  const sentimentScore = clampPercentage(50 + averageSentiment * 50)
  const questionQualityScore = userMessages.length > 0
    ? clampPercentage(60 + questionRate * 0.25 - offTopicRate * 0.45 - redirectRate * 0.2 + sentimentScore * 0.25)
    : 0
  const contextCounts = new Map<string, number>()
  data.liaConversations.forEach((conversation) => incrementMap(contextCounts, conversation.context_type || 'general'))

  return {
    totalConversations: data.liaConversations.length,
    totalMessages: data.liaMessages.length,
    userMessages: userMessages.length,
    liaMessages: liaMessages.length,
    adoptionScore: calculatePercentage(data.liaConversations.length, Math.max(1, data.assignments.length)),
    questionRate,
    offTopicRate,
    redirectRate,
    averageResponseTimeSeconds: calculateAverage(responseTimes.map((value) => value / 1000)),
    averageSentiment,
    questionQualityScore,
    contextBreakdown: buildBreakdown(contextCounts, data.liaConversations.length),
    messagesTrend: buildTrend(data.liaMessages.map((message) => message.created_at).filter((value): value is string => Boolean(value)), period),
  }
}

function buildPlanning(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const completed = data.studySessions.filter((session) => isCompletedStatus(session.status) || Boolean(session.completed_at)).length
  const missed = data.studySessions.filter((session) => ['missed', 'skipped', 'cancelled'].includes(session.status)).length
  const rescheduled = data.studySessions.filter((session) => session.was_rescheduled).length
  const statusCounts = new Map<string, number>()
  data.studySessions.forEach((session) => incrementMap(statusCounts, session.status || 'scheduled'))

  return {
    plannedSessions: data.studySessions.length,
    completedSessions: completed,
    missedSessions: missed,
    rescheduledSessions: rescheduled,
    adherenceRate: calculatePercentage(completed, data.studySessions.length),
    averagePlannedMinutes: calculateAverage(data.studySessions.map((session) => Number(session.duration_minutes) || 0)),
    averageActualMinutes: calculateAverage(data.studySessions.map((session) => Number(session.actual_duration_minutes) || 0)),
    byStatus: buildBreakdown(statusCounts, data.studySessions.length),
    sessionsTrend: buildTrend(data.studySessions.map((session) => session.completed_at || session.started_at || session.start_time), period),
  }
}

function buildNotes(data: QueryData, period: BusinessUserAnalyticsPeriod, lessonsCompleted: number) {
  const autoGenerated = data.lessonNotes.filter((note) => note.is_auto_generated).length
  const manual = data.lessonNotes.length - autoGenerated
  const lessonsWithNotes = new Set(data.lessonNotes.map((note) => note.lesson_id)).size
  const sourceCounts = new Map<string, number>()
  data.lessonNotes.forEach((note) => incrementMap(sourceCounts, note.source_type || 'manual'))
  const averageLength = calculateAverage(data.lessonNotes.map((note) => note.note_content?.length || 0))
  const contentCompleteness = calculatePercentage(data.lessonNotes.filter((note) => Boolean(note.note_content?.trim())).length, data.lessonNotes.length)
  const notesScore = calculateQualityScore([
    calculatePercentage(lessonsWithNotes, Math.max(lessonsCompleted, lessonsWithNotes)),
    contentCompleteness,
    clampPercentage(averageLength / 4),
  ])

  return {
    totalNotes: data.lessonNotes.length,
    manualNotes: manual,
    autoGeneratedNotes: autoGenerated,
    lessonsWithNotes,
    adoptionRate: calculatePercentage(lessonsWithNotes, Math.max(lessonsCompleted, lessonsWithNotes)),
    averageLength: roundNumber(averageLength),
    notesScore,
    bySource: buildBreakdown(sourceCounts, data.lessonNotes.length),
    notesTrend: buildTrend(data.lessonNotes.map((note) => note.created_at || note.updated_at).filter((value): value is string => Boolean(value)), period),
  }
}

function buildActivities(
  data: QueryData,
  period: BusinessUserAnalyticsPeriod,
  evaluationsBySubmission: Map<string, ActivityEvaluationRecord>,
  completedCourseIds: Set<string>,
) {
  const completedActivityIdsFromSubmissions = new Set(
    data.activitySubmissions
      .filter((submission) => submission.status !== 'draft')
      .map((submission) => submission.activity_id),
  )
  const submittedActivities = data.activitySubmissions.filter((submission) => submission.status !== 'draft')
  const completedSofliaActivities = data.activityCompletions.filter((completion) =>
    isActivityCompletionSatisfied(completion) && !completedActivityIdsFromSubmissions.has(completion.activity_id),
  )
  const activityProgressFallback = buildActivityProgressFallback(
    data.lessonProgress,
    data.lessonActivities,
    data.courseLessons,
    completedCourseIds,
    submittedActivities.length === 0 && completedSofliaActivities.length === 0,
  )
  const validated = data.activitySubmissions.filter((submission) => submission.status === 'validated').length
  const needsRevision = data.activitySubmissions.filter((submission) => submission.status === 'needs_revision').length
  const submitted = data.activitySubmissions.filter((submission) => submission.status !== 'draft').length
  const evaluationScores = submittedActivities.map((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return scoreEvaluationStatus(evaluation.result_status)
    if (submission.status === 'validated') return 100
    if (submission.status === 'needs_revision') return 55
    return 100
  })
  const statusCounts = new Map<string, number>()
  data.activitySubmissions.forEach((submission) => incrementMap(statusCounts, submission.status || 'draft'))
  completedSofliaActivities.forEach((completion) => incrementMap(statusCounts, completion.status || 'completed'))
  if (activityProgressFallback.completed > 0) {
    incrementMap(statusCounts, 'completed', activityProgressFallback.completed)
  }
  if (activityProgressFallback.total > activityProgressFallback.completed) {
    incrementMap(statusCounts, 'in_progress', activityProgressFallback.total - activityProgressFallback.completed)
  }
  const directPasses = submittedActivities.filter((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return evaluation.result_status === 'pass'
    return submission.status === 'validated' || submission.status === 'completed'
  }).length
  const totalEvaluatedOrCompleted =
    submittedActivities.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const qualityScores = [
    ...evaluationScores,
    ...completedSofliaActivities.map(() => 100),
    ...activityProgressFallback.scores,
  ]
  const totalActivitySignals =
    data.activitySubmissions.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const completedActivitySignals =
    submitted +
    completedSofliaActivities.length +
    activityProgressFallback.completed

  return {
    totalSubmissions: completedActivitySignals,
    submitted: completedActivitySignals,
    validated: validated + completedSofliaActivities.length + activityProgressFallback.completed,
    needsRevision,
    passRate: calculatePercentage(
      directPasses + completedSofliaActivities.length + activityProgressFallback.completed,
      totalEvaluatedOrCompleted,
    ),
    averageQualityScore: calculateAverage(qualityScores),
    averageResponseLength: calculateAverage(data.activitySubmissions.map((submission) => extractSubmissionText(submission).length)),
    withSofliaFeedback: evaluationsBySubmission.size + completedSofliaActivities.length,
    statusBreakdown: buildBreakdown(statusCounts, totalActivitySignals || completedActivitySignals),
    submissionsTrend: buildTrend([
      ...data.activitySubmissions.map((submission) => submission.submitted_at || submission.updated_at),
      ...completedSofliaActivities.map((completion) => completion.completed_at || completion.updated_at || completion.started_at),
      ...activityProgressFallback.dates,
    ].filter((value): value is string => Boolean(value)), period),
  }
}

function buildActivityProgressFallback(
  lessonProgress: LessonProgressRecord[],
  lessonActivities: LessonActivityRecord[],
  courseLessons: CourseLessonRecord[],
  completedCourseIds: Set<string>,
  shouldUseFallback: boolean,
): {
  completed: number
  dates: string[]
  scores: number[]
  total: number
} {
  if (!shouldUseFallback) {
    return {
      completed: 0,
      dates: [],
      scores: [],
      total: 0,
    }
  }

  const activitiesByLesson = groupLessonActivitiesByLesson(lessonActivities)
  const rows = lessonProgress.filter((progress) =>
    hasLessonActivityProgressSignal(progress) ||
    (isLessonCompleted(progress) && getRelevantActivityCount(activitiesByLesson.get(progress.lesson_id) || []) > 0),
  )
  const processedLessonIds = new Set<string>()
  let completed = 0
  let total = 0
  const scores: number[] = []
  const dates: string[] = []

  rows.forEach((progress) => {
    processedLessonIds.add(progress.lesson_id)
    const lessonActivitiesForProgress = activitiesByLesson.get(progress.lesson_id) || []
    const inferredActivityTotal = getRelevantActivityCount(lessonActivitiesForProgress)
    const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
    const requiredCompleted = Math.min(
      getNonNegativeNumber(progress.required_activities_completed),
      requiredTotal > 0 ? requiredTotal : Number.POSITIVE_INFINITY,
    )
    const progressScore = normalizeLessonActivityProgress(progress)
    const canInferFromCompletedLesson =
      requiredTotal === 0 &&
      progressScore === 0 &&
      inferredActivityTotal > 0 &&
      isLessonCompleted(progress)

    if (canInferFromCompletedLesson) {
      total += inferredActivityTotal
      completed += inferredActivityTotal
      scores.push(100)
    } else if (requiredTotal > 0) {
      total += requiredTotal
      completed += requiredCompleted
      scores.push(progressScore)
    } else {
      total += 1
      if (progressScore >= 100 || requiredCompleted > 0) {
        completed += 1
      }
      scores.push(progressScore)
    }

    const activityDate =
      progress.last_activity_submission_at ||
      progress.updated_at ||
      progress.completed_at ||
      progress.last_accessed_at
    if (activityDate) dates.push(activityDate)
  })

  courseLessons.forEach((lesson) => {
    if (processedLessonIds.has(lesson.lesson_id)) return
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId || !completedCourseIds.has(courseId)) return

    const inferredActivityTotal = getRelevantActivityCount(activitiesByLesson.get(lesson.lesson_id) || [])
    if (inferredActivityTotal === 0) return

    total += inferredActivityTotal
    completed += inferredActivityTotal
    scores.push(100)
  })

  return {
    completed,
    dates,
    scores,
    total,
  }
}

function groupLessonActivitiesByLesson(
  lessonActivities: LessonActivityRecord[],
): Map<string, LessonActivityRecord[]> {
  const map = new Map<string, LessonActivityRecord[]>()
  lessonActivities.forEach((activity) => {
    map.set(activity.lesson_id, [...(map.get(activity.lesson_id) || []), activity])
  })
  return map
}

function getRelevantActivityCount(lessonActivities: LessonActivityRecord[]): number {
  if (lessonActivities.length === 0) return 0
  const requiredCount = lessonActivities.filter((activity) => activity.is_required !== false).length
  return requiredCount > 0 ? requiredCount : lessonActivities.length
}

function hasLessonActivityProgressSignal(progress: LessonProgressRecord): boolean {
  return (
    getNonNegativeNumber(progress.required_activities_total) > 0 ||
    getNonNegativeNumber(progress.required_activities_completed) > 0 ||
    normalizeLessonActivityProgress(progress) > 0 ||
    Boolean(progress.last_activity_submission_at)
  )
}

function isLessonCompleted(progress: LessonProgressRecord): boolean {
  return Boolean(progress.is_completed || progress.lesson_status === 'completed')
}

function normalizeLessonActivityProgress(progress: LessonProgressRecord): number {
  if (progress.activity_progress_percentage === null || progress.activity_progress_percentage === undefined) {
    const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
    if (requiredTotal > 0) {
      return calculatePercentage(
        getNonNegativeNumber(progress.required_activities_completed),
        requiredTotal,
      )
    }

    return 0
  }

  const explicitProgress = Number(progress.activity_progress_percentage)
  if (Number.isFinite(explicitProgress)) {
    return clampPercentage(explicitProgress)
  }

  const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
  if (requiredTotal > 0) {
    return calculatePercentage(
      getNonNegativeNumber(progress.required_activities_completed),
      requiredTotal,
    )
  }

  return 0
}

function buildQuizzes(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const sortedSubmissions = [...data.quizSubmissions].sort((a, b) =>
    new Date(a.completed_at || a.created_at || 0).getTime() - new Date(b.completed_at || b.created_at || 0).getTime(),
  )
  const scores = sortedSubmissions.map((quiz) => normalizeQuizScore(quiz)).filter((value) => Number.isFinite(value))

  return {
    attempts: sortedSubmissions.length,
    passed: sortedSubmissions.filter((quiz) => quiz.is_passed).length,
    passRate: calculatePercentage(sortedSubmissions.filter((quiz) => quiz.is_passed).length, sortedSubmissions.length),
    averageScore: calculateAverage(scores),
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    latestScore: scores.length > 0 ? scores[scores.length - 1] : 0,
    trend: buildTrendWithValues(sortedSubmissions, period, normalizeQuizScore),
  }
}

function buildQuality(input: {
  averageCourseProgress: number
  activitiesScore: number
  sofliaScore: number
  notesScore: number
  quizScore: number
  evidenceCount: number
}) {
  const courseScore = input.averageCourseProgress
  const overallScore = calculateQualityScore([
    courseScore,
    input.activitiesScore,
    input.sofliaScore,
    input.notesScore,
    input.quizScore,
  ])

  const radarValues = new Map<string, number>([
    ['courses', Math.round(courseScore)],
    ['activities', Math.round(input.activitiesScore)],
    ['soflia', Math.round(input.sofliaScore)],
    ['notes', Math.round(input.notesScore)],
    ['quizzes', Math.round(input.quizScore)],
  ])

  return {
    overallScore,
    courseScore,
    activityScore: input.activitiesScore,
    sofliaQuestionScore: input.sofliaScore,
    notesScore: input.notesScore,
    quizScore: input.quizScore,
    evidenceCount: input.evidenceCount,
    radar: buildBreakdown(radarValues, 100),
  }
}

function buildAiSamples(
  data: QueryData,
  courseTitleById: Map<string, string>,
  enrollmentCourseById: Map<string, string>,
  evaluationsBySubmission: Map<string, ActivityEvaluationRecord>,
): BusinessUserAnalyticsAiSample[] {
  const samples: BusinessUserAnalyticsAiSample[] = []

  for (const message of data.liaMessages.filter((item) => item.role === 'user')) {
    if (samples.length >= 35) break
    const conversation = data.liaConversations.find((item) => item.conversation_id === message.conversation_id)
    pushSample(samples, {
      source: 'soflia_message',
      text: message.content,
      courseTitle: conversation?.course_id ? resolveCourseTitle(courseTitleById, conversation.course_id) : undefined,
      signals: {
        containsQuestion: message.contains_question,
        offTopic: message.is_off_topic,
        sentiment: message.sentiment_score,
      },
    })
  }

  for (const submission of data.activitySubmissions) {
    if (samples.length >= 55) break
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    pushSample(samples, {
      source: 'activity_response',
      text: extractSubmissionText(submission),
      courseTitle: resolveCourseTitle(courseTitleById, submission.course_id),
      signals: {
        status: submission.status,
        evaluation: evaluation?.result_status || null,
      },
    })
  }

  for (const quiz of data.quizSubmissions) {
    if (samples.length >= 65) break
    const courseId = enrollmentCourseById.get(quiz.enrollment_id)
    pushSample(samples, {
      source: 'quiz_response',
      text: stringifySampleContent(quiz.user_answers),
      courseTitle: courseId ? resolveCourseTitle(courseTitleById, courseId) : undefined,
      signals: {
        score: normalizeQuizScore(quiz),
        passed: quiz.is_passed,
      },
    })
  }

  for (const note of data.lessonNotes) {
    if (samples.length >= 80) break
    pushSample(samples, {
      source: 'note',
      text: note.note_content,
      signals: {
        autoGenerated: note.is_auto_generated,
        source: note.source_type || null,
      },
    })
  }

  return samples
}

function collectContributionDates(data: QueryData, period: BusinessUserAnalyticsPeriod): string[] {
  const dates = [
    ...data.userSessions.map((session) => session.issued_at),
    ...data.lessonProgress.flatMap((progress) => [
      progress.started_at,
      progress.last_activity_submission_at,
      progress.last_accessed_at,
      progress.completed_at,
      progress.updated_at,
    ]),
    ...data.studySessions.flatMap((session) => [
      session.started_at,
      session.completed_at,
      session.start_time,
      session.updated_at,
    ]),
    ...data.lessonNotes.flatMap((note) => [note.created_at, note.updated_at]),
    ...data.liaConversations.flatMap((conversation) => [
      conversation.started_at,
      conversation.ended_at,
      conversation.created_at,
      conversation.updated_at,
    ]),
    ...data.liaMessages.map((message) => message.created_at),
    ...data.activitySubmissions.flatMap((submission) => [
      submission.submitted_at,
      submission.last_validated_at,
      submission.updated_at,
    ]),
    ...data.activityCompletions.flatMap((completion) => [
      completion.started_at,
      completion.completed_at,
      completion.updated_at,
    ]),
    ...data.quizSubmissions.flatMap((quiz) => [quiz.completed_at, quiz.created_at, quiz.updated_at]),
    ...data.lessonTracking.flatMap((tracking) => [
      tracking.started_at,
      tracking.last_activity_at,
      tracking.completed_at,
      tracking.updated_at,
    ]),
  ].filter((date): date is string => Boolean(date))

  return dates.filter((date) => isWithinPeriod(date, period))
}

function buildTrend(dates: string[], period: BusinessUserAnalyticsPeriod): BusinessUserAnalyticsTrendPoint[] {
  const counts = new Map<string, number>()
  dates.forEach((date) => {
    if (!isWithinPeriod(date, period)) return
    incrementMap(counts, buildPeriodKey(date, PERIOD_GRANULARITY))
  })

  return buildPeriodTrend(counts, { from: period.from, to: period.to, granularity: PERIOD_GRANULARITY })
}

function buildTrendWithValues<T>(
  rows: T[],
  period: BusinessUserAnalyticsPeriod,
  valueSelector: (row: T) => number,
): BusinessUserAnalyticsTrendPoint[] {
  const groups = new Map<string, number[]>()
  rows.forEach((row) => {
    const date = getRowDate(row)
    if (!date || !isWithinPeriod(date, period)) return
    const key = buildPeriodKey(date, PERIOD_GRANULARITY)
    groups.set(key, [...(groups.get(key) || []), valueSelector(row)])
  })

  const averaged = new Map<string, number>()
  groups.forEach((values, key) => averaged.set(key, calculateAverage(values)))
  return buildPeriodTrend(averaged, { from: period.from, to: period.to, granularity: PERIOD_GRANULARITY })
}

function buildCourseProgressDistribution(values: number[]): BusinessUserAnalyticsBreakdownItem[] {
  const counts = new Map<string, number>()
  values.forEach((progress) => incrementMap(counts, getProgressBand(progress)))
  return buildBreakdown(counts, values.length)
}

function buildAnalyticsScope(
  assignments: AssignmentRecord[],
  enrollments: EnrollmentRecord[],
  courseLessons: CourseLessonRecord[],
): AnalyticsScope {
  return {
    courseIds: new Set([
      ...assignments.map((assignment) => assignment.course_id),
      ...enrollments.map((enrollment) => enrollment.course_id),
    ]),
    enrollmentIds: new Set(enrollments.map((enrollment) => enrollment.enrollment_id)),
    lessonIds: new Set(courseLessons.map((lesson) => lesson.lesson_id)),
  }
}

function buildCourseLessonCountByCourse(courseLessons: CourseLessonRecord[]): Map<string, number> {
  const counts = new Map<string, number>()
  courseLessons.forEach((lesson) => {
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId) return
    incrementMap(counts, courseId)
  })
  return counts
}

function buildCompletedCourseIds(
  assignments: AssignmentRecord[],
  enrollments: EnrollmentRecord[],
): Set<string> {
  const completedCourseIds = new Set<string>()

  assignments.forEach((assignment) => {
    const enrollment = enrollments.find((item) => item.course_id === assignment.course_id)
    const progress = clampPercentage(
      Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0),
    )
    const status = resolveCourseStatus(assignment.status, enrollment?.enrollment_status, progress)
    if (status === 'completed' || progress >= 100) {
      completedCourseIds.add(assignment.course_id)
    }
  })

  enrollments.forEach((enrollment) => {
    const progress = clampPercentage(Number(enrollment.overall_progress_percentage ?? 0))
    const status = resolveCourseStatus(null, enrollment.enrollment_status, progress)
    if (status === 'completed' || progress >= 100) {
      completedCourseIds.add(enrollment.course_id)
    }
  })

  return completedCourseIds
}

function groupLessonProgressByCourse(
  lessonProgress: LessonProgressRecord[],
  enrollmentCourseById: Map<string, string>,
): Map<string, LessonProgressRecord[]> {
  const map = new Map<string, LessonProgressRecord[]>()

  lessonProgress.forEach((progress) => {
    const courseId = enrollmentCourseById.get(progress.enrollment_id)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), progress])
  })

  return map
}

function groupLessonTrackingByCourse(
  lessonTracking: LessonTrackingRecord[],
  courseLessons: CourseLessonRecord[],
): Map<string, LessonTrackingRecord[]> {
  const courseByLessonId = new Map(
    courseLessons
      .map((lesson) => [lesson.lesson_id, getCourseIdFromLesson(lesson)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  )
  const map = new Map<string, LessonTrackingRecord[]>()

  lessonTracking.forEach((tracking) => {
    const courseId = courseByLessonId.get(tracking.lesson_id)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), tracking])
  })

  return map
}

function groupCourseLessonsByCourse(
  courseLessons: CourseLessonRecord[],
): Map<string, CourseLessonRecord[]> {
  const map = new Map<string, CourseLessonRecord[]>()

  courseLessons.forEach((lesson) => {
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId) return
    map.set(courseId, [...(map.get(courseId) || []), lesson])
  })

  return map
}

function calculateStudyMinutes(
  lessonProgress: LessonProgressRecord[],
  lessonTracking: LessonTrackingRecord[],
  courseLessons: CourseLessonRecord[],
  lessonActivities: LessonActivityRecord[],
  isCourseCompleted: boolean,
): number {
  const progressMinutesByLesson = new Map<string, number>()
  const completedLessonIds = new Set<string>()
  lessonProgress.forEach((progress) => {
    progressMinutesByLesson.set(
      progress.lesson_id,
      (progressMinutesByLesson.get(progress.lesson_id) || 0) + (Number(progress.time_spent_minutes) || 0),
    )
    if (progress.is_completed || progress.lesson_status === 'completed') {
      completedLessonIds.add(progress.lesson_id)
    }
  })

  const trackingMinutesByLesson = new Map<string, number>()
  lessonTracking.forEach((tracking) => {
    trackingMinutesByLesson.set(
      tracking.lesson_id,
      (trackingMinutesByLesson.get(tracking.lesson_id) || 0) + getLessonTrackingMinutes(tracking),
    )
    if (isCompletedStatus(tracking.status) || tracking.completed_at) {
      completedLessonIds.add(tracking.lesson_id)
    }
  })

  const estimatedMinutesByLesson = buildEstimatedLessonMinutesMap(courseLessons, lessonActivities)
  if (isCourseCompleted && completedLessonIds.size === 0) {
    courseLessons.forEach((lesson) => completedLessonIds.add(lesson.lesson_id))
  }

  const lessonIds = new Set([
    ...progressMinutesByLesson.keys(),
    ...trackingMinutesByLesson.keys(),
    ...completedLessonIds,
  ])
  let total = 0
  lessonIds.forEach((lessonId) => {
    const progressMinutes = progressMinutesByLesson.get(lessonId) || 0
    const trackingMinutes = trackingMinutesByLesson.get(lessonId) || 0
    const actualMinutes = progressMinutes > 0 ? progressMinutes : trackingMinutes
    if (actualMinutes > 0) {
      total += actualMinutes
      return
    }

    if (completedLessonIds.has(lessonId)) {
      total += estimatedMinutesByLesson.get(lessonId) || 0
    }
  })

  return roundNumber(total)
}

function buildEstimatedLessonMinutesMap(
  courseLessons: CourseLessonRecord[],
  lessonActivities: LessonActivityRecord[],
): Map<string, number> {
  const activityMinutesByLesson = buildEstimatedActivityMinutesByLesson(lessonActivities)

  return new Map(
    courseLessons.map((lesson) => [
      lesson.lesson_id,
      getEstimatedLessonMinutes(lesson, activityMinutesByLesson.get(lesson.lesson_id) || 0),
    ]),
  )
}

function getEstimatedLessonMinutes(lesson: CourseLessonRecord, activityMinutes: number): number {
  const totalMinutes = Number(lesson.total_duration_minutes)
  if (Number.isFinite(totalMinutes) && totalMinutes > 0) {
    return totalMinutes
  }

  const durationSeconds = Number(lesson.duration_seconds)
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return Math.round(((durationSeconds / 60) + activityMinutes) * 10) / 10
  }

  return activityMinutes
}

function buildEstimatedActivityMinutesByLesson(
  lessonActivities: LessonActivityRecord[],
): Map<string, number> {
  const map = new Map<string, number>()
  lessonActivities.forEach((activity) => {
    map.set(
      activity.lesson_id,
      (map.get(activity.lesson_id) || 0) + getNonNegativeNumber(activity.estimated_time_minutes),
    )
  })
  return map
}

function buildCourseTitleMap(assignments: AssignmentRecord[]): Map<string, string> {
  const map = new Map<string, string>()
  assignments.forEach((assignment) => {
    const course = unwrapRelation(assignment.courses)
    map.set(assignment.course_id, course?.title || assignment.course_id)
  })
  return map
}

function buildLatestEvaluationBySubmission(
  evaluations: ActivityEvaluationRecord[],
): Map<string, ActivityEvaluationRecord> {
  const map = new Map<string, ActivityEvaluationRecord>()
  evaluations.forEach((evaluation) => {
    if (!map.has(evaluation.submission_id)) {
      map.set(evaluation.submission_id, evaluation)
    }
  })
  return map
}

function scoreEvaluationStatus(status: string | null | undefined): number {
  if (status === 'pass') return 100
  if (status === 'revise') return 55
  if (status === 'error') return 0
  return 0
}

function normalizeQuizScore(quiz: QuizSubmissionRecord): number {
  if (Number.isFinite(Number(quiz.percentage_score))) {
    return clampPercentage(Number(quiz.percentage_score))
  }

  if (Number.isFinite(Number(quiz.score)) && Number.isFinite(Number(quiz.total_points)) && Number(quiz.total_points) > 0) {
    return clampPercentage((Number(quiz.score) / Number(quiz.total_points)) * 100)
  }

  return 0
}

function getCourseIdFromLesson(lesson: CourseLessonRecord): string | null {
  return unwrapRelation(lesson.course_modules)?.course_id || null
}

function getActivityCompletionCourseId(completion: ActivityCompletionRecord): string | null {
  const activity = unwrapRelation(completion.lesson_activities)
  const lesson = unwrapRelation(activity?.course_lessons || null)
  return unwrapRelation(lesson?.course_modules || null)?.course_id || null
}

function getLessonTrackingMinutes(tracking: LessonTrackingRecord): number {
  const explicitMinutes = Number(tracking.t_lesson_minutes)
  if (Number.isFinite(explicitMinutes) && explicitMinutes > 0) {
    return explicitMinutes
  }

  const videoMinutes = Number(tracking.t_video_minutes) || 0
  const materialMinutes = Number(tracking.t_materials_minutes) || 0
  const contentMinutes = videoMinutes + materialMinutes
  if (contentMinutes > 0) {
    return contentMinutes
  }

  if (!tracking.started_at || !tracking.completed_at) return 0
  const startedAt = new Date(tracking.started_at).getTime()
  const completedAt = new Date(tracking.completed_at).getTime()
  if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt <= startedAt) {
    return 0
  }

  return Math.round(((completedAt - startedAt) / 60_000) * 10) / 10
}

function isActivityCompletionSatisfied(completion: ActivityCompletionRecord): boolean {
  const status = completion.status?.toLowerCase()
  if (status === 'completed' || status === 'done') return true
  const completedSteps = Number(completion.completed_steps)
  const totalSteps = Number(completion.total_steps)
  return Number.isFinite(completedSteps) && Number.isFinite(totalSteps) && totalSteps > 0 && completedSteps >= totalSteps
}

function hasQuestionSignal(message: LiaMessageRecord): boolean {
  if (message.contains_question) return true
  const content = message.content.trim()
  if (!content) return false
  if (content.includes('?') || content.includes('\u00bf')) return true
  const normalizedContent = content
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return /\b(que|como|cual|cuando|donde|por que|porque|puedes|podrias|ayuda|explica|explicame|what|how|why|when|where|which|can you|could you)\b/.test(normalizedContent)
}

function buildDerivedResponseTimes(messages: LiaMessageRecord[]): number[] {
  const messagesByConversation = new Map<string, LiaMessageRecord[]>()
  messages.forEach((message) => {
    messagesByConversation.set(message.conversation_id, [
      ...(messagesByConversation.get(message.conversation_id) || []),
      message,
    ])
  })

  const responseTimes: number[] = []
  messagesByConversation.forEach((conversationMessages) => {
    const sortedMessages = [...conversationMessages].sort(compareLiaMessages)
    let latestUserMessageAt: string | null = null

    sortedMessages.forEach((message) => {
      if (message.role === 'user') {
        latestUserMessageAt = message.created_at
        return
      }

      if (!latestUserMessageAt || message.response_time_ms) return
      const userTime = new Date(latestUserMessageAt).getTime()
      const responseTime = message.created_at ? new Date(message.created_at).getTime() : NaN
      if (Number.isNaN(userTime) || Number.isNaN(responseTime) || responseTime <= userTime) return
      responseTimes.push(responseTime - userTime)
      latestUserMessageAt = null
    })
  })

  return responseTimes
}

function compareLiaMessages(a: LiaMessageRecord, b: LiaMessageRecord): number {
  const sequenceDiff = Number(a.message_sequence || 0) - Number(b.message_sequence || 0)
  if (sequenceDiff !== 0) return sequenceDiff
  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
}

function resolveCourseStatus(
  assignmentStatus: string | null | undefined,
  enrollmentStatus: string | null | undefined,
  progress: number,
): string {
  if (progress >= 100 || isCompletedStatus(assignmentStatus) || isCompletedStatus(enrollmentStatus)) {
    return 'completed'
  }

  if (progress > 0 || enrollmentStatus === 'active' || assignmentStatus === 'in_progress') {
    return 'in_progress'
  }

  return 'assigned'
}

function isCompletedStatus(status: string | null | undefined): boolean {
  const normalized = status?.toLowerCase()
  return normalized === 'completed' || normalized === 'complete' || normalized === 'finished'
}

function getCourseCompletionDate(
  assignment: AssignmentRecord,
  enrollments: EnrollmentRecord[],
): string | null {
  const enrollment = enrollments.find((item) => item.course_id === assignment.course_id)
  return enrollment?.completed_at || assignment.completed_at
}

function getRowDate(row: unknown): string | null {
  if (!isRecord(row)) return null
  return stringOrNull(row.completed_at) || stringOrNull(row.created_at) || stringOrNull(row.updated_at)
}

function extractSubmissionText(submission: ActivitySubmissionRecord): string {
  if (submission.response_text?.trim()) {
    return redactSensitiveText(submission.response_text.trim()).slice(0, 900)
  }

  return redactSensitiveText(stringifySampleContent(submission.response_payload)).slice(0, 900)
}

function stringifySampleContent(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  try {
    return JSON.stringify(value).slice(0, 1200)
  } catch {
    return String(value)
  }
}

function pushSample(samples: BusinessUserAnalyticsAiSample[], sample: BusinessUserAnalyticsAiSample): void {
  if (!sample.text.trim()) return

  samples.push({
    ...sample,
    text: redactSensitiveText(sample.text).slice(0, 900),
  })
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[telefono]')
    .replace(/\b[A-Z0-9._%+-]{24,}\b/gi, '[token]')
}

function resolveCourseTitle(courseTitleById: Map<string, string>, courseId: string): string {
  return courseTitleById.get(courseId) || courseId
}

function getLatestDate(values: Array<string | null | undefined>): string | null {
  const latest = values.reduce<Date | null>((current, value) => {
    if (!value) return current
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return current
    if (!current || date > current) return date
    return current
  }, null)

  return latest ? latest.toISOString() : null
}

function isWithinPeriod(value: string, period: Pick<BusinessUserAnalyticsPeriod, 'from' | 'to'>): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date >= new Date(period.from) && date <= new Date(period.to)
}

function uniqueDateKeys(values: string[]): string[] {
  return Array.from(new Set(values.map(toUtcDateKey).filter((key): key is string => Boolean(key)))).sort()
}

function calculateCurrentStreak(dateKeys: string[]): number {
  const keySet = new Set(dateKeys)
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  let streak = 0

  while (keySet.has(toUtcDateKey(cursor) || '')) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

function calculateLongestStreak(dateKeys: string[]): number {
  let longest = 0
  let current = 0
  let previousTime: number | null = null

  dateKeys.forEach((key) => {
    const time = new Date(`${key}T00:00:00.000Z`).getTime()
    if (previousTime !== null && time - previousTime === 86_400_000) {
      current += 1
    } else {
      current = 1
    }

    longest = Math.max(longest, current)
    previousTime = time
  })

  return longest
}

function toUtcDateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function hashAnalyticsPayload(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
}

function unwrapRelation<T>(relation: Relation<T> | undefined): T | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0] || null
  return relation
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function roundNumber(value: number, decimals = 1): number {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

function sumNumbers(values: number[]): number {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
}

function getNonNegativeNumber(value: unknown): number {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) return 0
  return numberValue
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function logQueryError(label: string, error: unknown): void {
  if (!error) return
  logger.error(`Business user analytics query failed: ${label}`, error)
}
