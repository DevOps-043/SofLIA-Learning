import { createClient } from '@/lib/supabase/server'

import {
  resolveActivityConfigFromRecord,
} from './activity-content-compatibility.service'
import {
  normalizeActivityEvaluationFeedback,
  type ActivityConfig,
  type ActivityEvaluationRecord,
  type ActivitySubmissionDetail,
  type ActivitySubmissionRequest,
  type ActivitySubmissionStatus,
  type ActivitySubmissionSummary,
} from '../types/activity-config'
import {
  getActivitySubmissionRequirementIssues,
  summarizeActivitySubmissionRequirementIssues,
} from './activity-submission-requirements.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type CourseRow = {
  id: string
  title: string
  instructor_id: string | null
}

type EnrollmentRow = {
  enrollment_id: string
  organization_id: string | null
}

type ActivityLikeRecord = Record<string, unknown> & {
  activity_id: string
  activity_title?: string | null
  activity_description?: string | null
  activity_type?: string | null
  is_required?: boolean | null
  activity_config?: unknown
  requires_soflia_validation?: boolean | null
  external_tool_key?: string | null
  activity_content?: unknown
  ai_prompts?: unknown
}

type ActivitySubmissionRow = {
  activity_id: string
  created_at: string | null
  evidence_payload: Record<string, unknown> | null
  last_validated_at: string | null
  response_payload: Record<string, unknown>
  response_text: string | null
  status: ActivitySubmissionStatus
  submission_id: string
  submitted_at: string | null
  updated_at: string | null
}

type ActivityEvaluationRow = {
  created_at: string
  evaluation_id: string
  feedback_payload: unknown
  result_status: 'pass' | 'revise' | 'error'
  submission_id: string
}

export interface CourseLessonContext {
  courseId: string
  courseTitle: string
  enrollmentId: string
  instructorId: string | null
  lessonId: string
  organizationId: string | null
  userId: string
}

export interface CourseActivityContext extends CourseLessonContext {
  activity: ActivityLikeRecord
  resolvedActivityConfig: ActivityConfig | null
}

export type CourseActivityErrorCode =
  | 'COURSE_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'ENROLLMENT_NOT_FOUND'
  | 'ACTIVITY_NOT_FOUND'
  | 'ACTIVITY_NOT_INTERACTIVE'
  | 'SUBMISSION_NOT_FOUND'
  | 'INVALID_SUBMISSION'
  | 'VALIDATION_NOT_ENABLED'
  | 'VALIDATION_UNAVAILABLE'
  | 'VALIDATION_FAILED'

export class CourseActivityError extends Error {
  constructor(
    public readonly code: CourseActivityErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CourseActivityError'
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getPayloadText(
  responseText: string | null | undefined,
  responsePayload: Record<string, unknown>,
): string {
  const directText = normalizeText(responseText)
  if (directText) {
    return directText
  }

  return normalizeText(responsePayload.text)
}

function getEvidenceText(evidencePayload: Record<string, unknown> | null): string {
  return normalizeText(evidencePayload?.text)
}

function getInlineAnswerMap(responsePayload: Record<string, unknown>) {
  const answers = responsePayload.answers
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {}
  }

  return answers as Record<string, unknown>
}

function getChecklistMap(responsePayload: Record<string, unknown>) {
  const checklist = responsePayload.checklist
  if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) {
    return {}
  }

  return checklist as Record<string, unknown>
}

export function hasAnyActivityResponse(
  activityConfig: ActivityConfig,
  submission: Pick<
    ActivitySubmissionRow,
    'response_payload' | 'response_text' | 'evidence_payload'
  >,
) {
  if (activityConfig.interactionType === 'soflia_dialogue') {
    return submission.status !== 'draft'
  }

  const responseText = getPayloadText(
    submission.response_text,
    submission.response_payload,
  )
  const evidenceText = getEvidenceText(submission.evidence_payload)

  if (responseText || evidenceText) {
    return true
  }

  if (activityConfig.interactionType === 'inline_answers') {
    return Object.values(getInlineAnswerMap(submission.response_payload)).some(
      (value) => normalizeText(value).length > 0,
    )
  }

  if (activityConfig.interactionType === 'checklist') {
    return Object.values(getChecklistMap(submission.response_payload)).some(
      (value) => value === true,
    )
  }

  return false
}

