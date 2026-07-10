import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { logger } from '@/lib/utils/logger'
import { generateCourseCompendium } from '@/features/courses/services/course-compendium.service'
import { generateLessonAutoNote } from '@/features/courses/services/lesson-auto-note.service'
import { fetchRequiredLessonQuizStatus } from '@/features/courses/services/quiz/required-quiz-status.service'
import { NoteService } from '@/features/courses/services/note.service'

import {
  claimNotebookGenerationJobs,
  finishNotebookGenerationJob,
  rescheduleNotebookGenerationJob,
} from './notebook-generation.server.service'
import { shouldWaitForLessonJobs } from './notebook-generation.helpers'
import type {
  NotebookArtifactEvidenceInput,
  NotebookGenerationJob,
} from './notebook-generation.types'
import {
  extractPublicActivityFeedback,
  normalizeVisibleAssistantRole,
} from './notebook-generation.helpers'
import { flexibleFrom } from './notebook-enrichment.server.service'

type AdminClient = ReturnType<typeof createAdminClient>

interface CourseRow {
  title: string
}

interface LiaConversationRow {
  conversation_id: string
  conversation_title: string | null
}

interface LiaMessageRow {
  content: string
  conversation_id: string
  created_at: string | null
  message_id: string
  message_sequence: number
  role: string
}

interface DialogueSessionRow {
  session_id: string
}

interface DialogueTurnRow {
  content: string
  created_at: string | null
  role: string
  session_id: string
  turn_id: string
  turn_number: number
}

interface DialogueResultRow {
  created_at: string
  result_id: string
  student_feedback: string
}

interface SubmissionRow {
  response_text: string | null
  submission_id: string
  submitted_at: string | null
}

interface EvaluationRow {
  created_at: string
  evaluation_id: string
  feedback_payload: unknown
}

interface QuizSubmissionRow {
  completed_at: string | null
  is_passed: boolean | null
  percentage_score: number | null
  submission_id: string
}

interface ActiveJobRow {
  job_id: string
}

export interface NotebookGenerationBatchResult {
  done: number
  failed: number
  partial: number
  processed: number
  rescheduled: number
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json
}

