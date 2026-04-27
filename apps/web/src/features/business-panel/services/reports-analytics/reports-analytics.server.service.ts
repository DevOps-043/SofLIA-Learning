import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsAiSample,
  ReportsAnalyticsActivities,
  ReportsAnalyticsCourseRow,
  ReportsAnalyticsDataset,
  ReportsAnalyticsFilterOptions,
  ReportsAnalyticsFilters,
  ReportsAnalyticsHierarchyRankingRow,
  ReportsAnalyticsHierarchyType,
  ReportsAnalyticsNotes,
  ReportsAnalyticsPlanner,
  ReportsAnalyticsQuality,
  ReportsAnalyticsSegmentRow,
  ReportsAnalyticsSegments,
  ReportsAnalyticsSoflia,
  ReportsAnalyticsUserRankingRow,
  ReportsAnalyticsUserDetailRow,
} from '../../types/reports-analytics.types'
import {
  REPORTS_ANALYTICS_AGE_BANDS,
  REPORTS_ANALYTICS_PROGRESS_BANDS,
  REPORTS_ANALYTICS_UNSPECIFIED,
  buildBreakdown,
  buildConnectionCalendar,
  buildLoginHeatmap,
  buildPeriodKey,
  buildPeriodTrend,
  calculateAge,
  calculateAverage,
  calculateDaysBetween,
  calculateMedian,
  calculatePercentage,
  calculateQualityScore,
  calculateRankScore,
  clampPercentage,
  getAgeBand,
  getLatestDate,
  getProgressBand,
  incrementMap,
  isAnyDateOnOrBefore,
  isAnyDateWithinPeriod,
  normalizeDimension,
  resolveLastConnectionAt,
} from './reports-analytics.helpers'

type ReportsAnalyticsSupabaseClient = Awaited<ReturnType<typeof createClient>>
type Relation<T> = T | T[] | null
const REPORTS_ANALYTICS_PAGE_SIZE = 1000

interface UserProfileRecord {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  date_of_birth: string | null
  gender: string | null
  last_login_at?: string | null
  updated_at?: string | null
}

interface OrganizationUserRecord {
  user_id: string
  role: string | null
  job_title: string | null
  status: string | null
  joined_at: string | null
  created_at: string | null
  region_id?: string | null
  zone_id?: string | null
  team_id?: string | null
  hierarchy_scope?: string | null
  users: Relation<UserProfileRecord>
}

interface OrganizationRegionRecord {
  id: string
  name: string
  code: string | null
  is_active: boolean | null
}

interface OrganizationZoneRecord {
  id: string
  name: string
  code: string | null
  region_id: string | null
  is_active: boolean | null
}

interface OrganizationTeamRecord {
  id: string
  name: string
  code: string | null
  zone_id: string | null
  is_active: boolean | null
}

interface CourseRelationRecord {
  id: string
  title: string | null
}

interface CourseModuleRelationRecord {
  module_id: string
  course_id: string | null
}

interface CourseLessonRelationRecord {
  lesson_id: string
  module_id: string | null
  lesson_title?: string | null
  course_modules: Relation<CourseModuleRelationRecord>
}

interface LessonActivityRelationRecord {
  activity_id: string
  activity_title: string | null
  activity_type: string | null
  lesson_id: string | null
  course_lessons: Relation<CourseLessonRelationRecord>
}

interface AssignmentRecord {
  id: string
  user_id: string
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
  user_id: string
  course_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
}

interface LessonProgressEnrollmentRecord {
  course_id: string
  courses: Relation<CourseRelationRecord>
}

interface LessonProgressRecord {
  progress_id: string
  user_id: string
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_accessed_at: string | null
  updated_at: string | null
  enrollment_id: string | null
  lesson_id: string
  user_course_enrollments: Relation<LessonProgressEnrollmentRecord>
}

interface ActivityCompletionRecord {
  completion_id: string
  user_id: string
  activity_id: string
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  user_needed_help: boolean | null
  lia_had_to_redirect: number | null
  generated_output?: unknown
  completed_at: string | null
  started_at: string | null
  updated_at: string | null
  lesson_activities: Relation<LessonActivityRelationRecord>
}

interface ActivitySubmissionRecord {
  submission_id: string
  user_id: string
  organization_id: string | null
  course_id: string
  lesson_id: string
  activity_id: string
  enrollment_id: string
  status: string | null
  response_text?: string | null
  response_payload?: unknown
  evidence_payload?: unknown
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
  lesson_activities: Relation<LessonActivityRelationRecord>
}

interface ActivityEvaluationRecord {
  evaluation_id: string
  submission_id: string
  result_status: string | null
  feedback_payload?: unknown
  model_name?: string | null
  created_at: string | null
}

interface LessonNoteRecord {
  note_id: string
  user_id: string
  lesson_id: string | null
  note_title?: string | null
  note_content?: string | null
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
  course_lessons: Relation<CourseLessonRelationRecord>
}

interface LiaConversationRecord {
  conversation_id: string
  user_id: string
  course_id: string | null
  context_type: string | null
  conversation_completed: boolean | null
  started_at: string | null
  ended_at: string | null
  created_at: string | null
  updated_at: string | null
  total_messages: number | null
  total_lia_messages: number | null
  total_user_messages: number | null
  courses: Relation<CourseRelationRecord>
}

interface LiaMessageRecord {
  message_id: string
  conversation_id: string
  role: string | null
  content?: string | null
  created_at: string | null
  contains_question: boolean | null
  response_time_ms: number | null
  is_off_topic: boolean | null
  lia_redirected: boolean | null
  lia_provided_example?: boolean | null
  sentiment_score?: number | null
  user_sentiment?: string | null
  tokens_used: number | null
}

interface QuizSubmissionEnrollmentRecord {
  course_id: string
  courses: Relation<CourseRelationRecord>
}

interface QuizSubmissionRecord {
  submission_id: string
  user_id: string
  enrollment_id: string
  lesson_id: string
  activity_id: string | null
  percentage_score: number | null
  score?: number | null
  total_points?: number | null
  user_answers?: unknown
  is_passed: boolean | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  user_course_enrollments: Relation<QuizSubmissionEnrollmentRecord>
}

interface StudySessionRecord {
  id: string
  user_id: string
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
  courses: Relation<CourseRelationRecord>
}

interface AnalyticsQueryData {
  organizationUsers: OrganizationUserRecord[]
  regions: OrganizationRegionRecord[]
  zones: OrganizationZoneRecord[]
  teams: OrganizationTeamRecord[]
  assignments: AssignmentRecord[]
  enrollments: EnrollmentRecord[]
  lessonProgress: LessonProgressRecord[]
  activityCompletions: ActivityCompletionRecord[]
  activitySubmissions: ActivitySubmissionRecord[]
  activityEvaluations: ActivityEvaluationRecord[]
  lessonNotes: LessonNoteRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  quizSubmissions: QuizSubmissionRecord[]
  studySessions: StudySessionRecord[]
}

interface ReportsAnalyticsQueryResultLike {
  data: unknown[] | null
  error: unknown
}

interface ReportsAnalyticsUntypedQueryBuilder {
  select(columns: string): ReportsAnalyticsUntypedFilterBuilder
}

interface ReportsAnalyticsUntypedFilterBuilder extends PromiseLike<ReportsAnalyticsQueryResultLike> {
  eq(column: string, value: unknown): ReportsAnalyticsUntypedFilterBuilder
  range(from: number, to: number): PromiseLike<ReportsAnalyticsQueryResultLike>
}

interface ReportsAnalyticsUntypedSupabaseClient {
  from(table: string): ReportsAnalyticsUntypedQueryBuilder
}

interface UserDimension {
  userId: string
  displayName: string
  email: string
  status: string
  role: string
  jobTitle: string
  gender: string
  dateOfBirth: string
  age: number | null
  ageBand: string
  lastConnectionAt: string | null
  regionId: string
  regionName: string
  zoneId: string
  zoneName: string
  teamId: string
  teamName: string
}

interface MutableUserStats {
  detail: ReportsAnalyticsUserDetailRow
  assignedCourseIds: Set<string>
  completedCourseIds: Set<string>
  progressByCourse: Map<string, number>
  completionDays: number[]
  quizScores: number[]
  activityQualityScores: number[]
  sofliaQualityScores: number[]
  notesQualityScores: number[]
  plannedMinutes: number[]
  actualMinutes: number[]
  lastActivityDates: string[]
  completedTrendCourseIds: Set<string>
}

interface MutableCourseStats {
  courseId: string
  courseTitle: string
  assignedUsers: Set<string>
  activeLearners: Set<string>
  completedUsers: Set<string>
  progressByUser: Map<string, number>
  overdueAssignments: number
  notesCount: number
  sofliaConversations: number
  activityTotal: number
  activityCompleted: number
  quizScores: number[]
}

interface BuildContext {
  users: Map<string, MutableUserStats>
  dimensions: UserDimension[]
  courses: Map<string, MutableCourseStats>
  regions: Map<string, OrganizationRegionRecord>
  zones: Map<string, OrganizationZoneRecord>
  teams: Map<string, OrganizationTeamRecord>
  completionTrendCounts: Map<string, number>
  filters: ReportsAnalyticsFilters
  aiSamples: ReportsAnalyticsAiSample[]
}

