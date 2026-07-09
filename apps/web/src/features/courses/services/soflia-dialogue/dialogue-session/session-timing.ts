import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { dialogueSessionsTable } from '../dialogue-tables'
import type { DialogueSessionRow } from '../dialogue-table-rows'

export type DialogueActiveSecondsReason = 'policy_closed' | 'inactivity_timeout'

/**
 * Persists the gap-capped active-time measurement for a dialogue session
 * (see compute-active-seconds.ts). Called once per closing event — either
 * when the policy engine reaches a terminal state (dialogue-runtime.service.ts)
 * or when the inactivity cron closes an abandoned session
 * (netlify/functions/process-inactive-dialogue-sessions).
 */
export async function recordDialogueActiveSeconds(input: {
  activeSeconds: number
  client: unknown
  reason: DialogueActiveSecondsReason
  sessionId: string
}): Promise<DialogueSessionRow> {
  const { data, error } = await dialogueSessionsTable(input.client)
    .update({
      active_seconds: input.activeSeconds,
      active_seconds_reason: input.reason,
      active_seconds_updated_at: new Date().toISOString(),
    })
    .eq('session_id', input.sessionId)
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible registrar el tiempo activo del dialogo',
      { message: error?.message },
    )
  }

  return data
}
