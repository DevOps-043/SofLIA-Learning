import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '../../../lib/utils/logger'

export interface BusinessUserStatsDialogueSessionRecord {
  active_seconds: number | null
}

/**
 * Tiempo real de dialogo con SofLIA para el modal individual "Estadisticas de
 * [Usuario]". `soflia_dialogue_sessions` es `service_role only` por RLS y no
 * esta en los tipos `Database` generados, por eso se usa un cliente elevado +
 * `fromLoose` (mismo patron que dialogue-service-client.ts en
 * business-user-analytics/core). Se degrada de forma suave a `[]` si el
 * service role no esta configurado, en vez de romper el resto del modal.
 */
export async function fetchBusinessUserDialogueSessions(
  userId: string,
): Promise<BusinessUserStatsDialogueSessionRecord[]> {
  let serviceClient: unknown
  try {
    serviceClient = createBusinessUsersAdminClient()
  } catch (error) {
    logger.error('Business user dialogue service client unavailable', { error, userId })
    return []
  }

  const { data, error } = await fromLoose<BusinessUserStatsDialogueSessionRecord>(
    serviceClient,
    'soflia_dialogue_sessions',
  )
    .select('active_seconds')
    .eq('user_id', userId)

  if (error) {
    logger.error('Error fetching business user dialogue sessions', { error, userId })
  }

  return data || []
}