export async function fetchReportsAnalyticsDataset(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
  filters: ReportsAnalyticsFilters,
): Promise<ReportsAnalyticsDataset> {
  const queryData = await fetchReportsAnalyticsQueryData(supabase, organizationId)
  return buildReportsAnalyticsDataset(queryData, filters)
}

export function buildReportsAnalyticsDataset(
  queryData: AnalyticsQueryData,
  filters: ReportsAnalyticsFilters,
): ReportsAnalyticsDataset {
  const context = createBuildContext(queryData, filters)

  applyAssignments(context, queryData.assignments)
  applyEnrollments(context, queryData.enrollments)
  applyLessonProgress(context, queryData.lessonProgress)
  applyActivityCompletions(context, queryData.activityCompletions)
  applyActivitySubmissions(context, queryData.activitySubmissions, queryData.activityEvaluations)
  applyLessonNotes(context, queryData.lessonNotes)
  applyLiaConversations(context, queryData.liaConversations, queryData.liaMessages)
  applyQuizSubmissions(context, queryData.quizSubmissions)
  applyStudySessions(context, queryData.studySessions)

  const userDetails = finalizeUserDetails(context)
  const courses = finalizeCourses(context)
  const totalUsers = userDetails.length
  const activeLearners = userDetails.filter((user) => isActiveLearner(user)).length
  const assignedCourses = userDetails.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completedCourses = userDetails.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const overdueAssignments = userDetails.reduce((sum, user) => sum + user.overdueAssignments, 0)
  const legacyActivityTotal = queryData.activityCompletions.filter((record) =>
    shouldIncludeEngagementRecord(context, record.user_id, getCourseIdFromActivityCompletion(record), [
      record.started_at,
      record.completed_at,
      record.updated_at,
    ]),
  ).length
  const submissionActivityTotal = queryData.activitySubmissions.filter((record) =>
    shouldIncludeEngagementRecord(context, record.user_id, record.course_id, [
      record.submitted_at,
      record.last_validated_at,
      record.created_at,
      record.updated_at,
    ]),
  ).length
  const activityTotal = legacyActivityTotal + submissionActivityTotal
  const activityCompleted = userDetails.reduce((sum, user) => sum + user.activitiesCompleted, 0)
  const plannerPlanned = userDetails.reduce((sum, user) => sum + user.plannedSessions, 0)
  const plannerCompleted = userDetails.reduce((sum, user) => sum + user.completedSessions, 0)
  const usersWithSoflia = userDetails.filter((user) => user.sofliaConversations > 0).length
  const usersWithNotes = userDetails.filter((user) => user.notesCreated > 0).length

  const demographics = buildDemographics(context.dimensions)
  const learning = buildLearning(context, userDetails)
  const soflia = buildSoflia(context, queryData.liaConversations, queryData.liaMessages)
  const activities = buildActivities(
    context,
    queryData.activityCompletions,
    queryData.activitySubmissions,
    queryData.activityEvaluations,
    queryData.quizSubmissions,
  )
  const notes = buildNotes(context, queryData.lessonNotes, totalUsers)
  const planner = buildPlanner(context, queryData.studySessions)
  const quality = buildQuality(
    context,
    queryData.activityCompletions,
    queryData.activitySubmissions,
    queryData.activityEvaluations,
    queryData.liaConversations,
    queryData.liaMessages,
    queryData.quizSubmissions,
    queryData.lessonNotes,
  )
  const segments = buildSegments(userDetails)
  const rankings = buildRankings(userDetails)
  const dataQuality = buildDataQuality(context.dimensions)

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    period: {
      from: filters.from,
      to: filters.to,
    },
    filters,
    overview: {
      totalUsers,
      activeLearners,
      activeLearnerRate: calculatePercentage(activeLearners, totalUsers),
      averageProgress: calculateAverage(userDetails.map((user) => user.averageProgress)),
      completionRate: calculatePercentage(completedCourses, assignedCourses),
      averageCompletionDays: calculateAverage(userDetails.map((user) => user.averageCompletionDays)),
      overdueAssignments,
      sofliaAdoptionRate: calculatePercentage(usersWithSoflia, totalUsers),
      notesAdoptionRate: calculatePercentage(usersWithNotes, totalUsers),
      activityCompletionRate: calculatePercentage(activityCompleted, activityTotal),
      plannerAdherenceRate: calculatePercentage(plannerCompleted, plannerPlanned),
      quizAverageScore: calculateAverage(userDetails.map((user) => user.quizAverageScore)),
      qualityScore: quality.overallScore,
    },
    demographics,
    learning,
    courses,
    soflia,
    activities,
    quality,
    notes,
    planner,
    loginHeatmap: buildLoginHeatmap(context.dimensions.map((dimension) => dimension.lastConnectionAt)),
    connectionCalendar: buildConnectionCalendar(
      context.dimensions.map((dimension) => dimension.lastConnectionAt),
      filters,
    ),
    segments,
    rankings,
    dataQuality,
    filterOptions: buildFilterOptions(queryData, context.dimensions),
    userDetails,
    aiSamples: context.aiSamples,
  }
}

