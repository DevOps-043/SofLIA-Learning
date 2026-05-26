import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
} from '../../types/dialogue-runtime'
import type { CourseActivityContext } from '../activity-submission.server.service'
import { buildDialogueSessionResult } from './dialogue-result-builder.service'
import { syncDialogueResultToActivitySubmission } from './dialogue-result-submission-sync.service'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import { dialogueResultsTable, type DialogueSessionRow } from './dialogue-tables'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

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
    .select(SELECT_COLUMNS.soflia_dialogue_results)
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
