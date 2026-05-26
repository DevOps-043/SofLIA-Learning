import {
  type DialogueEvaluationResult,
} from '../../../types/dialogue-runtime'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { dialogueEvaluationsTable } from '../dialogue-tables'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function getDialogueEvaluations(client: unknown, sessionId: string) {
  const { data, error } = await dialogueEvaluationsTable(client)
    .select(SELECT_COLUMNS.soflia_dialogue_evaluations)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar las evaluaciones del dialogo',
      { message: error.message },
    )
  }

  return data ?? []
}

export async function insertDialogueEvaluation(input: {
  client: unknown
  evaluation: DialogueEvaluationResult
  modelName: string
  sessionId: string
  turnId: string
}) {
  const { data, error } = await dialogueEvaluationsTable(input.client)
    .insert({
      backend_notes: input.evaluation.backendNotes,
      criteria_met: input.evaluation.criteriaMet,
      criteria_missing: input.evaluation.criteriaMissing,
      decision: input.evaluation.decision,
      dimension_scores: input.evaluation.dimensionScores,
      evidence_quotes: input.evaluation.evidenceQuotes,
      feedback_for_tutor: input.evaluation.feedbackForTutor,
      flags: input.evaluation.flags,
      model_name: input.modelName,
      overall_score: input.evaluation.overallScore,
      raw_payload: input.evaluation,
      recommended_next_state: input.evaluation.recommendedNextState,
      session_id: input.sessionId,
      turn_id: input.turnId,
    })
    .select(SELECT_COLUMNS.soflia_dialogue_evaluations)
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible guardar la evaluacion del dialogo',
      { message: error?.message },
    )
  }

  return data
}
