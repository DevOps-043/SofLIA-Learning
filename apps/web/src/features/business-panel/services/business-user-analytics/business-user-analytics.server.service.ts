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
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  activity_progress_percentage: number | null
  quiz_progress_percentage: number | null
}

interface ActivitySubmissionRecord {
  submission_id: string
  course_id: string
  status: string
  response_text: string | null
  response_payload: Json
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string
  updated_at: string
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
  note_title: string
  note_content: string
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
}

interface QuizSubmissionRecord {
  submission_id: string
  course_id?: string | null
  enrollment_id: string
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
}

interface UserSessionRecord {
  id: string
  issued_at: string
}

interface QueryData {
  assignments: AssignmentRecord[]
  enrollments: EnrollmentRecord[]
  lessonProgress: LessonProgressRecord[]
  activitySubmissions: ActivitySubmissionRecord[]
  activityEvaluations: ActivityEvaluationRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  studySessions: StudySessionRecord[]
  lessonNotes: LessonNoteRecord[]
  quizSubmissions: QuizSubmissionRecord[]
  certificates: CertificateRecord[]
  userSessions: UserSessionRecord[]
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
  const evaluationsBySubmission = buildLatestEvaluationBySubmission(data.activityEvaluations)

  const courseRows = data.assignments.map((assignment) => {
    const enrollment = data.enrollments.find((item) => item.course_id === assignment.course_id)
    const progress = clampPercentage(
      Number(enrollment?.overall_progress_percentage ?? assignment.completion_percentage ?? 0),
    )
    const courseLessonProgress = lessonProgressByCourse.get(assignment.course_id) || []

    return {
      courseId: assignment.course_id,
      courseTitle: resolveCourseTitle(courseTitleById, assignment.course_id),
      progress,
      status: resolveCourseStatus(assignment.status, enrollment?.enrollment_status, progress),
      assignedAt: assignment.assigned_at,
      dueDate: assignment.due_date,
      completedAt: enrollment?.completed_at || assignment.completed_at,
      lastAccessedAt: getLatestDate([
        enrollment?.last_accessed_at,
        enrollment?.updated_at,
        ...courseLessonProgress.map((item) => item.last_accessed_at || item.updated_at),
      ]),
      lessonsCompleted: courseLessonProgress.filter((item) => item.is_completed || item.lesson_status === 'completed').length,
      timeSpentMinutes: roundNumber(sumNumbers(courseLessonProgress.map((item) => Number(item.time_spent_minutes) || 0))),
      hasCertificate: certificateCourseIds.has(assignment.course_id),
    }
  })

  const completedCourses = courseRows.filter((course) => course.progress >= 100 || course.status === 'completed').length
  const inProgressCourses = courseRows.filter((course) => course.progress > 0 && course.progress < 100).length
  const lessonsCompleted = data.lessonProgress.filter((item) => item.is_completed || item.lesson_status === 'completed').length
  const timeSpentMinutes = roundNumber(sumNumbers(data.lessonProgress.map((item) => Number(item.time_spent_minutes) || 0)))

