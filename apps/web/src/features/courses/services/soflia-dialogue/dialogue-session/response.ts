import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import {
  dialogueResultsTable,
  type DialogueResultRow,
  type DialogueSessionRow,
  type DialogueTurnRow,
} from '../dialogue-tables'
import { isDialogueStuckOnTechnicalFailures } from '../dialogue-technical-recovery.service'
import { normalizeSessionState } from './session-state'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function getDialogueResult(client: unknown, sessionId: string) {
  const { data, error } = await dialogueResultsTable(client)
    .select(SELECT_COLUMNS.soflia_dialogue_results)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el resultado del dialogo',
      { message: error.message },
    )
  }

  return data
}

export function toDialogueSessionResponse(input: {
  result?: DialogueResultRow | null
  session: DialogueSessionRow
  turns: DialogueTurnRow[]
}) {
  return {
    sessionId: input.session.session_id,
    state: normalizeSessionState(input.session.state),
    score: Number(input.session.current_score ?? 0),
    turnsCount: input.session.turns_count,
    hintsUsed: input.session.hints_used,
    criteriaMet: input.session.criteria_met ?? [],
    criteriaMissing: input.session.criteria_missing ?? [],
    startedAt: input.session.started_at,
    completedAt: input.session.completed_at,
    // La sesión quedó bloqueada por fallos técnicos persistentes del evaluador (no por
    // desempeño del estudiante): la UI debe ofrecer reiniciar la actividad.
    stuckOnTechnicalFailure: isDialogueStuckOnTechnicalFailures(input.turns),
    messages: input.turns.map((turn) => ({
      id: turn.turn_id,
      role: turn.role,
      content: turn.content,
      createdAt: turn.created_at,
    })),
    result: input.result
      ? {
          activityResult: input.result.activity_result,
          score: Number(input.result.score ?? 0),
          studentFeedback: input.result.student_feedback,
          criteriaMet: input.result.criteria_met ?? [],
          criteriaMissing: input.result.criteria_missing ?? [],
          analyticsTags: input.result.analytics_tags ?? [],
        }
      : null,
  }
}
