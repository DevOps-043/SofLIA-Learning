import {
  isTerminalDialogueState,
  type DialogueEvaluationResult,
  type DialoguePolicyDecision,
} from '../../../types/dialogue-runtime'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import {
  dialogueSessionsTable,
  type DialogueSessionRow,
} from '../dialogue-tables'

export async function updateDialogueSessionAfterTurn(input: {
  client: unknown
  evaluation: DialogueEvaluationResult
  policy: DialoguePolicyDecision
  session: DialogueSessionRow
}) {
  const nextState = input.policy.nextState
  const lowEvidenceTurns =
    input.evaluation.decision === 'low_evidence'
      ? input.session.low_evidence_turns + 1
      : 0
  const hintsUsed =
    nextState === 'HINT' ? input.session.hints_used + 1 : input.session.hints_used
  const turnsCount = input.session.turns_count + 1
  const now = new Date().toISOString()

  const { data, error } = await dialogueSessionsTable(input.client)
    .update({
      completed_at: isTerminalDialogueState(nextState) ? now : null,
      criteria_met: input.evaluation.criteriaMet,
      criteria_missing: input.evaluation.criteriaMissing,
      current_score: input.evaluation.overallScore,
      hints_used: hintsUsed,
      low_evidence_turns: lowEvidenceTurns,
      state: nextState,
      turns_count: turnsCount,
      updated_at: now,
    })
    .eq('session_id', input.session.session_id)
    .select('*')
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible actualizar la sesion del dialogo',
      { message: error?.message },
    )
  }

  return data
}