export function isActivitySubmissionCompletionSatisfied(
  activityConfig: ActivityConfig,
  submission: Pick<
    ActivitySubmissionRow,
    'status' | 'response_payload' | 'response_text' | 'evidence_payload'
  >,
  latestEvaluation: ActivityEvaluationRow | null,
) {
  if (activityConfig.interactionType === 'soflia_dialogue') {
    return submission.status === 'validated'
  }

  if (submission.status === 'draft') {
    return false
  }

  const responseText = getPayloadText(
    submission.response_text,
    submission.response_payload,
  )

  if (
    activityConfig.interactionType === 'long_text' ||
    activityConfig.interactionType === 'external_tool_task'
  ) {
    if (!responseText) {
      return false
    }
  }

  if (activityConfig.interactionType === 'inline_answers') {
    const answers = getInlineAnswerMap(submission.response_payload)
    const areRequiredAnswersPresent =
      activityConfig.submission.fields
        .filter((field) => field.required)
        .every((field) => normalizeText(answers[field.id]).length > 0)

    if (!areRequiredAnswersPresent) {
      return false
    }
  }

  if (activityConfig.interactionType === 'checklist') {
    const checklist = getChecklistMap(submission.response_payload)
    const areRequiredChecklistItemsCompleted =
      activityConfig.submission.checklistItems
        .filter((item) => item.required)
        .every((item) => checklist[item.id] === true)

    if (!areRequiredChecklistItemsCompleted) {
      return false
    }
  }

  if (activityConfig.submission.requireEvidence) {
    const evidenceText = getEvidenceText(submission.evidence_payload)
    if (!evidenceText) {
      return false
    }
  }

  if (activityConfig.validation.requiredForCompletion) {
    return latestEvaluation?.result_status === 'pass'
  }

  return true
}

function toActivityEvaluationRecord(
  evaluation: ActivityEvaluationRow | null,
): ActivityEvaluationRecord | null {
  if (!evaluation) {
    return null
  }

  return {
    evaluationId: evaluation.evaluation_id,
    resultStatus: evaluation.result_status,
    createdAt: evaluation.created_at,
    feedback: normalizeActivityEvaluationFeedback(evaluation.feedback_payload),
  }
}

export function createActivitySubmissionSummary(
  activityConfig: ActivityConfig,
  submission: ActivitySubmissionRow,
  latestEvaluation: ActivityEvaluationRow | null,
): ActivitySubmissionSummary {
  return {
    submissionId: submission.submission_id,
    status: submission.status,
    completionSatisfied: isActivitySubmissionCompletionSatisfied(
      activityConfig,
      submission,
      latestEvaluation,
    ),
    submittedAt: submission.submitted_at,
    lastValidatedAt: submission.last_validated_at,
    updatedAt: submission.updated_at,
    latestEvaluation: toActivityEvaluationRecord(latestEvaluation),
  }
}

async function resolveCourseBySlug(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('slug', slug)
    .single()

  if (error || !course) {
    throw new CourseActivityError('COURSE_NOT_FOUND', 404, 'Curso no encontrado')
  }

  return course as CourseRow
}

async function ensureLessonBelongsToCourse(
  supabase: SupabaseServerClient,
  courseId: string,
  lessonId: string,
) {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .select(
      `
        lesson_id,
        module_id,
        course_modules!inner (
          module_id,
          course_id
        )
      `,
    )
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  if (error || !lesson) {
    throw new CourseActivityError(
      'LESSON_NOT_FOUND',
      404,
      'Leccion no encontrada o fuera del curso',
    )
  }
}

async function resolveEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
) {
  const { data: enrollment, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error || !enrollment) {
    throw new CourseActivityError(
      'ENROLLMENT_NOT_FOUND',
      404,
      'No estas inscrito en este curso',
    )
  }

  return enrollment as EnrollmentRow
}

async function loadLatestEvaluationMap(
  supabase: SupabaseServerClient,
  submissionIds: string[],
) {
  if (submissionIds.length === 0) {
    return new Map<string, ActivityEvaluationRow>()
  }

  const { data: evaluations } = await supabase
    .from('user_activity_evaluations')
    .select('submission_id, evaluation_id, result_status, feedback_payload, created_at')
    .in('submission_id', submissionIds)
    .order('created_at', { ascending: false })

  const evaluationMap = new Map<string, ActivityEvaluationRow>()
  ;((evaluations || []) as ActivityEvaluationRow[]).forEach((evaluation) => {
    if (!evaluationMap.has(evaluation.submission_id)) {
      evaluationMap.set(evaluation.submission_id, evaluation)
    }
  })

  return evaluationMap
}

export async function resolveCourseLessonContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
): Promise<CourseLessonContext> {
  const course = await resolveCourseBySlug(supabase, slug)
  await ensureLessonBelongsToCourse(supabase, course.id, lessonId)
  const enrollment = await resolveEnrollment(supabase, userId, course.id)

  return {
    courseId: course.id,
    courseTitle: course.title,
    enrollmentId: enrollment.enrollment_id,
    instructorId: course.instructor_id,
    lessonId,
    organizationId: enrollment.organization_id,
    userId,
  }
}