async function collectLessonEvidence(
  client: AdminClient,
  job: NotebookGenerationJob,
): Promise<NotebookArtifactEvidenceInput[]> {
  if (!job.lessonId) return []

  const { data: conversations } = await flexibleFrom(client, 'lia_conversations')
    .select('conversation_id, conversation_title')
    .eq('user_id', job.userId)
    .eq('organization_id', job.organizationId)
    .eq('enrollment_id', job.enrollmentId)
    .eq('course_id', job.courseId)
    .eq('lesson_id', job.lessonId)
    .order('created_at', { ascending: true })
    .returns<LiaConversationRow[]>()
  const conversationRows = conversations || []
  const conversationIds = conversationRows.map((row) => row.conversation_id)
  const conversationTitle = new Map(
    conversationRows.map((row) => [row.conversation_id, row.conversation_title]),
  )

  const { data: messages } = conversationIds.length
    ? await client
        .from('lia_messages')
        .select(
          'message_id, conversation_id, role, content, message_sequence, created_at',
        )
        .in('conversation_id', conversationIds)
        .eq('is_system_message', false)
        .order('created_at', { ascending: true })
        .returns<LiaMessageRow[]>()
    : { data: [] as LiaMessageRow[] }

  const { data: sessions } = await flexibleFrom(client, 'soflia_dialogue_sessions')
    .select('session_id')
    .eq('user_id', job.userId)
    .eq('enrollment_id', job.enrollmentId)
    .eq('lesson_id', job.lessonId)
    .order('created_at', { ascending: true })
    .returns<DialogueSessionRow[]>()
  const sessionIds = (sessions || []).map((row) => row.session_id)

  const [turnsResult, resultsResult, submissionsResult, quizzesResult] =
    await Promise.all([
      sessionIds.length
        ? flexibleFrom(client, 'soflia_dialogue_turns')
            .select('turn_id, session_id, role, content, turn_number, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true })
            .returns<DialogueTurnRow[]>()
        : Promise.resolve({ data: [] as DialogueTurnRow[], error: null }),
      sessionIds.length
        ? flexibleFrom(client, 'soflia_dialogue_results')
            .select('result_id, student_feedback, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true })
            .returns<DialogueResultRow[]>()
        : Promise.resolve({ data: [] as DialogueResultRow[], error: null }),
      client
        .from('user_activity_submissions')
        .select('submission_id, response_text, submitted_at')
        .eq('user_id', job.userId)
        .eq('enrollment_id', job.enrollmentId)
        .eq('lesson_id', job.lessonId)
        .order('submitted_at', { ascending: true })
        .returns<SubmissionRow[]>(),
      client
        .from('user_quiz_submissions')
        .select('submission_id, percentage_score, is_passed, completed_at')
        .eq('user_id', job.userId)
        .eq('enrollment_id', job.enrollmentId)
        .eq('lesson_id', job.lessonId)
        .order('completed_at', { ascending: true })
        .returns<QuizSubmissionRow[]>(),
    ])

  const submissions = submissionsResult.data || []
  const { data: evaluations } = submissions.length
    ? await client
        .from('user_activity_evaluations')
        .select('evaluation_id, feedback_payload, created_at')
        .in(
          'submission_id',
          submissions.map((row) => row.submission_id),
        )
        .order('created_at', { ascending: true })
        .returns<EvaluationRow[]>()
    : { data: [] as EvaluationRow[] }

  const evidence: NotebookArtifactEvidenceInput[] = []
  for (const message of messages || []) {
    const role = normalizeVisibleAssistantRole(message.role)
    if (!role || !message.content.trim()) continue
    evidence.push({
      content: message.content,
      evidence_type: 'lia_message',
      metadata: toJson({
        conversationTitle: conversationTitle.get(message.conversation_id) || null,
      }),
      occurred_at: message.created_at,
      role,
      source_id: message.message_id,
      source_sequence: message.message_sequence,
    })
  }
  for (const turn of turnsResult.data || []) {
    const role = normalizeVisibleAssistantRole(turn.role)
    if (!role || !turn.content.trim()) continue
    evidence.push({
      content: turn.content,
      evidence_type: 'dialogue_turn',
      metadata: toJson({ sessionId: turn.session_id }),
      occurred_at: turn.created_at,
      role,
      source_id: turn.turn_id,
      source_sequence: turn.turn_number,
    })
  }
  for (const result of resultsResult.data || []) {
    if (!result.student_feedback?.trim()) continue
    evidence.push({
      content: result.student_feedback,
      evidence_type: 'dialogue_feedback',
      metadata: {},
      occurred_at: result.created_at,
      role: 'feedback',
      source_id: result.result_id,
      source_sequence: 0,
    })
  }
  for (const submission of submissions) {
    if (!submission.response_text?.trim()) continue
    evidence.push({
      content: submission.response_text,
      evidence_type: 'activity_submission',
      metadata: {},
      occurred_at: submission.submitted_at,
      role: 'user',
      source_id: submission.submission_id,
      source_sequence: 0,
    })
  }
  for (const evaluation of evaluations || []) {
    extractPublicActivityFeedback(evaluation.feedback_payload).forEach(
      (content, index) => {
        evidence.push({
          content,
          evidence_type: 'activity_feedback',
          metadata: {},
          occurred_at: evaluation.created_at,
          role: 'feedback',
          source_id: evaluation.evaluation_id,
          source_sequence: index,
        })
      },
    )
  }
  for (const quiz of quizzesResult.data || []) {
    evidence.push({
      content: `Resultado: ${quiz.percentage_score ?? 0}% (${quiz.is_passed ? 'aprobado' : 'por reforzar'}).`,
      evidence_type: 'quiz_feedback',
      metadata: toJson({
        isPassed: quiz.is_passed ?? false,
        percentage: quiz.percentage_score ?? 0,
      }),
      occurred_at: quiz.completed_at,
      role: 'feedback',
      source_id: quiz.submission_id,
      source_sequence: 0,
    })
  }

  return evidence.sort((left, right) =>
    (left.occurred_at || '').localeCompare(right.occurred_at || ''),
  )
}

async function collectCourseEvidence(
  client: AdminClient,
  job: NotebookGenerationJob,
): Promise<NotebookArtifactEvidenceInput[]> {
  const notes = await NoteService.getNotesByCourseWithClient(
    client,
    job.userId,
    job.courseId,
    job.enrollmentId,
  )
  return notes.map((note, index) => ({
    content: note.note_content,
    evidence_type: 'course_note',
    metadata: toJson({
      lessonId: note.lesson_id,
      sourceType: note.source_type || 'manual',
      title: note.note_title,
    }),
    occurred_at: note.updated_at,
    role: 'content',
    source_id: note.note_id,
    source_sequence: index,
  }))
}

async function getCourseTitle(
  client: AdminClient,
  courseId: string,
): Promise<string> {
  const { data, error } = await client
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single<CourseRow>()
  if (error || !data) {
    throw new Error(`COURSE_NOT_FOUND:${error?.message || courseId}`)
  }
  return data.title
}

async function activeLessonJobCount(
  client: AdminClient,
  job: NotebookGenerationJob,
): Promise<number> {
  const { data, error } = await flexibleFrom(client, 'notebook_ai_generation_jobs')
    .select('job_id')
    .eq('job_type', 'lesson_auto_note')
    .eq('user_id', job.userId)
    .eq('enrollment_id', job.enrollmentId)
    .eq('course_id', job.courseId)
    .in('status', ['pending', 'processing', 'failed'])
    .limit(500)
    .returns<ActiveJobRow[]>()
  if (error) throw new Error(error.message)
  return (data || []).length
}

async function processLessonJob(
  client: AdminClient,
  job: NotebookGenerationJob,
  workerId: string,
): Promise<'done' | 'partial'> {
  if (!job.lessonId) throw new Error('LESSON_JOB_WITHOUT_LESSON')
  const [courseTitle, quizStatus, evidence] = await Promise.all([
    getCourseTitle(client, job.courseId),
    fetchRequiredLessonQuizStatus(client, {
      enrollmentId: job.enrollmentId,
      lessonId: job.lessonId,
      userId: job.userId,
    }),
    collectLessonEvidence(client, job),
  ])

  const generated = await generateLessonAutoNote({
    allowUpdate: true,
    courseId: job.courseId,
    courseTitle,
    enrollmentId: job.enrollmentId,
    lessonId: job.lessonId,
    organizationId: job.organizationId,
    quizStatus,
    supabase: client,
    userId: job.userId,
  })
  if (!generated.noteId) {
    throw new Error(generated.error || generated.reason || 'LESSON_NOTE_NOT_CREATED')
  }

  const quality = generated.quality || 'ai'
  await finishNotebookGenerationJob({
    artifactStatus: quality === 'ai' ? 'ready' : 'partial',
    client,
    evidence,
    jobId: job.jobId,
    lastError: generated.warning || null,
    noteId: generated.noteId,
    outcome: 'done',
    structuredSummary: {
      evidenceCount: evidence.length,
      quality,
    },
    workerId,
  })
  return quality === 'ai' ? 'done' : 'partial'
}

async function processCourseJob(
  client: AdminClient,
  job: NotebookGenerationJob,
  workerId: string,
): Promise<'done' | 'partial' | 'rescheduled'> {
  const activeJobs = await activeLessonJobCount(client, job)
  if (
    shouldWaitForLessonJobs({
      activeLessonJobs: activeJobs,
      courseJobCreatedAt: job.createdAt,
    })
  ) {
    await rescheduleNotebookGenerationJob({
      client,
      delaySeconds: 60,
      jobId: job.jobId,
      reason: 'WAITING_FOR_LESSON_NOTES',
      workerId,
    })
    return 'rescheduled'
  }

  const [courseTitle, evidence] = await Promise.all([
    getCourseTitle(client, job.courseId),
    collectCourseEvidence(client, job),
  ])
  const generated = await generateCourseCompendium({
    allowUpdate: true,
    courseId: job.courseId,
    courseTitle,
    enrollmentId: job.enrollmentId,
    organizationId: job.organizationId,
    userId: job.userId,
  })
  if (!generated.noteId) {
    throw new Error(generated.error || generated.reason || 'COMPENDIUM_NOT_CREATED')
  }

  const missingArtifacts = activeJobs > 0 ? [`${activeJobs}:lesson_jobs`] : []
  const quality = generated.quality || 'ai'
  const partial = quality === 'deterministic' || missingArtifacts.length > 0
  await finishNotebookGenerationJob({
    artifactStatus: partial ? 'partial' : 'ready',
    client,
    evidence,
    jobId: job.jobId,
    lastError: generated.warning || null,
    missingArtifacts,
    noteId: generated.noteId,
    outcome: 'done',
    structuredSummary: {
      evidenceCount: evidence.length,
      quality,
    },
    workerId,
  })
  return partial ? 'partial' : 'done'
}

export async function processNotebookGenerationJobs(input: {
  limit: number
  maxRuntimeMs: number
  workerId?: string
}): Promise<NotebookGenerationBatchResult> {
  const client = createAdminClient()
  const workerId = input.workerId || `notebook-worker-${crypto.randomUUID()}`
  const startedAt = Date.now()
  const result: NotebookGenerationBatchResult = {
    done: 0,
    failed: 0,
    partial: 0,
    processed: 0,
    rescheduled: 0,
  }
  const jobs = await claimNotebookGenerationJobs({
    client,
    leaseSeconds: 300,
    limit: input.limit,
    workerId,
  })

  for (const job of jobs) {
    if (Date.now() - startedAt >= input.maxRuntimeMs) break
    result.processed += 1
    try {
      const outcome =
        job.jobType === 'lesson_auto_note'
          ? await processLessonJob(client, job, workerId)
          : await processCourseJob(client, job, workerId)
      result[outcome] += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GENERATION_FAILED'
      logger.error('Notebook generation job failed', {
        error: message,
        jobId: job.jobId,
        jobType: job.jobType,
      })
      try {
        await finishNotebookGenerationJob({
          artifactStatus: 'failed',
          client,
          evidence:
            job.jobType === 'lesson_auto_note'
              ? await collectLessonEvidence(client, job)
              : await collectCourseEvidence(client, job),
          jobId: job.jobId,
          lastError: message,
          outcome: 'failed',
          workerId,
        })
      } catch (finishError) {
        logger.error('Notebook generation job could not be finalized', {
          error:
            finishError instanceof Error ? finishError.message : finishError,
          jobId: job.jobId,
        })
      }
      result.failed += 1
    }
  }

  return result
}
