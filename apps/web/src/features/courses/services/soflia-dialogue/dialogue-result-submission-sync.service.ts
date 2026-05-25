import type { DialogueSessionResult } from '../../types/dialogue-runtime'
import {
  persistActivitySubmissionPayload,
  recalculateLessonActivityProgress,
  type CourseActivityContext,
} from '../activity-submission.server.service'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import type { DialogueSessionRow } from './dialogue-tables'
import { readPersistedDialogueScore } from './dialogue-result-payload.utils'

type ActivitySubmissionClient = Parameters<typeof persistActivitySubmissionPayload>[0]

function shouldKeepExistingValidatedSubmission(input: {
  persistedScore: number | null
  result: DialogueSessionResult
}) {
  return (
    input.result.activityResult !== 'completed'
    || (input.persistedScore !== null && input.persistedScore > input.result.score)
  )
}

export async function syncDialogueResultToActivitySubmission(input: {
  client: unknown
  context: CourseActivityContext
  result: DialogueSessionResult
  session: DialogueSessionRow
}) {
  const now = new Date().toISOString()
  const client = input.client as ActivitySubmissionClient
  const { data: existingSubmission, error: lookupError } = await client
    .from('user_activity_submissions')
    .select('status, response_payload')
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el mejor resultado de actividad',
      { message: lookupError.message },
    )
  }

  if (existingSubmission?.status === 'validated') {
    const persistedScore = readPersistedDialogueScore(existingSubmission.response_payload)

    if (shouldKeepExistingValidatedSubmission({ persistedScore, result: input.result })) {
      return
    }
  }

  const { data, error } = await persistActivitySubmissionPayload(
    client,
    {
      activity_id: input.context.activity.activity_id,
      course_id: input.context.courseId,
      enrollment_id: input.context.enrollmentId,
      evidence_payload: {
        criteriaMet: input.result.criteriaMet,
        criteriaMissing: input.result.criteriaMissing,
        evidenceQuotes: input.result.evidenceQuotes,
        sessionId: input.session.session_id,
      },
      last_validated_at: now,
      lesson_id: input.context.lessonId,
      organization_id: input.context.organizationId,
      response_payload: {
        dialogueResult: input.result,
        sessionId: input.session.session_id,
      },
      response_text: input.result.studentFeedback,
      status: input.result.activityResult === 'completed' ? 'validated' : 'needs_revision',
      submitted_at: now,
      updated_at: now,
      user_id: input.context.userId,
    },
    'submission_id',
  )

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible sincronizar el resultado con el progreso de actividad',
      { message: error?.message },
    )
  }

  await recalculateLessonActivityProgress(
    input.client as Parameters<typeof recalculateLessonActivityProgress>[0],
    input.context,
  )
}
