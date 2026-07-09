import { computeDialogueActiveSeconds } from './compute-active-seconds'
import type { AdminSupabaseClient } from './client'
import type { DialogueTurnTimestamp, PendingInactivityCloseSession } from './types'

/**
 * Closes one abandoned dialogue session by recording its gap-capped active
 * time. Deliberately never touches `state` — an abandoned session must stay
 * resumable (getActiveDialogueSession keeps finding it) and must not burn
 * one of the user's 3 allowed attempts (createDialogueSession only counts
 * terminal-state sessions).
 */
export async function processInactiveDialogueSession(
  supabase: AdminSupabaseClient,
  session: PendingInactivityCloseSession,
): Promise<{ activeSeconds: number }> {
  const { data: turns, error: turnsError } = await supabase
    .from('soflia_dialogue_turns')
    .select('created_at')
    .eq('session_id', session.session_id)
    .order('created_at', { ascending: true })

  if (turnsError) {
    throw new Error(
      `No fue posible consultar los turnos de la sesion ${session.session_id}: ${turnsError.message}`,
    )
  }

  const activeSeconds = computeDialogueActiveSeconds(
    (turns ?? []) as DialogueTurnTimestamp[],
  )

  const { error: updateError } = await supabase
    .from('soflia_dialogue_sessions')
    .update({
      active_seconds: activeSeconds,
      active_seconds_reason: 'inactivity_timeout',
      active_seconds_updated_at: new Date().toISOString(),
    })
    .eq('session_id', session.session_id)

  if (updateError) {
    throw new Error(
      `No fue posible registrar el tiempo activo de la sesion ${session.session_id}: ${updateError.message}`,
    )
  }

  return { activeSeconds }
}