export async function resolveCourseActivityContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  activityId: string,
): Promise<CourseActivityContext> {
  const lessonContext = await resolveCourseLessonContext(
    supabase,
    userId,
    slug,
    lessonId,
  )

  const { data: activity, error } = await supabase
    .from('lesson_activities')
    .select(
      'activity_id, activity_title, activity_description, activity_type, is_required, activity_config, requires_soflia_validation, external_tool_key, activity_content, ai_prompts',
    )
    .eq('lesson_id', lessonId)
    .eq('activity_id', activityId)
    .single()

  if (error || !activity) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_FOUND',
      404,
      'Actividad no encontrada',
    )
  }

  const resolvedActivityConfig = resolveActivityConfigFromRecord(
    activity as ActivityLikeRecord,
  )

  if (!resolvedActivityConfig) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_INTERACTIVE',
      400,
      'La actividad usa un flujo especializado y no admite submissions directas',
    )
  }

  return {
    ...lessonContext,
    activity: activity as ActivityLikeRecord,
    resolvedActivityConfig,
  }
}

export async function buildActivitySubmissionSummaryMap(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
  activities: ActivityLikeRecord[],
) {
  const interactiveActivities = activities.filter((activity) =>
    Boolean(resolveActivityConfigFromRecord(activity)),
  )

  const activityIds = interactiveActivities.map((activity) => activity.activity_id)
  if (activityIds.length === 0) {
    return new Map<string, ActivitySubmissionSummary>()
  }

  const { data: submissions } = await supabase
    .from('user_activity_submissions')
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)
    .in('activity_id', activityIds)

  const submissionRows = (submissions || []) as ActivitySubmissionRow[]
  const evaluationMap = await loadLatestEvaluationMap(
    supabase,
    submissionRows.map((submission) => submission.submission_id),
  )

  const submissionByActivityId = new Map(
    submissionRows.map((submission) => [submission.activity_id, submission]),
  )
  const summaryMap = new Map<string, ActivitySubmissionSummary>()

  interactiveActivities.forEach((activity) => {
    const submission = submissionByActivityId.get(activity.activity_id)
    if (!submission) {
      return
    }

    const resolvedConfig = resolveActivityConfigFromRecord(activity)
    if (!resolvedConfig) {
      return
    }

    summaryMap.set(
      activity.activity_id,
      createActivitySubmissionSummary(
        resolvedConfig,
        submission,
        evaluationMap.get(submission.submission_id) || null,
      ),
    )
  })

  return summaryMap
}

export async function getActivitySubmissionDetail(
  supabase: SupabaseServerClient,
  context: CourseActivityContext,
) {
  const { data: submission } = await supabase
    .from('user_activity_submissions')
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)
    .eq('activity_id', context.activity.activity_id)
    .maybeSingle()

  if (!submission || !context.resolvedActivityConfig) {
    return null
  }

  const activitySubmission = submission as ActivitySubmissionRow
  const evaluationMap = await loadLatestEvaluationMap(supabase, [
    activitySubmission.submission_id,
  ])

  const summary = createActivitySubmissionSummary(
    context.resolvedActivityConfig,
    activitySubmission,
    evaluationMap.get(activitySubmission.submission_id) || null,
  )

  const detail: ActivitySubmissionDetail = {
    ...summary,
    responseText: activitySubmission.response_text,
    responsePayload: toRecord(activitySubmission.response_payload),
    evidencePayload: activitySubmission.evidence_payload
      ? toRecord(activitySubmission.evidence_payload)
      : null,
  }

  return detail
}

function buildSubmissionUpsertPayload(
  context: CourseActivityContext,
  request: ActivitySubmissionRequest,
  now: string,
) {
  const responsePayload = toRecord(request.responsePayload)
  const evidencePayload = request.evidencePayload
    ? toRecord(request.evidencePayload)
    : null

  return {
    activity_id: context.activity.activity_id,
    course_id: context.courseId,
    enrollment_id: context.enrollmentId,
    evidence_payload: evidencePayload,
    last_validated_at: null,
    lesson_id: context.lessonId,
    organization_id: context.organizationId,
    response_payload: responsePayload,
    response_text: request.responseText?.trim() || null,
    status: request.status,
    submitted_at: request.status === 'submitted' ? now : null,
    updated_at: now,
    user_id: context.userId,
  }
}