async function fetchReportsAnalyticsQueryData(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
): Promise<AnalyticsQueryData> {
  const organizationUsers = await fetchPagedRows<OrganizationUserRecord>('organization users', (from, to) =>
    supabase
      .from('organization_users')
      .select(`
        user_id,
        role,
        job_title,
        status,
        joined_at,
        created_at,
        region_id,
        zone_id,
        team_id,
        hierarchy_scope,
        users!organization_users_user_id_fkey (
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          date_of_birth,
          gender,
          last_login_at,
          updated_at
        )
      `)
      .eq('organization_id', organizationId)
      .range(from, to),
  )
  const organizationUserIds = uniqueValues(organizationUsers.map((record) => record.user_id))
  const hierarchySupabase = supabase as unknown as ReportsAnalyticsUntypedSupabaseClient

  const [
    regions,
    zones,
    teams,
    assignments,
    enrollments,
    lessonProgress,
    activityCompletions,
    activitySubmissions,
    lessonNotes,
    liaConversations,
    quizSubmissions,
    studySessions,
  ] = await Promise.all([
    fetchPagedRows<OrganizationRegionRecord>('organization regions', (from, to) =>
      hierarchySupabase
        .from('organization_regions')
        .select('id, name, code, is_active')
        .eq('organization_id', organizationId)
        .range(from, to),
    ),
    fetchPagedRows<OrganizationZoneRecord>('organization zones', (from, to) =>
      hierarchySupabase
        .from('organization_zones')
        .select('id, name, code, region_id, is_active')
        .eq('organization_id', organizationId)
        .range(from, to),
    ),
    fetchPagedRows<OrganizationTeamRecord>('organization teams', (from, to) =>
      hierarchySupabase
        .from('organization_teams')
        .select('id, name, code, zone_id, is_active')
        .eq('organization_id', organizationId)
        .range(from, to),
    ),
    fetchPagedRows<AssignmentRecord>('assignments', (from, to) =>
      supabase
        .from('organization_course_assignments')
        .select(`
          id,
          user_id,
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
        .eq('organization_id', organizationId)
        .range(from, to),
    ),
    fetchUserScopedRows<EnrollmentRecord>('enrollments', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('user_course_enrollments')
        .select(`
          enrollment_id,
          user_id,
          course_id,
          enrollment_status,
          overall_progress_percentage,
          enrolled_at,
          started_at,
          completed_at,
          last_accessed_at,
          updated_at,
          courses (
            id,
            title
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<LessonProgressRecord>('lesson progress', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('user_lesson_progress')
        .select(`
          progress_id,
          user_id,
          lesson_status,
          is_completed,
          time_spent_minutes,
          completed_at,
          started_at,
          last_accessed_at,
          updated_at,
          enrollment_id,
          lesson_id,
          user_course_enrollments!inner (
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<ActivityCompletionRecord>('activity completions', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('lia_activity_completions')
        .select(`
          completion_id,
          user_id,
          activity_id,
          status,
          completed_steps,
          total_steps,
          time_to_complete_seconds,
          attempts_to_complete,
          user_needed_help,
          lia_had_to_redirect,
          generated_output,
          completed_at,
          started_at,
          updated_at,
          lesson_activities (
            activity_id,
            activity_title,
            activity_type,
            lesson_id,
            course_lessons (
              lesson_id,
              module_id,
              course_modules (
                module_id,
                course_id
              )
            )
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<ActivitySubmissionRecord>('activity submissions', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('user_activity_submissions')
        .select(`
          submission_id,
          user_id,
          organization_id,
          course_id,
          lesson_id,
          activity_id,
          enrollment_id,
          status,
          response_text,
          response_payload,
          evidence_payload,
          submitted_at,
          last_validated_at,
          created_at,
          updated_at,
          courses (
            id,
            title
          ),
          lesson_activities (
            activity_id,
            activity_title,
            activity_type,
            lesson_id,
            course_lessons (
              lesson_id,
              module_id,
              course_modules (
                module_id,
                course_id
              )
            )
          )
        `)
        .eq('organization_id', organizationId)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<LessonNoteRecord>('lesson notes', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('user_lesson_notes')
        .select(`
          note_id,
          user_id,
          lesson_id,
          note_title,
          note_content,
          is_auto_generated,
          source_type,
          created_at,
          updated_at,
          course_lessons (
            lesson_id,
            module_id,
            course_modules (
              module_id,
              course_id
            )
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<LiaConversationRecord>('lia conversations', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('lia_conversations')
        .select(`
          conversation_id,
          user_id,
          course_id,
          context_type,
          conversation_completed,
          started_at,
          ended_at,
          created_at,
          updated_at,
          total_messages,
          total_lia_messages,
          total_user_messages,
          courses (
            id,
            title
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<QuizSubmissionRecord>('quiz submissions', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('user_quiz_submissions')
        .select(`
          submission_id,
          user_id,
          enrollment_id,
          lesson_id,
          activity_id,
          percentage_score,
          score,
          total_points,
          user_answers,
          is_passed,
          completed_at,
          created_at,
          updated_at,
          user_course_enrollments!inner (
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
    fetchUserScopedRows<StudySessionRecord>('study sessions', organizationUserIds, (chunk, from, to) =>
      supabase
        .from('study_sessions')
        .select(`
          id,
          user_id,
          course_id,
          status,
          start_time,
          end_time,
          completed_at,
          started_at,
          duration_minutes,
          actual_duration_minutes,
          was_rescheduled,
          updated_at,
          courses (
            id,
            title
          )
        `)
        .in('user_id', chunk)
        .range(from, to),
    ),
  ])

  const [liaMessages, activityEvaluations] = await Promise.all([
    fetchLiaMessages(supabase, liaConversations),
    fetchActivityEvaluations(supabase, activitySubmissions),
  ])

  return {
    organizationUsers,
    regions,
    zones,
    teams,
    assignments,
    enrollments,
    lessonProgress,
    activityCompletions,
    activitySubmissions,
    activityEvaluations,
    lessonNotes,
    liaConversations,
    liaMessages,
    quizSubmissions,
    studySessions,
  }
}

async function fetchUserScopedRows<T>(
  label: string,
  userIds: string[],
  queryFactory: (userIdChunk: string[], from: number, to: number) => PromiseLike<ReportsAnalyticsQueryResultLike>,
): Promise<T[]> {
  if (userIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(userIds, 300).map((chunk) =>
      fetchPagedRows<T>(label, (from, to) => queryFactory(chunk, from, to)),
    ),
  )

  return chunkResults.flat()
}

async function fetchPagedRows<T>(
  label: string,
  queryFactory: (from: number, to: number) => PromiseLike<ReportsAnalyticsQueryResultLike>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const to = from + REPORTS_ANALYTICS_PAGE_SIZE - 1
    const result = await Promise.resolve(queryFactory(from, to))
    logQueryError(label, result.error)

    const pageRows = (result.data || []) as T[]
    rows.push(...pageRows)

    if (pageRows.length < REPORTS_ANALYTICS_PAGE_SIZE) break
    from += REPORTS_ANALYTICS_PAGE_SIZE
  }

  return rows
}

async function fetchLiaMessages(
  supabase: ReportsAnalyticsSupabaseClient,
  conversations: LiaConversationRecord[],
): Promise<LiaMessageRecord[]> {
  const conversationIds = Array.from(
    new Set(conversations.map((conversation) => conversation.conversation_id).filter(Boolean)),
  )

  if (conversationIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(conversationIds, 400).map((chunk) =>
      fetchPagedRows<LiaMessageRecord>('lia messages', (from, to) =>
        supabase
        .from('lia_messages')
        .select(`
          message_id,
          conversation_id,
          role,
          content,
          created_at,
          contains_question,
          response_time_ms,
          is_off_topic,
          lia_redirected,
          lia_provided_example,
          sentiment_score,
          user_sentiment,
          tokens_used
        `)
          .in('conversation_id', chunk)
          .range(from, to),
      ),
    ),
  )

  return chunkResults.flat()
}

async function fetchActivityEvaluations(
  supabase: ReportsAnalyticsSupabaseClient,
  submissions: ActivitySubmissionRecord[],
): Promise<ActivityEvaluationRecord[]> {
  const submissionIds = Array.from(
    new Set(submissions.map((submission) => submission.submission_id).filter(Boolean)),
  )

  if (submissionIds.length === 0) return []

  const chunkResults = await Promise.all(
    chunkArray(submissionIds, 400).map((chunk) =>
      fetchPagedRows<ActivityEvaluationRecord>('activity evaluations', (from, to) =>
        supabase
          .from('user_activity_evaluations')
          .select(`
            evaluation_id,
            submission_id,
            result_status,
            feedback_payload,
            model_name,
            created_at
          `)
          .in('submission_id', chunk)
          .range(from, to),
      ),
    ),
  )

  return chunkResults.flat()
}

function createBuildContext(
  queryData: Pick<AnalyticsQueryData, 'organizationUsers' | 'regions' | 'zones' | 'teams'>,
  filters: ReportsAnalyticsFilters,
): BuildContext {
  const regions = new Map(queryData.regions.filter((region) => region.is_active !== false).map((region) => [region.id, region]))
  const zones = new Map(queryData.zones.filter((zone) => zone.is_active !== false).map((zone) => [zone.id, zone]))
  const teams = new Map(queryData.teams.filter((team) => team.is_active !== false).map((team) => [team.id, team]))
  const dimensions = queryData.organizationUsers
    .map((record) => mapUserDimension(record, { regions, zones, teams }))
    .filter((dimension): dimension is UserDimension => Boolean(dimension))
    .filter((dimension) => dimension.status !== 'removed')
    .filter((dimension) => matchesDimensionFilters(dimension, filters))

  const users = new Map<string, MutableUserStats>()
  dimensions.forEach((dimension) => {
    users.set(dimension.userId, {
      detail: {
        userId: dimension.userId,
        displayName: dimension.displayName,
        email: dimension.email,
        status: dimension.status,
        role: dimension.role,
        jobTitle: dimension.jobTitle,
        gender: dimension.gender,
        dateOfBirth: dimension.dateOfBirth,
        age: dimension.age,
        ageBand: dimension.ageBand,
        lastConnectionAt: dimension.lastConnectionAt,
        regionId: dimension.regionId,
        regionName: dimension.regionName,
        zoneId: dimension.zoneId,
        zoneName: dimension.zoneName,
        teamId: dimension.teamId,
        teamName: dimension.teamName,
        coursesAssigned: 0,
        coursesCompleted: 0,
        averageCompletionDays: 0,
        averageProgress: 0,
        overdueAssignments: 0,
        completedLessons: 0,
        timeSpentMinutes: 0,
        sofliaConversations: 0,
        sofliaMessages: 0,
        notesCreated: 0,
        activitiesCompleted: 0,
        activityAttempts: 0,
        quizAttempts: 0,
        quizAverageScore: 0,
        plannedSessions: 0,
        completedSessions: 0,
        missedSessions: 0,
        plannerAdherenceRate: 0,
        lastActivityAt: null,
        qualityScore: 0,
      },
      assignedCourseIds: new Set<string>(),
      completedCourseIds: new Set<string>(),
      progressByCourse: new Map<string, number>(),
      completionDays: [],
      quizScores: [],
      activityQualityScores: [],
      sofliaQualityScores: [],
      notesQualityScores: [],
      plannedMinutes: [],
      actualMinutes: [],
      lastActivityDates: [],
      completedTrendCourseIds: new Set<string>(),
    })
  })

  return {
    users,
    dimensions,
    courses: new Map<string, MutableCourseStats>(),
    regions,
    zones,
    teams,
    completionTrendCounts: new Map<string, number>(),
    filters,
    aiSamples: [],
  }
}

function mapUserDimension(
  record: OrganizationUserRecord,
  catalog: {
    regions: Map<string, OrganizationRegionRecord>
    zones: Map<string, OrganizationZoneRecord>
    teams: Map<string, OrganizationTeamRecord>
  },
): UserDimension | null {
  const profile = unwrapRelation(record.users)
  if (!profile) return null

  const age = calculateAge(profile.date_of_birth)
  const team = record.team_id ? catalog.teams.get(record.team_id) || null : null
  const zoneId = record.zone_id || team?.zone_id || null
  const zone = zoneId ? catalog.zones.get(zoneId) || null : null
  const regionId = record.region_id || zone?.region_id || null
  const region = regionId ? catalog.regions.get(regionId) || null : null
  const displayName =
    profile.display_name ||
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
    profile.username ||
    profile.email

  return {
    userId: record.user_id,
    displayName,
    email: profile.email,
    status: normalizeDimension(record.status || 'active'),
    role: normalizeDimension(record.role),
    jobTitle: normalizeDimension(record.job_title),
    gender: normalizeDimension(profile.gender),
    dateOfBirth: profile.date_of_birth || '',
    age,
    ageBand: getAgeBand(age),
    lastConnectionAt: resolveLastConnectionAt(profile.last_login_at, profile.updated_at),
    regionId: normalizeDimension(region?.id || regionId),
    regionName: normalizeDimension(region?.name),
    zoneId: normalizeDimension(zone?.id || zoneId),
    zoneName: normalizeDimension(zone?.name),
    teamId: normalizeDimension(team?.id || record.team_id),
    teamName: normalizeDimension(team?.name),
  }
}

function matchesDimensionFilters(dimension: UserDimension, filters: ReportsAnalyticsFilters): boolean {
  if (filters.gender && dimension.gender !== filters.gender) return false
  if (filters.ageBand && dimension.ageBand !== filters.ageBand) return false
  if (filters.jobTitle && dimension.jobTitle !== filters.jobTitle) return false
  if (filters.role && dimension.role !== filters.role) return false
  if (filters.status && dimension.status !== filters.status) return false
  if (filters.regionId && dimension.regionId !== filters.regionId) return false
  if (filters.zoneId && dimension.zoneId !== filters.zoneId) return false
  if (filters.teamId && dimension.teamId !== filters.teamId) return false
  return true
}

function applyAssignments(context: BuildContext, assignments: AssignmentRecord[]): void {
  assignments.forEach((assignment) => {
    if (
      !shouldIncludeStateRecord(context, assignment.user_id, assignment.course_id, [
        assignment.assigned_at,
        assignment.completed_at,
        assignment.due_date,
        assignment.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(assignment.user_id)
    if (!user) return

    const course = ensureCourse(context, assignment.course_id, unwrapRelation(assignment.courses)?.title)
    const progress = clampPercentage(Number(assignment.completion_percentage) || 0)
    const completed = isCompletedStatus(assignment.status) || progress >= 100 || Boolean(assignment.completed_at)

    user.assignedCourseIds.add(assignment.course_id)
    course.assignedUsers.add(assignment.user_id)
    updateCourseProgress(user, course, assignment.user_id, assignment.course_id, progress)

    if (completed) {
      const completionDays = calculateDaysBetween(assignment.assigned_at, assignment.completed_at || assignment.updated_at)
      if (completionDays !== null) user.completionDays.push(completionDays)
      recordCompletedCourse(
        context,
        user,
        course,
        assignment.user_id,
        assignment.course_id,
        assignment.completed_at || assignment.updated_at,
      )
    }

    if (isOverdueAssignment(assignment)) {
      user.detail.overdueAssignments += 1
      course.overdueAssignments += 1
    }

    pushLastActivity(user, assignment.assigned_at, assignment.completed_at, assignment.updated_at)
  })
}

function applyEnrollments(context: BuildContext, enrollments: EnrollmentRecord[]): void {
  enrollments.forEach((enrollment) => {
    if (
      !shouldIncludeStateRecord(context, enrollment.user_id, enrollment.course_id, [
        enrollment.enrolled_at,
        enrollment.started_at,
        enrollment.completed_at,
        enrollment.last_accessed_at,
        enrollment.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(enrollment.user_id)
    if (!user) return

    const course = ensureCourse(context, enrollment.course_id, unwrapRelation(enrollment.courses)?.title)
    const progress = clampPercentage(Number(enrollment.overall_progress_percentage) || 0)
    const completed = isCompletedStatus(enrollment.enrollment_status) || progress >= 100 || Boolean(enrollment.completed_at)

    user.assignedCourseIds.add(enrollment.course_id)
    course.assignedUsers.add(enrollment.user_id)
    updateCourseProgress(user, course, enrollment.user_id, enrollment.course_id, progress)
    course.activeLearners.add(enrollment.user_id)

    if (completed) {
      const completionDays = calculateDaysBetween(enrollment.enrolled_at || enrollment.started_at, enrollment.completed_at || enrollment.last_accessed_at || enrollment.updated_at)
      if (completionDays !== null) user.completionDays.push(completionDays)
      recordCompletedCourse(
        context,
        user,
        course,
        enrollment.user_id,
        enrollment.course_id,
        enrollment.completed_at || enrollment.last_accessed_at || enrollment.updated_at,
      )
    }

    pushLastActivity(user, enrollment.enrolled_at, enrollment.started_at, enrollment.completed_at, enrollment.last_accessed_at, enrollment.updated_at)
  })
}

function applyLessonProgress(context: BuildContext, records: LessonProgressRecord[]): void {
  records.forEach((record) => {
    const enrollment = unwrapRelation(record.user_course_enrollments)
    const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED

    if (
      !shouldIncludeStateRecord(context, record.user_id, courseId, [
        record.started_at,
        record.completed_at,
        record.last_accessed_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(enrollment?.courses)?.title)
    course.activeLearners.add(record.user_id)

    if (record.is_completed) {
      user.detail.completedLessons += 1
    }

    user.detail.timeSpentMinutes += Number(record.time_spent_minutes) || 0
    pushLastActivity(user, record.started_at, record.completed_at, record.last_accessed_at, record.updated_at)
  })
}

function applyActivityCompletions(context: BuildContext, records: ActivityCompletionRecord[]): void {
  records.forEach((record) => {
    const courseId = getCourseIdFromActivityCompletion(record)
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.started_at,
        record.completed_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, null)
    const completed = isCompletedStatus(record.status)
    const stepScore = record.total_steps
      ? calculatePercentage(Number(record.completed_steps) || 0, Number(record.total_steps) || 0)
      : completed ? 100 : 0
    const attemptsPenalty = Math.min(25, Math.max(0, (Number(record.attempts_to_complete) || 1) - 1) * 8)
    const helpPenalty = record.user_needed_help ? 10 : 0
    const redirectPenalty = Math.min(20, (Number(record.lia_had_to_redirect) || 0) * 5)
    const qualityScore = clampPercentage(stepScore - attemptsPenalty - helpPenalty - redirectPenalty)

    user.detail.activityAttempts += Number(record.attempts_to_complete) || 0
    user.activityQualityScores.push(qualityScore)
    course.activityTotal += 1
    course.activeLearners.add(record.user_id)

    if (completed) {
      user.detail.activitiesCompleted += 1
      course.activityCompleted += 1
    }

    pushLastActivity(user, record.started_at, record.completed_at, record.updated_at)
    pushAiSample(context, {
      source: 'activity_response',
      userId: record.user_id,
      courseId,
      courseTitle: context.courses.get(courseId)?.courseTitle,
      text: stringifySampleContent(record.generated_output),
      signals: {
        qualityScore,
        status: record.status,
        attempts: record.attempts_to_complete,
        userNeededHelp: record.user_needed_help,
        redirects: record.lia_had_to_redirect,
      },
    })
  })
}

function applyActivitySubmissions(
  context: BuildContext,
  records: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
): void {
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)

  records.forEach((record) => {
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, record.course_id, [
        record.submitted_at,
        record.last_validated_at,
        record.created_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const activity = unwrapRelation(record.lesson_activities)
    const course = ensureCourse(context, record.course_id, unwrapRelation(record.courses)?.title)
    const latestEvaluation = latestEvaluationBySubmission.get(record.submission_id) || null
    const completed = isCompletedActivitySubmission(record, latestEvaluation)
    const needsHelp = latestEvaluation?.result_status === 'revise' || record.status === 'needs_revision'
    const qualityScore = getActivitySubmissionQualityScore(record, latestEvaluation)

    user.detail.activityAttempts += 1
    user.activityQualityScores.push(qualityScore)
    course.activityTotal += 1
    course.activeLearners.add(record.user_id)

    if (completed) {
      user.detail.activitiesCompleted += 1
      course.activityCompleted += 1
    }

    pushLastActivity(user, record.submitted_at, record.last_validated_at, record.created_at, record.updated_at)
    pushAiSample(context, {
      source: 'activity_response',
      userId: record.user_id,
      courseId: record.course_id,
      courseTitle: course.courseTitle,
      text: stringifySampleContent([
        record.response_text,
        record.response_payload,
        record.evidence_payload,
        latestEvaluation?.feedback_payload,
      ].filter(Boolean)),
      signals: {
        qualityScore,
        status: record.status,
        evaluation: latestEvaluation?.result_status || null,
        userNeededHelp: needsHelp,
        activityType: activity?.activity_type || null,
      },
    })
  })
}

function applyLessonNotes(context: BuildContext, records: LessonNoteRecord[]): void {
  records.forEach((record) => {
    const courseId = getCourseIdFromLesson(record.course_lessons)
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.created_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, null)
    user.notesQualityScores.push(record.note_content ? clampPercentage(Math.min(record.note_content.length / 8, 100)) : 0)
    user.detail.notesCreated += 1
    course.notesCount += 1
    course.activeLearners.add(record.user_id)
    pushLastActivity(user, record.created_at, record.updated_at)
    pushAiSample(context, {
      source: 'note',
      userId: record.user_id,
      courseId,
      courseTitle: context.courses.get(courseId)?.courseTitle,
      text: stringifySampleContent([record.note_title, record.note_content].filter(Boolean).join('\n')),
      signals: {
        autoGenerated: record.is_auto_generated,
        sourceType: record.source_type,
      },
    })
  })
}

function applyLiaConversations(
  context: BuildContext,
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
): void {
  const messagesByConversation = messages.reduce((map, message) => {
    const list = map.get(message.conversation_id) || []
    list.push(message)
    map.set(message.conversation_id, list)
    return map
  }, new Map<string, LiaMessageRecord[]>())

  conversations.forEach((conversation) => {
    const courseId = conversation.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, conversation.user_id, courseId, [
        conversation.started_at,
        conversation.ended_at,
        conversation.created_at,
        conversation.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(conversation.user_id)
    if (!user) return

    const conversationMessages = messagesByConversation.get(conversation.conversation_id) || []
    const userMessages = conversationMessages.filter((message) => message.role === 'user')
    const offTopicMessages = userMessages.filter((message) => message.is_off_topic).length
    const redirectedMessages = conversationMessages.filter((message) => message.lia_redirected).length
    const questionMessages = userMessages.filter((message) => message.contains_question).length
    const sentimentScores = conversationMessages
      .map((message) => Number(message.sentiment_score))
      .filter((value) => Number.isFinite(value))
    const sentimentScore = sentimentScores.length > 0
      ? clampPercentage(((calculateAverage(sentimentScores) + 1) / 2) * 100)
      : 70
    const sofliaQualityScore = clampPercentage(
      sentimentScore -
        Math.min(25, offTopicMessages * 8) -
        Math.min(15, redirectedMessages * 5) +
        Math.min(10, questionMessages * 2),
    )
    const messageCount =
      Number(conversation.total_messages) ||
      conversationMessages.length ||
      Number(conversation.total_lia_messages) + Number(conversation.total_user_messages) ||
      0
    const course = ensureCourse(context, courseId, unwrapRelation(conversation.courses)?.title)

    user.detail.sofliaConversations += 1
    user.detail.sofliaMessages += messageCount
    user.sofliaQualityScores.push(sofliaQualityScore)
    course.sofliaConversations += 1
    course.activeLearners.add(conversation.user_id)
    pushLastActivity(user, conversation.started_at, conversation.ended_at, conversation.created_at, conversation.updated_at)
    userMessages.slice(0, 3).forEach((message) => {
      pushAiSample(context, {
        source: 'soflia_message',
        userId: conversation.user_id,
        courseId,
        courseTitle: unwrapRelation(conversation.courses)?.title || context.courses.get(courseId)?.courseTitle,
        text: stringifySampleContent(message.content),
        signals: {
          containsQuestion: message.contains_question,
          isOffTopic: message.is_off_topic,
          sentimentScore: message.sentiment_score ?? null,
          userSentiment: message.user_sentiment ?? null,
        },
      })
    })
  })
}

function applyQuizSubmissions(context: BuildContext, records: QuizSubmissionRecord[]): void {
  records.forEach((record) => {
    const enrollment = unwrapRelation(record.user_course_enrollments)
    const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED

    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.completed_at,
        record.created_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(enrollment?.courses)?.title)
    const score = clampPercentage(Number(record.percentage_score) || 0)

    user.detail.quizAttempts += 1
    user.quizScores.push(score)
    course.quizScores.push(score)
    course.activeLearners.add(record.user_id)
    pushLastActivity(user, record.completed_at, record.created_at, record.updated_at)
    pushAiSample(context, {
      source: 'quiz_response',
      userId: record.user_id,
      courseId,
      courseTitle: unwrapRelation(enrollment?.courses)?.title || context.courses.get(courseId)?.courseTitle,
      text: stringifySampleContent(record.user_answers),
      signals: {
        percentageScore: score,
        rawScore: record.score ?? null,
        totalPoints: record.total_points ?? null,
        passed: record.is_passed,
      },
    })
  })
}

function applyStudySessions(context: BuildContext, records: StudySessionRecord[]): void {
  records.forEach((record) => {
    const courseId = record.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, record.user_id, courseId, [
        record.start_time,
        record.end_time,
        record.completed_at,
        record.started_at,
        record.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(record.user_id)
    if (!user) return

    const course = ensureCourse(context, courseId, unwrapRelation(record.courses)?.title)
    const status = record.status.toLowerCase()

    user.detail.plannedSessions += 1
    user.plannedMinutes.push(Number(record.duration_minutes) || 0)
    if (record.actual_duration_minutes !== null) {
      user.actualMinutes.push(Number(record.actual_duration_minutes) || 0)
    }
    course.activeLearners.add(record.user_id)

    if (status === 'completed' || record.completed_at) {
      user.detail.completedSessions += 1
    }

    if (status === 'missed' || status === 'overdue' || status === 'skipped') {
      user.detail.missedSessions += 1
    }

    pushLastActivity(user, record.start_time, record.completed_at, record.started_at, record.updated_at)
  })
}

function finalizeUserDetails(context: BuildContext): ReportsAnalyticsUserDetailRow[] {
  return Array.from(context.users.values())
    .map((stats) => {
      stats.detail.coursesAssigned = stats.assignedCourseIds.size || stats.progressByCourse.size
      stats.detail.coursesCompleted = stats.completedCourseIds.size
      stats.detail.averageCompletionDays = calculateAverage(stats.completionDays)
      stats.detail.averageProgress = calculateAverage(Array.from(stats.progressByCourse.values()))
      stats.detail.quizAverageScore = calculateAverage(stats.quizScores)
      stats.detail.qualityScore = calculateQualityScore([
        stats.detail.quizAverageScore,
        calculateAverage(stats.activityQualityScores),
        calculateAverage(stats.sofliaQualityScores),
        calculateAverage(stats.notesQualityScores),
      ])
      stats.detail.plannerAdherenceRate = calculatePercentage(
        stats.detail.completedSessions,
        stats.detail.plannedSessions,
      )
      stats.detail.lastActivityAt = getLatestDate(stats.lastActivityDates)
      return stats.detail
    })
    .sort((a, b) => {
      const progressDiff = b.overdueAssignments - a.overdueAssignments
      if (progressDiff !== 0) return progressDiff
      return a.displayName.localeCompare(b.displayName)
    })
}

function finalizeCourses(context: BuildContext): ReportsAnalyticsCourseRow[] {
  return Array.from(context.courses.values())
    .filter((course) => course.courseId !== REPORTS_ANALYTICS_UNSPECIFIED || course.assignedUsers.size > 0 || course.activeLearners.size > 0)
    .map((course) => ({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      assignedUsers: course.assignedUsers.size,
      activeLearners: course.activeLearners.size,
      completedUsers: course.completedUsers.size,
      averageProgress: calculateAverage(Array.from(course.progressByUser.values())),
      overdueAssignments: course.overdueAssignments,
      notesCount: course.notesCount,
      sofliaConversations: course.sofliaConversations,
      activityCompletionRate: calculatePercentage(course.activityCompleted, course.activityTotal),
      quizAverageScore: calculateAverage(course.quizScores),
    }))
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments || a.courseTitle.localeCompare(b.courseTitle))
}

function buildDemographics(dimensions: UserDimension[]) {
  const total = dimensions.length
  const genderCounts = new Map<string, number>()
  const ageBandCounts = new Map<string, number>(REPORTS_ANALYTICS_AGE_BANDS.map((band) => [band, 0]))
  const jobTitleCounts = new Map<string, number>()
  const roleCounts = new Map<string, number>()

  dimensions.forEach((dimension) => {
    incrementMap(genderCounts, dimension.gender)
    incrementMap(ageBandCounts, dimension.ageBand)
    incrementMap(jobTitleCounts, dimension.jobTitle)
    incrementMap(roleCounts, dimension.role)
  })

  return {
    gender: buildBreakdown(genderCounts, total),
    ageBands: buildBreakdown(ageBandCounts, total),
    jobTitles: buildBreakdown(jobTitleCounts, total),
    roles: buildBreakdown(roleCounts, total),
    missingDateOfBirth: dimensions.filter((dimension) => !dimension.dateOfBirth).length,
    missingGender: dimensions.filter((dimension) => dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED).length,
    missingJobTitle: dimensions.filter((dimension) => dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED).length,
  }
}

function buildLearning(context: BuildContext, userDetails: ReportsAnalyticsUserDetailRow[]) {
  const progressCounts = new Map<string, number>(
    REPORTS_ANALYTICS_PROGRESS_BANDS.map((band) => [band, 0]),
  )

  userDetails.forEach((user) => {
    incrementMap(progressCounts, getProgressBand(user.averageProgress))
  })

  const assignedCourses = userDetails.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completedCourses = userDetails.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const completionDays = userDetails.map((user) => user.averageCompletionDays).filter((value) => value > 0)
  const completionsTrend = buildPeriodTrend(context.completionTrendCounts, context.filters)

  return {
    assignedCourses,
    completedCourses,
    inProgressCourses: userDetails.filter((user) => user.averageProgress > 0 && user.averageProgress < 100).length,
    notStartedCourses: userDetails.filter((user) => user.averageProgress === 0).length,
    overdueAssignments: userDetails.reduce((sum, user) => sum + user.overdueAssignments, 0),
    totalLessonsCompleted: userDetails.reduce((sum, user) => sum + user.completedLessons, 0),
    totalTimeSpentMinutes: userDetails.reduce((sum, user) => sum + user.timeSpentMinutes, 0),
    averageCompletionDays: calculateAverage(completionDays),
    medianCompletionDays: calculateMedian(completionDays),
    progressDistribution: buildBreakdown(progressCounts, userDetails.length),
    completionsTrend,
    completionsByMonth: completionsTrend,
  }
}

function buildSoflia(
  context: BuildContext,
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
): ReportsAnalyticsSoflia {
  const messageCountByConversation = messages.reduce((map, message) => {
    map.set(message.conversation_id, (map.get(message.conversation_id) || 0) + 1)
    return map
  }, new Map<string, number>())
  const contextCounts = new Map<string, number>()
  const conversationsTrendCounts = new Map<string, number>()
  let totalConversations = 0
  let completedConversations = 0
  let totalMessages = 0
  const activeUsers = new Set<string>()

  conversations.forEach((conversation) => {
    const courseId = conversation.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, conversation.user_id, courseId, [
        conversation.started_at,
        conversation.ended_at,
        conversation.created_at,
        conversation.updated_at,
      ])
    ) {
      return
    }

    totalConversations += 1
    totalMessages +=
      Number(conversation.total_messages) ||
      messageCountByConversation.get(conversation.conversation_id) ||
      Number(conversation.total_lia_messages) + Number(conversation.total_user_messages) ||
      0
    activeUsers.add(conversation.user_id)
    incrementMap(contextCounts, normalizeDimension(conversation.context_type))

    const trendDate = conversation.started_at || conversation.created_at
    if (trendDate) incrementMap(conversationsTrendCounts, buildPeriodKey(trendDate, context.filters.granularity))

    if (conversation.conversation_completed) {
      completedConversations += 1
    }
  })

  const conversationsTrend = buildPeriodTrend(conversationsTrendCounts, context.filters)

  return {
    totalConversations,
    totalMessages,
    activeUsers: activeUsers.size,
    averageMessagesPerConversation: calculateAverage(
      totalConversations > 0 ? [totalMessages / totalConversations] : [],
    ),
    completionRate: calculatePercentage(completedConversations, totalConversations),
    contextBreakdown: buildBreakdown(contextCounts, totalConversations),
    conversationsTrend,
    conversationsByMonth: conversationsTrend,
  }
}

function buildActivities(
  context: BuildContext,
  activities: ActivityCompletionRecord[],
  submissions: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
  quizzes: QuizSubmissionRecord[],
): ReportsAnalyticsActivities {
  const typeCounts = new Map<string, number>()
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)
  const quizScores: number[] = []
  let totalActivities = 0
  let completedActivities = 0
  let totalAttempts = 0
  let totalSeconds = 0
  let timedActivities = 0
  const usersNeedingHelp = new Set<string>()
  let redirects = 0
  let quizPassed = 0
  let quizAttempts = 0

  activities.forEach((activity) => {
    const courseId = getCourseIdFromActivityCompletion(activity)
    if (
      !shouldIncludeEngagementRecord(context, activity.user_id, courseId, [
        activity.started_at,
        activity.completed_at,
        activity.updated_at,
      ])
    ) {
      return
    }

    totalActivities += 1
    totalAttempts += Number(activity.attempts_to_complete) || 0
    if (activity.time_to_complete_seconds) {
      totalSeconds += activity.time_to_complete_seconds
      timedActivities += 1
    }
    if (isCompletedStatus(activity.status)) completedActivities += 1
    if (activity.user_needed_help) usersNeedingHelp.add(activity.user_id)
    redirects += Number(activity.lia_had_to_redirect) || 0

    const activityType = unwrapRelation(activity.lesson_activities)?.activity_type
    incrementMap(typeCounts, normalizeDimension(activityType))
  })

  submissions.forEach((submission) => {
    if (
      !shouldIncludeEngagementRecord(context, submission.user_id, submission.course_id, [
        submission.submitted_at,
        submission.last_validated_at,
        submission.created_at,
        submission.updated_at,
      ])
    ) {
      return
    }

    const latestEvaluation = latestEvaluationBySubmission.get(submission.submission_id) || null
    totalActivities += 1
    totalAttempts += 1
    if (isCompletedActivitySubmission(submission, latestEvaluation)) completedActivities += 1
    if (latestEvaluation?.result_status === 'revise' || submission.status === 'needs_revision') {
      usersNeedingHelp.add(submission.user_id)
    }

    const activityType = unwrapRelation(submission.lesson_activities)?.activity_type
    incrementMap(typeCounts, normalizeDimension(activityType))
  })

  quizzes.forEach((quiz) => {
    const enrollment = unwrapRelation(quiz.user_course_enrollments)
    const courseId = enrollment?.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, quiz.user_id, courseId, [
        quiz.completed_at,
        quiz.created_at,
        quiz.updated_at,
      ])
    ) {
      return
    }

    quizAttempts += 1
    if (quiz.is_passed) quizPassed += 1
    quizScores.push(clampPercentage(Number(quiz.percentage_score) || 0))
  })

  return {
    totalActivities,
    completedActivities,
    completionRate: calculatePercentage(completedActivities, totalActivities),
    averageAttempts: calculateAverage(totalActivities > 0 ? [totalAttempts / totalActivities] : []),
    averageTimeMinutes: calculateAverage(timedActivities > 0 ? [totalSeconds / timedActivities / 60] : []),
    usersNeedingHelp: usersNeedingHelp.size,
    redirects,
    totalEvaluations: quizAttempts,
    completedEvaluations: quizPassed,
    evaluationCompletionRate: calculatePercentage(quizPassed, quizAttempts),
    quizAttempts,
    quizPassRate: calculatePercentage(quizPassed, quizAttempts),
    quizAverageScore: calculateAverage(quizScores),
    byType: buildBreakdown(typeCounts, totalActivities),
  }
}

function buildNotes(context: BuildContext, notes: LessonNoteRecord[], totalUsers: number): ReportsAnalyticsNotes {
  const usersWithNotes = new Set<string>()
  const byCourse = new Map<string, number>()
  const courseLabels = new Map<string, string>()
  let totalNotes = 0
  let autoGenerated = 0

  notes.forEach((note) => {
    const courseId = getCourseIdFromLesson(note.course_lessons)
    if (
      !shouldIncludeEngagementRecord(context, note.user_id, courseId, [
        note.created_at,
        note.updated_at,
      ])
    ) {
      return
    }

    const course = context.courses.get(courseId)
    totalNotes += 1
    usersWithNotes.add(note.user_id)
    if (note.is_auto_generated || note.source_type === 'auto') autoGenerated += 1
    incrementMap(byCourse, courseId)
    courseLabels.set(courseId, course?.courseTitle || courseId)
  })

  return {
    totalNotes,
    usersWithNotes: usersWithNotes.size,
    adoptionRate: calculatePercentage(usersWithNotes.size, totalUsers),
    autoGenerated,
    manual: Math.max(totalNotes - autoGenerated, 0),
    byCourse: buildBreakdown(byCourse, totalNotes, courseLabels),
  }
}

function buildPlanner(context: BuildContext, sessions: StudySessionRecord[]): ReportsAnalyticsPlanner {
  const statusCounts = new Map<string, number>()
  const plannedMinutes: number[] = []
  const actualMinutes: number[] = []
  let plannedSessions = 0
  let completedSessions = 0
  let missedSessions = 0
  let rescheduledSessions = 0

  sessions.forEach((session) => {
    const courseId = session.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, session.user_id, courseId, [
        session.start_time,
        session.end_time,
        session.completed_at,
        session.started_at,
        session.updated_at,
      ])
    ) {
      return
    }

    const status = session.status.toLowerCase()
    plannedSessions += 1
    incrementMap(statusCounts, normalizeDimension(status))
    plannedMinutes.push(Number(session.duration_minutes) || 0)
    if (session.actual_duration_minutes !== null) actualMinutes.push(Number(session.actual_duration_minutes) || 0)
    if (status === 'completed' || session.completed_at) completedSessions += 1
    if (status === 'missed' || status === 'overdue' || status === 'skipped') missedSessions += 1
    if (session.was_rescheduled) rescheduledSessions += 1
  })

  return {
    plannedSessions,
    completedSessions,
    missedSessions,
    rescheduledSessions,
    adherenceRate: calculatePercentage(completedSessions, plannedSessions),
    averagePlannedMinutes: calculateAverage(plannedMinutes),
    averageActualMinutes: calculateAverage(actualMinutes),
    byStatus: buildBreakdown(statusCounts, plannedSessions),
  }
}

function buildQuality(
  context: BuildContext,
  activities: ActivityCompletionRecord[],
  submissions: ActivitySubmissionRecord[],
  evaluations: ActivityEvaluationRecord[],
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
  quizzes: QuizSubmissionRecord[],
  notes: LessonNoteRecord[],
): ReportsAnalyticsQuality {
  const includedActivities = activities.filter((activity) =>
    shouldIncludeEngagementRecord(context, activity.user_id, getCourseIdFromActivityCompletion(activity), [
      activity.started_at,
      activity.completed_at,
      activity.updated_at,
    ]),
  )
  const completedActivities = includedActivities.filter((activity) => isCompletedStatus(activity.status)).length
  const latestEvaluationBySubmission = buildLatestActivityEvaluationBySubmission(evaluations)
  const includedSubmissions = submissions.filter((submission) =>
    shouldIncludeEngagementRecord(context, submission.user_id, submission.course_id, [
      submission.submitted_at,
      submission.last_validated_at,
      submission.created_at,
      submission.updated_at,
    ]),
  )
  const completedSubmissions = includedSubmissions.filter((submission) =>
    isCompletedActivitySubmission(submission, latestEvaluationBySubmission.get(submission.submission_id) || null),
  ).length
  const usersNeedingHelp =
    includedActivities.filter((activity) => activity.user_needed_help).length +
    includedSubmissions.filter((submission) => {
      const evaluation = latestEvaluationBySubmission.get(submission.submission_id)
      return submission.status === 'needs_revision' || evaluation?.result_status === 'revise'
    }).length
  const redirects = includedActivities.reduce((sum, activity) => sum + (Number(activity.lia_had_to_redirect) || 0), 0)

  const includedQuizzes = quizzes.filter((quiz) => {
    const enrollment = unwrapRelation(quiz.user_course_enrollments)
    return shouldIncludeEngagementRecord(context, quiz.user_id, enrollment?.course_id, [
      quiz.completed_at,
      quiz.created_at,
      quiz.updated_at,
    ])
  })
  const quizScores = includedQuizzes.map((quiz) => clampPercentage(Number(quiz.percentage_score) || 0))
  const quizPassed = includedQuizzes.filter((quiz) => quiz.is_passed).length

  const conversationById = new Map(conversations.map((conversation) => [conversation.conversation_id, conversation]))
  const includedMessages = messages.filter((message) => {
    const conversation = conversationById.get(message.conversation_id)
    if (!conversation) return false
    return shouldIncludeEngagementRecord(context, conversation.user_id, conversation.course_id, [
      conversation.started_at,
      conversation.ended_at,
      conversation.created_at,
      conversation.updated_at,
      message.created_at,
    ])
  })
  const userMessages = includedMessages.filter((message) => message.role === 'user')
  const offTopicMessages = userMessages.filter((message) => message.is_off_topic).length
  const questionMessages = userMessages.filter((message) => message.contains_question).length
  const responseTimes = includedMessages
    .map((message) => Number(message.response_time_ms))
    .filter((value) => Number.isFinite(value) && value > 0)
  const sentimentScores = includedMessages
    .map((message) => Number(message.sentiment_score))
    .filter((value) => Number.isFinite(value))

  const includedNotes = notes.filter((note) =>
    shouldIncludeEngagementRecord(context, note.user_id, getCourseIdFromLesson(note.course_lessons), [
      note.created_at,
      note.updated_at,
    ]),
  )
  const notesWithContent = includedNotes.filter((note) => Boolean(note.note_content)).length

  const quizScore = calculateAverage(quizScores)
  const totalActivityEvidence = includedActivities.length + includedSubmissions.length
  const activityCompletionRate = calculatePercentage(
    completedActivities + completedSubmissions,
    totalActivityEvidence,
  )
  const helpRate = calculatePercentage(usersNeedingHelp, totalActivityEvidence)
  const redirectRate = calculatePercentage(redirects, totalActivityEvidence)
  const offTopicRate = calculatePercentage(offTopicMessages, userMessages.length)
  const questionRate = calculatePercentage(questionMessages, userMessages.length)
  const averageSentiment = sentimentScores.length > 0 ? Math.round(calculateAverage(sentimentScores) * 100) / 100 : 0
  const sofliaScore = clampPercentage(70 + questionRate * 0.15 - offTopicRate * 0.35 - redirectRate * 0.15 + averageSentiment * 10)
  const activityScore = clampPercentage(activityCompletionRate - helpRate * 0.25 - redirectRate * 0.2)
  const notesScore = calculatePercentage(notesWithContent, includedNotes.length)
  const overallScore = calculateQualityScore([quizScore, activityScore, sofliaScore, notesScore])

  return {
    overallScore,
    quizScore,
    activityScore,
    sofliaScore,
    notesScore,
    quizPassRate: calculatePercentage(quizPassed, includedQuizzes.length),
    quizAverageScore: quizScore,
    activityCompletionRate,
    helpRate,
    redirectRate,
    offTopicRate,
    questionRate,
    averageResponseTimeSeconds: calculateAverage(responseTimes.map((value) => value / 1000)),
    averageSentiment,
    evidenceCount: totalActivityEvidence + includedQuizzes.length + userMessages.length + includedNotes.length,
    radar: buildBreakdown(
      new Map([
        ['quiz', Math.round(quizScore)],
        ['activity', Math.round(activityScore)],
        ['soflia', Math.round(sofliaScore)],
        ['notes', Math.round(notesScore)],
      ]),
      100,
    ),
  }
}

function buildSegments(userDetails: ReportsAnalyticsUserDetailRow[]): ReportsAnalyticsSegments {
  return {
    ageBands: buildSegmentRows(userDetails, (user) => user.ageBand),
    gender: buildSegmentRows(userDetails, (user) => user.gender),
    jobTitles: buildSegmentRows(userDetails, (user) => user.jobTitle),
    roles: buildSegmentRows(userDetails, (user) => user.role),
  }
}

function buildSegmentRows(
  userDetails: ReportsAnalyticsUserDetailRow[],
  keySelector: (user: ReportsAnalyticsUserDetailRow) => string,
): ReportsAnalyticsSegmentRow[] {
  const groups = new Map<string, ReportsAnalyticsUserDetailRow[]>()
  userDetails.forEach((user) => {
    const key = keySelector(user)
    groups.set(key, [...(groups.get(key) || []), user])
  })

  return Array.from(groups.entries())
    .map(([key, users]) => buildSegmentRow(key, key, users))
    .sort((a, b) => b.users - a.users || b.qualityScore - a.qualityScore || a.label.localeCompare(b.label))
}

function buildSegmentRow(
  key: string,
  label: string,
  users: ReportsAnalyticsUserDetailRow[],
): ReportsAnalyticsSegmentRow {
  const assigned = users.reduce((sum, user) => sum + user.coursesAssigned, 0)
  const completed = users.reduce((sum, user) => sum + user.coursesCompleted, 0)
  const sofliaUsers = users.filter((user) => user.sofliaConversations > 0).length
  const notesUsers = users.filter((user) => user.notesCreated > 0).length

  return {
    key,
    label,
    users: users.length,
    averageProgress: calculateAverage(users.map((user) => user.averageProgress)),
    completionRate: calculatePercentage(completed, assigned),
    averageCompletionDays: calculateAverage(users.map((user) => user.averageCompletionDays).filter((value) => value > 0)),
    sofliaAdoptionRate: calculatePercentage(sofliaUsers, users.length),
    notesAdoptionRate: calculatePercentage(notesUsers, users.length),
    quizAverageScore: calculateAverage(users.map((user) => user.quizAverageScore)),
    qualityScore: calculateAverage(users.map((user) => user.qualityScore)),
  }
}

function buildRankings(userDetails: ReportsAnalyticsUserDetailRow[]) {
  return {
    regions: buildHierarchyRanking(userDetails, 'region'),
    zones: buildHierarchyRanking(userDetails, 'zone'),
    teams: buildHierarchyRanking(userDetails, 'team'),
    users: buildUserRanking(userDetails),
  }
}

function buildHierarchyRanking(
  userDetails: ReportsAnalyticsUserDetailRow[],
  type: ReportsAnalyticsHierarchyType,
): ReportsAnalyticsHierarchyRankingRow[] {
  const groups = new Map<string, ReportsAnalyticsUserDetailRow[]>()

  userDetails.forEach((user) => {
    const key = type === 'region' ? user.regionId : type === 'zone' ? user.zoneId : user.teamId
    if (!key || key === REPORTS_ANALYTICS_UNSPECIFIED) return
    groups.set(key, [...(groups.get(key) || []), user])
  })

  return Array.from(groups.entries())
    .map(([id, users]) => {
      const firstUser = users[0]
      const name = type === 'region'
        ? firstUser.regionName
        : type === 'zone'
          ? firstUser.zoneName
          : firstUser.teamName
      const segment = buildSegmentRow(id, name, users)
      const overdueAssignments = users.reduce((sum, user) => sum + user.overdueAssignments, 0)
      const rankScore = calculateRankScore({ ...segment, overdueAssignments })

      return {
        id,
        type,
        name,
        regionId: firstUser.regionId !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.regionId : undefined,
        regionName: firstUser.regionName !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.regionName : undefined,
        zoneId: firstUser.zoneId !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.zoneId : undefined,
        zoneName: firstUser.zoneName !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.zoneName : undefined,
        users: users.length,
        averageProgress: segment.averageProgress,
        completionRate: segment.completionRate,
        averageCompletionDays: segment.averageCompletionDays,
        sofliaAdoptionRate: segment.sofliaAdoptionRate,
        notesAdoptionRate: segment.notesAdoptionRate,
        qualityScore: segment.qualityScore,
        overdueAssignments,
        rankScore,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore || b.users - a.users || a.name.localeCompare(b.name))
}

function buildUserRanking(userDetails: ReportsAnalyticsUserDetailRow[]): ReportsAnalyticsUserRankingRow[] {
  return userDetails
    .map((user) => {
      const completionRate = calculatePercentage(user.coursesCompleted, user.coursesAssigned)
      const rankScore = calculateRankScore({
        averageProgress: user.averageProgress,
        completionRate,
        qualityScore: user.qualityScore,
        sofliaAdoptionRate: user.sofliaConversations > 0 ? 100 : 0,
        notesAdoptionRate: user.notesCreated > 0 ? 100 : 0,
        overdueAssignments: user.overdueAssignments,
        users: 1,
      })

      return {
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        jobTitle: user.jobTitle,
        regionName: user.regionName,
        zoneName: user.zoneName,
        teamName: user.teamName,
        averageProgress: user.averageProgress,
        completionRate,
        averageCompletionDays: user.averageCompletionDays,
        sofliaConversations: user.sofliaConversations,
        notesCreated: user.notesCreated,
        quizAverageScore: user.quizAverageScore,
        qualityScore: user.qualityScore,
        overdueAssignments: user.overdueAssignments,
        rankScore,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.displayName.localeCompare(b.displayName))
}

function buildDataQuality(dimensions: UserDimension[]) {
  const total = dimensions.length
  const missingDateOfBirth = dimensions.filter((dimension) => !dimension.dateOfBirth).length
  const missingGender = dimensions.filter((dimension) => dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED).length
  const missingJobTitle = dimensions.filter((dimension) => dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED).length
  const missingAny = dimensions.filter(
    (dimension) =>
      !dimension.dateOfBirth ||
      dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED ||
      dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED,
  ).length
  const missingFields = new Map<string, number>([
    ['date_of_birth', missingDateOfBirth],
    ['gender', missingGender],
    ['job_title', missingJobTitle],
  ])

  return {
    usersWithCompleteDemographics: total - missingAny,
    usersMissingDemographics: missingAny,
    demographicsCompletionRate: calculatePercentage(total - missingAny, total),
    missingFields: buildBreakdown(missingFields, total),
  }
}

function buildFilterOptions(
  queryData: AnalyticsQueryData,
  dimensions: UserDimension[],
): ReportsAnalyticsFilterOptions {
  const courseOptions = new Map<string, string>()

  queryData.assignments.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))
  queryData.enrollments.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))
  queryData.liaConversations.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))
  queryData.studySessions.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))

  return {
    courses: toOptions(courseOptions),
    genders: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.gender)).map((value) => [value, value]))),
    ageBands: REPORTS_ANALYTICS_AGE_BANDS.map((value) => ({ value, label: value })),
    jobTitles: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.jobTitle)).map((value) => [value, value]))),
    roles: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.role)).map((value) => [value, value]))),
    statuses: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.status)).map((value) => [value, value]))),
    regions: toOptions(
      new Map(
        queryData.regions
          .filter((region) => region.is_active !== false)
          .map((region) => [region.id, region.name || region.code || region.id]),
      ),
    ),
    zones: queryData.zones
      .filter((zone) => zone.is_active !== false)
      .map((zone) => ({
        value: zone.id,
        label: zone.name || zone.code || zone.id,
        regionId: zone.region_id || undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    teams: queryData.teams
      .filter((team) => team.is_active !== false)
      .map((team) => {
        const zone = team.zone_id ? queryData.zones.find((item) => item.id === team.zone_id) : null
        return {
          value: team.id,
          label: team.name || team.code || team.id,
          zoneId: team.zone_id || undefined,
          regionId: zone?.region_id || undefined,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}

function shouldIncludeEngagementRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateWithinPeriod(dates, context.filters)
}

function shouldIncludeStateRecord(
  context: BuildContext,
  userId: string,
  courseId: string | null | undefined,
  dates: Array<string | null | undefined>,
): boolean {
  if (!context.users.has(userId)) return false
  if (context.filters.courseId && courseId !== context.filters.courseId) return false
  return isAnyDateOnOrBefore(dates, context.filters.to)
}

function ensureCourse(
  context: BuildContext,
  courseId: string | null | undefined,
  title: string | null | undefined,
): MutableCourseStats {
  const id = courseId || REPORTS_ANALYTICS_UNSPECIFIED
  const existing = context.courses.get(id)
  if (existing) {
    if (title && existing.courseTitle === id) {
      existing.courseTitle = title
    }
    return existing
  }

  const course: MutableCourseStats = {
    courseId: id,
    courseTitle: title || id,
    assignedUsers: new Set<string>(),
    activeLearners: new Set<string>(),
    completedUsers: new Set<string>(),
    progressByUser: new Map<string, number>(),
    overdueAssignments: 0,
    notesCount: 0,
    sofliaConversations: 0,
    activityTotal: 0,
    activityCompleted: 0,
    quizScores: [],
  }

  context.courses.set(id, course)
  return course
}

function updateCourseProgress(
  user: MutableUserStats,
  course: MutableCourseStats,
  userId: string,
  courseId: string,
  progress: number,
): void {
  const currentProgress = user.progressByCourse.get(courseId) || 0
  const finalProgress = Math.max(currentProgress, progress)
  user.progressByCourse.set(courseId, finalProgress)

  const currentCourseProgress = course.progressByUser.get(userId) || 0
  course.progressByUser.set(userId, Math.max(currentCourseProgress, finalProgress))
}

function recordCompletedCourse(
  context: BuildContext,
  user: MutableUserStats,
  course: MutableCourseStats,
  userId: string,
  courseId: string,
  trendDate: string | null | undefined,
): void {
  user.completedCourseIds.add(courseId)
  course.completedUsers.add(userId)

  if (user.completedTrendCourseIds.has(courseId) || !trendDate) return
  user.completedTrendCourseIds.add(courseId)

  if (isAnyDateWithinPeriod([trendDate], context.filters)) {
    incrementMap(context.completionTrendCounts, buildPeriodKey(trendDate, context.filters.granularity))
  }
}

function isActiveLearner(user: ReportsAnalyticsUserDetailRow): boolean {
  return Boolean(
    user.coursesAssigned > 0 ||
      user.completedLessons > 0 ||
      user.timeSpentMinutes > 0 ||
      user.sofliaConversations > 0 ||
      user.notesCreated > 0 ||
      user.activitiesCompleted > 0 ||
      user.quizAttempts > 0 ||
      user.plannedSessions > 0,
  )
}

function isCompletedStatus(status: string | null | undefined): boolean {
  const normalized = status?.toLowerCase()
  return normalized === 'completed' || normalized === 'complete' || normalized === 'finished'
}

function isCompletedActivitySubmission(
  submission: ActivitySubmissionRecord,
  latestEvaluation: ActivityEvaluationRecord | null,
): boolean {
  const status = submission.status?.toLowerCase()
  return status === 'validated' || latestEvaluation?.result_status === 'pass'
}

function getActivitySubmissionQualityScore(
  submission: ActivitySubmissionRecord,
  latestEvaluation: ActivityEvaluationRecord | null,
): number {
  if (latestEvaluation?.result_status === 'pass') return 100
  if (latestEvaluation?.result_status === 'revise') return 55
  if (latestEvaluation?.result_status === 'error') return 30
  if (submission.status === 'validated') return 90
  if (submission.status === 'submitted') return 70
  if (submission.status === 'needs_revision') return 50
  return 25
}

function buildLatestActivityEvaluationBySubmission(
  evaluations: ActivityEvaluationRecord[],
): Map<string, ActivityEvaluationRecord> {
  return evaluations
    .filter((evaluation) => Boolean(evaluation.submission_id))
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
    .reduce((map, evaluation) => {
      if (!map.has(evaluation.submission_id)) {
        map.set(evaluation.submission_id, evaluation)
      }
      return map
    }, new Map<string, ActivityEvaluationRecord>())
}

function isOverdueAssignment(assignment: AssignmentRecord): boolean {
  if (!assignment.due_date) return false
  if (isCompletedStatus(assignment.status) || assignment.completed_at) return false
  return new Date(assignment.due_date) < new Date()
}

function getCourseIdFromActivityCompletion(record: ActivityCompletionRecord): string {
  const activity = unwrapRelation(record.lesson_activities)
  return getCourseIdFromLesson(activity?.course_lessons)
}

function getCourseIdFromLesson(relation: Relation<CourseLessonRelationRecord> | undefined): string {
  const lesson = unwrapRelation(relation || null)
  const module = unwrapRelation(lesson?.course_modules || null)
  return module?.course_id || REPORTS_ANALYTICS_UNSPECIFIED
}

function pushAiSample(
  context: BuildContext,
  sample: {
    source: ReportsAnalyticsAiSample['source']
    userId: string
    courseId?: string
    courseTitle?: string | null
    text: string
    signals: ReportsAnalyticsAiSample['signals']
  },
): void {
  if (!sample.text || context.aiSamples.length >= 80) return
  const dimension = context.dimensions.find((item) => item.userId === sample.userId)
  if (!dimension) return

  context.aiSamples.push({
    source: sample.source,
    anonymousUserId: `user_${context.aiSamples.length + 1}`,
    courseId: sample.courseId,
    courseTitle: sample.courseTitle || undefined,
    segment: {
      ageBand: dimension.ageBand,
      gender: dimension.gender,
      jobTitle: dimension.jobTitle,
      regionName: dimension.regionName,
      zoneName: dimension.zoneName,
      teamName: dimension.teamName,
    },
    text: redactSensitiveText(sample.text).slice(0, 900),
    signals: sample.signals,
  })
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

function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[telefono]')
    .replace(/\b[A-Z0-9._%+-]{24,}\b/gi, '[token]')
}

function pushLastActivity(user: MutableUserStats, ...dates: Array<string | null | undefined>): void {
  user.lastActivityDates.push(...dates.filter((date): date is string => Boolean(date)))
}

function unwrapRelation<T>(relation: Relation<T> | undefined): T | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0] || null
  return relation
}

function addCourseOption(
  options: Map<string, string>,
  courseId: string | null | undefined,
  title: string | null | undefined,
): void {
  if (!courseId) return
  options.set(courseId, title || courseId)
}

function toOptions(values: Map<string, string>): Array<{ value: string; label: string }> {
  return Array.from(values.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function logQueryError(label: string, error: unknown): void {
  if (!error) return
  logger.error(`Reports analytics query failed: ${label}`, error)
}
