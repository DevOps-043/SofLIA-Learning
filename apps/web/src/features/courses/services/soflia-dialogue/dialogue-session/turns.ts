import type { DialogueState } from '../../../types/dialogue-runtime'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import {
  dialogueTurnsTable,
  type DialogueSessionRow,
} from '../dialogue-tables'

export async function getDialogueTurns(client: unknown, sessionId: string) {
  const { data, error } = await dialogueTurnsTable(client)
    .select(SELECT_COLUMNS.soflia_dialogue_turns)
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: true })

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar los turnos del dialogo',
      { message: error.message },
    )
  }

  return data ?? []
}

export async function findTurnByClientTurnId(input: {
  client: unknown
  clientTurnId: string
  sessionId: string
}) {
  const { data, error } = await dialogueTurnsTable(input.client)
    .select(SELECT_COLUMNS.soflia_dialogue_turns)
    .eq('session_id', input.sessionId)
    .eq('client_turn_id', input.clientTurnId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el turno idempotente',
      { message: error.message },
    )
  }

  return data
}

export async function insertDialogueTurn(input: {
  client: unknown
  clientTurnId?: string | null
  content: string
  metadata?: Record<string, unknown>
  role: 'user' | 'assistant' | 'system'
  session: DialogueSessionRow
  stateAfter?: DialogueState | null
  stateBefore?: DialogueState | null
  turnNumber?: number
}) {
  const nextTurnNumber = input.turnNumber ?? input.session.turns_count + 1
  const { data, error } = await dialogueTurnsTable(input.client)
    .insert({
      client_turn_id: input.clientTurnId ?? null,
      content: input.content,
      metadata: input.metadata ?? {},
      role: input.role,
      session_id: input.session.session_id,
      state_after: input.stateAfter ?? null,
      state_before: input.stateBefore ?? input.session.state,
      turn_number: nextTurnNumber,
    })
    .select(SELECT_COLUMNS.soflia_dialogue_turns)
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible guardar el turno del dialogo',
      { message: error?.message },
    )
  }

  return data
}
