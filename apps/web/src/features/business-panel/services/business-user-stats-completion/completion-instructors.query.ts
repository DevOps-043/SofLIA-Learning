import { logger } from '../../../../lib/utils/logger'
import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type { BusinessUserStatsInstructorRecord } from './completion.records'

export async function fetchInstructorsByIds(
  supabase: BusinessUserStatsSupabaseClient,
  instructorIds: string[],
): Promise<BusinessUserStatsInstructorRecord[]> {
  const result =
    instructorIds.length > 0
      ? await supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', instructorIds)
      : { data: [], error: null }

  if (result.error) logger.error('Error fetching instructors:', result.error)
  return (result.data || []) as BusinessUserStatsInstructorRecord[]
}