  const aiAdoption = buildAiAdoption(data, period)
  const planning = buildPlanning(data, period)
  const notes = buildNotes(data, period, lessonsCompleted)
  const activities = buildActivities(data, period, evaluationsBySubmission)
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
      data.liaMessages.length +
      data.lessonNotes.length +
      data.quizSubmissions.length,
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
    contributionCalendar: buildConnectionCalendar(contributionDates, period),
    aiSamples: buildAiSamples(data, courseTitleById, evaluationsBySubmission),
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
  const [
    assignments,
    enrollments,
    lessonProgress,
    activitySubmissions,
    liaConversations,
    studySessions,
    lessonNotes,
    quizSubmissions,
    certificates,
    userSessions,
  ] = await Promise.all([
    fetchAssignments(supabase, userId, organizationId),
    fetchEnrollments(supabase, userId),
    fetchLessonProgress(supabase, userId, organizationId),
    fetchActivitySubmissions(supabase, userId, organizationId, period),
    fetchLiaConversations(supabase, userId, organizationId, period),
    fetchStudySessions(supabase, userId, organizationId, period),
    fetchLessonNotes(supabase, userId, organizationId, period),
    fetchQuizSubmissions(supabase, userId, organizationId, period),
    fetchCertificates(supabase, userId),
    fetchUserSessions(supabase, userId, period),
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
    lessonProgress,
    activitySubmissions,
    activityEvaluations,
    liaConversations,
    liaMessages,
    studySessions,
    lessonNotes,
    quizSubmissions,
    certificates,
    userSessions,
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
    .select('enrollment_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<EnrollmentRecord[]>()

  logQueryError('business user enrollments', error)
  return data || []
}

async function fetchLessonProgress(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('progress_id, enrollment_id, lesson_id, lesson_status, is_completed, time_spent_minutes, completed_at, started_at, last_accessed_at, updated_at, activity_progress_percentage, quiz_progress_percentage')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .limit(PAGE_LIMIT)
    .returns<LessonProgressRecord[]>()

  logQueryError('business user lesson progress', error)
  return data || []
}

async function fetchActivitySubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('user_activity_submissions')
    .select('submission_id, course_id, status, response_text, response_payload, submitted_at, last_validated_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('updated_at', period.from)
    .lte('updated_at', period.to)
    .limit(PAGE_LIMIT)
    .returns<ActivitySubmissionRecord[]>()

  logQueryError('business user activity submissions', error)
  return data || []
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
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('lia_conversations')
    .select('conversation_id, course_id, context_type, conversation_completed, started_at, ended_at, created_at, updated_at, total_messages, total_lia_messages, total_user_messages')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('started_at', period.from)
    .lte('started_at', period.to)
    .limit(PAGE_LIMIT)
    .returns<LiaConversationRecord[]>()

  logQueryError('business user SofLIA conversations', error)
  return data || []
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
      .select('message_id, conversation_id, role, content, created_at, contains_question, response_time_ms, is_off_topic, lia_redirected, lia_provided_example, sentiment_score, tokens_used')
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
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, course_id, status, start_time, end_time, completed_at, started_at, duration_minutes, actual_duration_minutes, was_rescheduled, updated_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('start_time', period.from)
    .lte('start_time', period.to)
    .limit(PAGE_LIMIT)
    .returns<StudySessionRecord[]>()

  logQueryError('business user study sessions', error)
  return data || []
}

async function fetchLessonNotes(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select('note_id, lesson_id, note_title, note_content, is_auto_generated, source_type, created_at, updated_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('created_at', period.from)
    .lte('created_at', period.to)
    .limit(PAGE_LIMIT)
    .returns<LessonNoteRecord[]>()

  logQueryError('business user lesson notes', error)
  return data || []
}

async function fetchQuizSubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  period: BusinessUserAnalyticsPeriod,
) {
  const { data, error } = await supabase
    .from('user_quiz_submissions')
    .select('submission_id, enrollment_id, percentage_score, score, total_points, user_answers, is_passed, completed_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('created_at', period.from)
    .lte('created_at', period.to)
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
    .select('certificate_id, course_id')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<CertificateRecord[]>()

  logQueryError('business user certificates', error)
  return data || []
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
  const questions = userMessages.filter((message) => message.contains_question).length
  const offTopic = userMessages.filter((message) => message.is_off_topic).length
  const redirects = data.liaMessages.filter((message) => message.lia_redirected).length
  const responseTimes = data.liaMessages
    .map((message) => Number(message.response_time_ms))
    .filter((value) => Number.isFinite(value) && value > 0)
  const sentimentScores = data.liaMessages
    .map((message) => Number(message.sentiment_score))
    .filter((value) => Number.isFinite(value))
  const questionRate = calculatePercentage(questions, userMessages.length)
  const offTopicRate = calculatePercentage(offTopic, userMessages.length)
  const redirectRate = calculatePercentage(redirects, data.liaMessages.length)
  const averageSentiment = sentimentScores.length > 0 ? roundNumber(calculateAverage(sentimentScores), 2) : 0
  const sentimentScore = clampPercentage(50 + averageSentiment * 50)
  const questionQualityScore = clampPercentage(60 + questionRate * 0.25 - offTopicRate * 0.45 - redirectRate * 0.2 + sentimentScore * 0.25)
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
) {
  const validated = data.activitySubmissions.filter((submission) => submission.status === 'validated').length
  const needsRevision = data.activitySubmissions.filter((submission) => submission.status === 'needs_revision').length
  const submitted = data.activitySubmissions.filter((submission) => submission.status !== 'draft').length
  const evaluationScores = data.activitySubmissions
    .map((submission) => evaluationsBySubmission.get(submission.submission_id))
    .filter((evaluation): evaluation is ActivityEvaluationRecord => Boolean(evaluation))
    .map((evaluation) => scoreEvaluationStatus(evaluation.result_status))
  const statusCounts = new Map<string, number>()
  data.activitySubmissions.forEach((submission) => incrementMap(statusCounts, submission.status || 'draft'))

  return {
    totalSubmissions: data.activitySubmissions.length,
    submitted,
    validated,
    needsRevision,
    passRate: calculatePercentage(
      Array.from(evaluationsBySubmission.values()).filter((evaluation) => evaluation.result_status === 'pass').length,
      evaluationsBySubmission.size,
    ),
    averageQualityScore: calculateAverage(evaluationScores),
    averageResponseLength: calculateAverage(data.activitySubmissions.map((submission) => extractSubmissionText(submission).length)),
    withSofliaFeedback: evaluationsBySubmission.size,
    statusBreakdown: buildBreakdown(statusCounts, data.activitySubmissions.length),
    submissionsTrend: buildTrend(data.activitySubmissions.map((submission) => submission.submitted_at || submission.updated_at), period),
  }
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
    pushSample(samples, {
      source: 'quiz_response',
      text: stringifySampleContent(quiz.user_answers),
      courseTitle: quiz.course_id ? resolveCourseTitle(courseTitleById, quiz.course_id) : undefined,
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
    ...data.quizSubmissions.flatMap((quiz) => [quiz.completed_at, quiz.created_at, quiz.updated_at]),
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
