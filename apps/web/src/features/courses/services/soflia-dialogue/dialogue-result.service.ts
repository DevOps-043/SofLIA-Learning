import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialogueSessionResult,
} from '../../types/dialogue-runtime'
import {
  recalculateLessonActivityProgress,
  type CourseActivityContext,
} from '../activity-submission.server.service'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import { dialogueResultsTable, type DialogueSessionRow } from './dialogue-tables'

function buildStudentFeedback(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  completed: boolean
}) {
  if (input.completed) {
    return input.evaluation.feedbackForTutor
      ? `Actividad completada. ${input.evaluation.feedbackForTutor}`
      : 'Actividad completada. Tu respuesta muestra comprension suficiente del escenario.'
  }

  return input.evaluation.feedbackForTutor
    ? `Necesitas reintentar. ${input.evaluation.feedbackForTutor}`
    : `Necesitas reintentar. Revisa este modelo de referencia: ${input.config.rescueContent}`
}

export function buildDialogueSessionResult(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  completed: boolean
}): DialogueSessionResult {
  return {
    activityResult: input.completed ? 'completed' : 'needs_retry',
    analyticsTags: [
      input.completed ? 'dialogue_completed' : 'dialogue_needs_retry',
      input.evaluation.criteriaMissing.length > 0
        ? 'criteria_missing'
        : 'criteria_met',
    ],
    criteriaMet: input.evaluation.criteriaMet,
    criteriaMissing: input.evaluation.criteriaMissing,
    evidenceQuotes: input.evaluation.evidenceQuotes,
    instructorSummary: input.evaluation.backendNotes,
    recommendations: input.evaluation.criteriaMissing.map(
      (criterionId) => `Reforzar criterio: ${criterionId}`,
    ),
    score: input.evaluation.overallScore,
    studentFeedback: buildStudentFeedback(input),
  }
}

async function syncDialogueResultToActivitySubmission(input: {
  client: unknown
  context: CourseActivityContext
  result: DialogueSessionResult
  session: DialogueSessionRow
}) {
  const now = new Date().toISOString()
  const client = input.client as {
    from: (table: string) => {
      upsert: (
        payload: Record<string, unknown>,
        options: Record<string, unknown>,
      ) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: { submission_id: string } | null
            error: { message: string } | null
          }>
        }
      }
    }
  }

  const { data, error } = await client
    .from('user_activity_submissions')
    .upsert(
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
        status:
          input.result.activityResult === 'completed'
            ? 'validated'
            : 'needs_revision',
        submitted_at: now,
        updated_at: now,
        user_id: input.context.userId,
      },
      {
        onConflict: 'user_id,activity_id,enrollment_id',
      },
    )
    .select('submission_id')
    .single()

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

export async function persistDialogueResult(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
  evaluation: DialogueEvaluationResult
  session: DialogueSessionRow
  shouldComplete: boolean
}) {
  const result = buildDialogueSessionResult({
    completed: input.shouldComplete,
    config: input.config,
    evaluation: input.evaluation,
  })

  const existing = await dialogueResultsTable(input.client)
    .select('*')
    .eq('session_id', input.session.session_id)
    .maybeSingle()

  if (existing.error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el resultado del dialogo',
      { message: existing.error.message },
    )
  }

  if (!existing.data) {
    const { error } = await dialogueResultsTable(input.client).insert({
      activity_id: input.context.activity.activity_id,
      activity_result: result.activityResult,
      analytics_tags: result.analyticsTags,
      criteria_met: result.criteriaMet,
      criteria_missing: result.criteriaMissing,
      enrollment_id: input.context.enrollmentId,
      instructor_summary: result.instructorSummary,
      payload: result,
      score: result.score,
      session_id: input.session.session_id,
      student_feedback: result.studentFeedback,
      user_id: input.context.userId,
    })

    if (error) {
      throw new DialogueRuntimeError(
        'DIALOGUE_PERSISTENCE_FAILED',
        500,
        'No fue posible guardar el resultado del dialogo',
        { message: error.message },
      )
    }
  }

  await syncDialogueResultToActivitySubmission({
    client: input.client,
    context: input.context,
    result,
    session: input.session,
  })

  return result
}