export async function saveActivitySubmission(
  supabase: SupabaseServerClient,
  context: CourseActivityContext,
  request: ActivitySubmissionRequest,
) {
  if (!context.resolvedActivityConfig) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_INTERACTIVE',
      400,
      'La actividad no tiene un contrato interactivo disponible',
    )
  }

  const now = new Date().toISOString()
  const submissionPayload = buildSubmissionUpsertPayload(context, request, now)

  const submissionRequirementIssues =
    request.status === 'submitted'
      ? getActivitySubmissionRequirementIssues(
          context.resolvedActivityConfig,
          {
            responsePayload: submissionPayload.response_payload,
            responseText: submissionPayload.response_text,
            evidencePayload: submissionPayload.evidence_payload,
          },
        )
      : []

  if (submissionRequirementIssues.length > 0) {
    const issues = submissionRequirementIssues

    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      400,
      summarizeActivitySubmissionRequirementIssues(issues),
      {
        issues: issues.map((issue) => issue.code),
      },
    )
  }

  const { data: submission, error } = await supabase
    .from('user_activity_submissions')
    .upsert(submissionPayload, {
      onConflict: 'user_id,activity_id,enrollment_id',
    })
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .single()

  if (error || !submission) {
    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      500,
      'No fue posible guardar la actividad',
      {
        message: error?.message,
      },
    )
  }

  await recalculateLessonActivityProgress(supabase, context)

  return getActivitySubmissionDetail(supabase, context)
}

type LessonActivityProgressSummary = {
  activityProgressPercentage: number
  lastActivitySubmissionAt: string | null
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
}

export async function computeLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
): Promise<LessonActivityProgressSummary> {
  const { data: activities } = await supabase
    .from('lesson_activities')
    .select(
      'activity_id, activity_type, is_required, activity_config, requires_soflia_validation, external_tool_key, activity_content, ai_prompts',
    )
    .eq('lesson_id', context.lessonId)
    .order('activity_order_index', { ascending: true })

  const interactiveActivities = ((activities || []) as ActivityLikeRecord[]).filter(
    (activity) => Boolean(resolveActivityConfigFromRecord(activity)),
  )

  const requiredActivities = interactiveActivities.filter(
    (activity) => Boolean(activity.is_required),
  )

  if (interactiveActivities.length === 0) {
    return {
      activityProgressPercentage: 100,
      lastActivitySubmissionAt: null,
      requiredActivitiesCompleted: 0,
      requiredActivitiesTotal: 0,
    }
  }

  const summaryMap = await buildActivitySubmissionSummaryMap(
    supabase,
    context,
    interactiveActivities,
  )

  const requiredActivitiesCompleted = requiredActivities.filter((activity) => {
    return summaryMap.get(activity.activity_id)?.completionSatisfied === true
  }).length

  const { data: submissions } = await supabase
    .from('user_activity_submissions')
    .select('submitted_at, updated_at')
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)

  const lastActivitySubmissionAt = ((submissions || []) as Array<{
    submitted_at: string | null
    updated_at: string | null
  }>).reduce<string | null>((latest, submission) => {
    const candidate = submission.submitted_at || submission.updated_at
    if (!candidate) {
      return latest
    }

    if (!latest) {
      return candidate
    }

    return candidate > latest ? candidate : latest
  }, null)

  const requiredActivitiesTotal = requiredActivities.length
  const activityProgressPercentage =
    requiredActivitiesTotal === 0
      ? 100
      : Math.round(
          (requiredActivitiesCompleted / requiredActivitiesTotal) * 100 * 100,
        ) / 100

  return {
    activityProgressPercentage,
    lastActivitySubmissionAt,
    requiredActivitiesCompleted,
    requiredActivitiesTotal,
  }
}

export async function recalculateLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
) {
  const summary = await computeLessonActivityProgress(supabase, context)
  const now = new Date().toISOString()

  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('progress_id')
    .eq('enrollment_id', context.enrollmentId)
    .eq('lesson_id', context.lessonId)
    .maybeSingle()

  if (existingProgress?.progress_id) {
    await supabase
      .from('user_lesson_progress')
      .update({
        activity_progress_percentage: summary.activityProgressPercentage,
        last_activity_submission_at: summary.lastActivitySubmissionAt,
        last_accessed_at: now,
        required_activities_completed: summary.requiredActivitiesCompleted,
        required_activities_total: summary.requiredActivitiesTotal,
        updated_at: now,
      })
      .eq('progress_id', existingProgress.progress_id)

    return summary
  }

  await supabase.from('user_lesson_progress').insert({
    activity_progress_percentage: summary.activityProgressPercentage,
    enrollment_id: context.enrollmentId,
    last_activity_submission_at: summary.lastActivitySubmissionAt,
    last_accessed_at: now,
    lesson_id: context.lessonId,
    organization_id: context.organizationId,
    required_activities_completed: summary.requiredActivitiesCompleted,
    required_activities_total: summary.requiredActivitiesTotal,
    started_at: now,
    user_id: context.userId,
  })

  return summary
}
