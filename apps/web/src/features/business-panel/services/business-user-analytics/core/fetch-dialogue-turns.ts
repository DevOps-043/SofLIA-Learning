import { fromLoose } from '@/lib/supabase/looseQuery'
import { chunkArray } from './chunk-array'
import { DialogueTurnRecord } from './dialogue-turn-record'
import { logQueryError } from './log-query-error'

/**
 * Lee los turnos de las sesiones de diálogo indicadas (chunked por `session_id`,
 * igual que `fetchLiaMessages`). `soflia_dialogue_turns` es `service_role only`, por
 * eso recibe el cliente elevado (ver `fetch-query-data.ts`).
 */
export async function fetchDialogueTurns(
  serviceClient: unknown,
  sessionIds: string[],
): Promise<DialogueTurnRecord[]> {
  if (sessionIds.length === 0) return []

  const rows: DialogueTurnRecord[] = []
  for (const chunk of chunkArray(sessionIds, 200)) {
    const { data, error } = await fromLoose<DialogueTurnRecord>(serviceClient, 'soflia_dialogue_turns')
      .select('session_id, role, created_at')
      .in('session_id', chunk)

    logQueryError('business user dialogue turns', error)
    if (data) rows.push(...data)
  }

  return rows
}
