import { createClient } from '../../../lib/supabase/server'
import {
  fetchBaseCompletionData,
  fetchDerivedCompletionData,
} from './business-user-stats-completion/completion-query.service'
import type { CompletionQueryData } from './business-user-stats-completion/completion.data'

type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type { CompletionQueryData }

export async function fetchCompletionData(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
): Promise<CompletionQueryData> {
  const baseData = await fetchBaseCompletionData(supabase, organizationId, userId)
  const derivedData = await fetchDerivedCompletionData(supabase, baseData)

  return {
    ...baseData,
    ...derivedData,
  }
}
