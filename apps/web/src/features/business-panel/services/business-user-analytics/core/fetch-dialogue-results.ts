import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { AnalyticsScope } from './analytics-scope'
import { DialogueResultRecord } from './dialogue-result-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Lee los resultados finalizados de actividades de diálogo (`ai_chat`) del usuario,
 * acotados a los enrollments del scope (misma estrategia que `fetchActivitySubmissions`).
 *
 * `soflia_dialogue_results` es `service_role only` y NO está en los tipos `Database`,
 * por eso se usa `fromLoose` con un cliente elevado (ver `fetch-query-data.ts`).
 */
export async function fetchDialogueResults(
  serviceClient: unknown,
  userId: string,
  scope: AnalyticsScope,
): Promise<DialogueResultRecord[]> {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await fromLoose<DialogueResultRecord>(serviceClient, 'soflia_dialogue_results')
    .select(SELECT_COLUMNS.soflia_dialogue_results)
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)

  logQueryError('business user dialogue results', error)
  return data || []
}
