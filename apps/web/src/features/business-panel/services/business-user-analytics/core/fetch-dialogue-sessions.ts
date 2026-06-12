import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { AnalyticsScope } from './analytics-scope'
import { DialogueSessionRecord } from './dialogue-session-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Lee las sesiones de diálogo (`ai_chat`) del usuario acotadas al scope. Se usan en
 * analytics solo para detectar conversaciones EN PROGRESO (sin resultado finalizado);
 * el puntaje/feedback autoritativos viven en `soflia_dialogue_results`.
 *
 * `soflia_dialogue_sessions` es `service_role only` y no está en los tipos `Database`,
 * por eso se usa `fromLoose` con un cliente elevado (ver `fetch-query-data.ts`).
 */
export async function fetchDialogueSessions(
  serviceClient: unknown,
  userId: string,
  scope: AnalyticsScope,
): Promise<DialogueSessionRecord[]> {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await fromLoose<DialogueSessionRecord>(serviceClient, 'soflia_dialogue_sessions')
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)

  logQueryError('business user dialogue sessions', error)
  return data || []
}
